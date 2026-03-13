import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as AppleAuthentication from 'expo-apple-authentication'
import { supabase } from '../lib/supabase'

const ACCENT = '#C8F065'
const CARD = '#1a1a1a'
const BORDER = '#2a2a2a'
const MUTED = '#8e8e93'
const DIM = '#3a3a3c'

const MUSCLES = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core']

const FEATURES = [
  { icon: '📊', title: 'Heatmap calendar', sub: 'See every training day at a glance' },
  { icon: '⚡', title: 'Automatic PR detection', sub: 'Know instantly when you beat a record' },
  { icon: '📈', title: 'Volume & progress charts', sub: 'Track strength gains over time' },
  { icon: '🤖', title: 'AI recommendations', sub: 'Coming soon' },
]

// ─── STEP 1 — WELCOME ─────────────────────────────────────────────────────────

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <View style={styles.stepWrap}>
      <View style={styles.glowWrap}>
        <View style={styles.glow} />
        <Text style={styles.heroEmoji}>🏋️</Text>
      </View>
      <View style={styles.stepContent}>
        <Text style={styles.welcomeTitle}>Stop logging{'\n'}in WhatsApp.</Text>
        <Text style={styles.welcomeSub}>
          Track every set, rep, and kilo.{'\n'}See your progress. Beat your PRs.
        </Text>
        <View style={styles.featureList}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Text style={{ fontSize: 18 }}>{f.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureSub}>{f.sub}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.stepFooter}>
        <TouchableOpacity style={styles.btnPrimary} onPress={onNext} activeOpacity={0.85}>
          <Text style={styles.btnPrimaryText}>Get Started →</Text>
        </TouchableOpacity>
        <Text style={styles.footerNote}>Free forever · No credit card</Text>
      </View>
    </View>
  )
}

// ─── STEP 2 — MUSCLE FOCUS ────────────────────────────────────────────────────

function StepMuscles({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [selected, setSelected] = useState<string[]>(['Chest', 'Back', 'Legs'])

  const toggle = (m: string) => {
    setSelected((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    )
  }

  return (
    <View style={styles.stepWrap}>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>What do you{'\n'}want to train?</Text>
        <Text style={styles.stepSub}>
          Pick your focus areas. We'll suggest exercises and track progress by muscle group.
        </Text>
        <View style={styles.muscleGrid}>
          {MUSCLES.map((m) => {
            const active = selected.includes(m)
            return (
              <TouchableOpacity
                key={m}
                onPress={() => toggle(m)}
                activeOpacity={0.7}
                style={[styles.muscleChip, active && styles.muscleChipActive]}
              >
                {active && <Text style={{ fontSize: 10, color: ACCENT, marginRight: 5 }}>✓</Text>}
                <Text style={[styles.muscleChipText, active && styles.muscleChipTextActive]}>
                  {m}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
        <Text style={styles.selectedCount}>
          {selected.length} muscle group{selected.length !== 1 ? 's' : ''} selected
        </Text>
      </View>
      <View style={styles.stepFooter}>
        <TouchableOpacity
          style={[styles.btnPrimary, selected.length === 0 && { opacity: 0.4 }]}
          onPress={onNext}
          disabled={selected.length === 0}
          activeOpacity={0.85}
        >
          <Text style={styles.btnPrimaryText}>Continue →</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.btnGhost}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ─── STEP 3 — APPLE SIGN IN ───────────────────────────────────────────────────

function StepAuth({ onFinish }: { onFinish: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAppleSignIn = async () => {
    try {
      setLoading(true)
      setError(null)
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
      onFinish()
    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        // user cancelled, do nothing
      } else {
        setError('Sign in failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.stepWrap}>
      <View style={[styles.stepContent, { alignItems: 'center', paddingTop: 60 }]}>
        <Text style={{ fontSize: 72, marginBottom: 24 }}>🔐</Text>
        <Text style={[styles.stepTitle, { textAlign: 'center' }]}>
          Save your progress
        </Text>
        <Text style={[styles.stepSub, { textAlign: 'center' }]}>
          Sign in with Apple to back up your workouts and access them on any device.
        </Text>
        {error && (
          <Text style={{ color: '#ff453a', fontSize: 13, textAlign: 'center', marginTop: 8 }}>
            {error}
          </Text>
        )}
      </View>
      <View style={styles.stepFooter}>
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
          cornerRadius={13}
          style={{ height: 52 }}
          onPress={handleAppleSignIn}
        />
        <TouchableOpacity onPress={onFinish} activeOpacity={0.7}>
          <Text style={styles.btnGhost}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets()
  const [step, setStep] = useState(0)

  const finish = async () => {
    await AsyncStorage.setItem('onboardingComplete', 'true')
    router.replace('/(main)/')
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {step > 0 && (
        <View style={styles.stepIndicator}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.stepDot,
                i <= step && styles.stepDotActive,
                i === step && styles.stepDotCurrent,
              ]}
            />
          ))}
        </View>
      )}
      {step === 0 && <StepWelcome onNext={() => setStep(1)} />}
      {step === 1 && <StepMuscles onNext={() => setStep(2)} onBack={() => setStep(0)} />}
      {step === 2 && <StepAuth onFinish={finish} />}
    </View>
  )
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  stepDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: BORDER },
  stepDotActive: { backgroundColor: 'rgba(200,240,101,0.4)' },
  stepDotCurrent: { backgroundColor: ACCENT, width: 20 },
  stepWrap: { flex: 1, justifyContent: 'space-between' },
  stepContent: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  stepFooter: { paddingHorizontal: 24, paddingBottom: 24, gap: 12 },
  glowWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
    position: 'relative',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(200,240,101,0.08)',
  },
  heroEmoji: { fontSize: 72, position: 'relative' },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
    lineHeight: 42,
    marginBottom: 12,
  },
  welcomeSub: { fontSize: 15, color: MUTED, lineHeight: 22, marginBottom: 28 },
  featureList: { gap: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureIcon: {
    width: 40, height: 40, borderRadius: 11,
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  featureTitle: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 2 },
  featureSub: { fontSize: 12, color: MUTED },
  stepTitle: {
    fontSize: 32, fontWeight: '800', color: '#fff',
    letterSpacing: -0.8, lineHeight: 38, marginBottom: 12,
  },
  stepSub: { fontSize: 14, color: MUTED, lineHeight: 21, marginBottom: 24 },
  muscleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  muscleChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 999, borderWidth: 1, borderColor: BORDER, backgroundColor: CARD,
  },
  muscleChipActive: {
    backgroundColor: 'rgba(200,240,101,0.1)',
    borderColor: 'rgba(200,240,101,0.3)',
  },
  muscleChipText: { fontSize: 14, fontWeight: '500', color: MUTED },
  muscleChipTextActive: { color: ACCENT },
  selectedCount: { fontSize: 12, color: DIM, marginTop: 4 },
  btnPrimary: {
    backgroundColor: ACCENT, borderRadius: 13, height: 52,
    alignItems: 'center', justifyContent: 'center',
  },
  btnPrimaryText: { fontSize: 16, fontWeight: '700', color: '#000' },
  btnGhost: { textAlign: 'center', fontSize: 14, color: MUTED, paddingVertical: 4 },
  footerNote: { textAlign: 'center', fontSize: 12, color: DIM },
})