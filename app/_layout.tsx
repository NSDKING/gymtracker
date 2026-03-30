import { useEffect, useState } from 'react'
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { supabase } from '../lib/supabase'
import type { Session as SupaSession } from '@supabase/supabase-js'
import { initRevenueCat, checkProStatus } from '@/lib/revenue-cat'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { pullFromSupabase } from '@/lib/sync'
import { useStore } from '@/store/index'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [session, setSession] = useState<SupaSession | null>(null)
  const [ready, setReady] = useState(false)
  const [onboarded, setOnboarded] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        // 1. Authenticate with Supabase
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        setSession(currentSession)

        // 2. Initialize RevenueCat
        initRevenueCat()
        
        // 3. Check Subscription Status (Paid Feature Guard)
        const isPro = await checkProStatus()
        // Save pro status to Zustand so other screens can use it (e.g., to hide ads or show pro badges)
        useStore.setState({ isPro })

        // 4. Automatic Cloud Sync (Only for Paid Users)
        if (currentSession && isPro) {
          try {
            // This is what pulls Dimitri's data from the cloud into the app
            await pullFromSupabase()
            console.log("💎 Pro Sync: Cloud data hydrated.")
          } catch (syncError) {
            console.error("Auto-sync failed:", syncError)
          }
        } else {
          console.log(currentSession ? "👤 Free Tier: Sync skipped." : "🚪 No session: Sync skipped.")
        }

        // 5. Check if Onboarding is complete
        const onboardingComplete = await AsyncStorage.getItem('onboardingComplete')
        setOnboarded(!!onboardingComplete)

      } catch (e) {
        console.error("Critical initialization error:", e)
      } finally {
        // Ensure app is marked as ready even if sync fails
        setReady(true)
      }
    }

    init()

    // Listen for Auth State changes (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession)
      
      if (event === 'SIGNED_IN' && newSession) {
        // Re-check pro status on login to trigger sync immediately if they are Pro
        const isPro = await checkProStatus()
        useStore.setState({ isPro })
        if (isPro) await pullFromSupabase()
      }

      if (event === 'SIGNED_OUT') {
        // Wipe local store for security on logout
        useStore.setState({ sessions: [], exercises: [], isPro: false })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!ready) return
    
    SplashScreen.hideAsync()
    
    // Routing Logic
    if (!onboarded) {
      router.replace('/onboarding')
    } else {
      // Navigate to the main app dashboard
      //@ts-ignore
      router.replace('/(main)/')
    }
  }, [ready, onboarded])

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000' } }}>
        <Stack.Screen name="auth" />
        <Stack.Screen name="(main)" />
        <Stack.Screen name="log" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="session/[id]" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="exercise/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="paywall" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="ai-workout" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </>
  )
}