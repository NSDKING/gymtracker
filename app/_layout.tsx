import { useEffect, useState } from 'react'
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { initRevenueCat, checkProStatus } from '@/lib/revenue-cat'
import AsyncStorage from '@react-native-async-storage/async-storage'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const [onboarded, setOnboarded] = useState(false)

  useEffect(() => {
    const init = async () => {
      // Auth
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)

      // RevenueCat
      initRevenueCat()
      await checkProStatus()

      // Onboarding flag
      const onboardingComplete = await AsyncStorage.getItem('onboardingComplete')
      setOnboarded(!!onboardingComplete)

      setReady(true)
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!ready) return
    SplashScreen.hideAsync()
    if (!onboarded) {
      router.replace('/onboarding')
    } else {
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