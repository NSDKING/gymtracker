import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator
} from 'react-native'
import * as AppleAuthentication from 'expo-apple-authentication'
import { supabase } from '../lib/supabase'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ACCENT, CARD, BORDER, MUTED, DIM } from '../constants/theme'
import { checkProStatus } from '@/lib/revenue-cat'
import { pullFromSupabase } from '@/lib/sync'
 import { useStore } from '@/store'
import { router } from 'expo-router'

export default function AuthScreen() {
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(false)

  const handleAppleSignIn = async () => {
    try {
      setLoading(true)
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      })

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken!,
      })

     if (error) throw error

    // Pull cloud data if Pro
    const isPro = await checkProStatus()
    if (isPro) {
        await pullFromSupabase()
        useStore.getState().setSyncEnabled(true)
    }
    useStore.getState().setIsLoggedIn(true)
    //@ts-ignore
    router.replace('/(main)/')
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Sign in failed', e.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + 40 }]}>
      <View style={styles.hero}>
        <Text style={styles.logo}>REPD</Text>
        <Text style={styles.tagline}>Track every lift.{'\n'}Hit every PR.</Text>
      </View>

      <View style={styles.bottom}>
        {loading ? (
          <ActivityIndicator color={ACCENT} />
        ) : (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={13}
            style={styles.appleBtn}
            onPress={handleAppleSignIn}
          />
        )}
        <Text style={styles.legal}>
          By continuing you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000', justifyContent: 'space-between' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: {
    fontSize: 80, fontWeight: '800', color: ACCENT,
    letterSpacing: 8, marginBottom: 20,
  },
  tagline: {
    fontSize: 28, fontWeight: '700', color: '#fff',
    textAlign: 'center', letterSpacing: -0.5, lineHeight: 36,
  },
  bottom: { paddingHorizontal: 24, gap: 16 },
  appleBtn: { width: '100%', height: 50 },
  legal: { fontSize: 11, color: DIM, textAlign: 'center', lineHeight: 16 },
})