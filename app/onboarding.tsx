import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as AppleAuthentication from 'expo-apple-authentication'
import { supabase } from '../lib/supabase'
import { useStore } from '../store'
import { generateAIWorkout } from '../lib/ai'
import type { ExperienceLevel, Equipment } from '../store'

const ACCENT = '#C8F065'
const CARD = '#1a1a1a'
const BORDER = '#2a2a2a'
const MUTED = '#8e8e93'
const DIM = '#3a3a3c'

const MUSCLES = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core']
const GOALS = ['Build Muscle', 'Increase Strength', 'Lose Fat', 'Improve Endurance', 'General Fitness']
const DAYS = [2, 3, 4, 5, 6]

const FEATURES = [
  { icon: '📊', title: 'Heatmap calendar', sub: 'See every training day at a glance' },
  { icon: '⚡', title: 'Automatic PR detection', sub: 'Know instantly when you beat a record' },
  { icon: '📈', title: 'Volume & progress charts', sub: 'Track strength gains over time' },
  { icon: '🤖', title: 'AI coaching', sub: 'Personalized recommendations & programs' },
]

// ─── STEP 0 — WELCOME ─────────────────────────────────────────────────────────

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

// ─── STEP 1 — EXPERIENCE LEVEL ───────────────────────────────────────────────

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; icon: string; label: string; sub: string }[] = [
  { value: 'beginner', icon: '🌱', label: 'Beginner', sub: 'Less than 1 year of consistent training' },
  { value: 'intermediate', icon: '💪', label: 'Intermediate', sub: '1–3 years, know the main lifts' },
  { value: 'advanced', icon: '🏆', label: 'Advanced', sub: '3+ years, track PRs and periodize' },
]

function StepExperience({
  value, onChange, onNext, onBack,
}: { value: ExperienceLevel; onChange: (v: ExperienceLevel) => void; onNext: () => void; onBack: () => void }) {
  return (
    <View style={styles.stepWrap}>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>What's your{'\n'}experience level?</Text>
        <Text style={styles.stepSub}>
          This helps the AI coach set realistic targets and appropriate volume.
        </Text>
        <View style={styles.optionList}>
          {EXPERIENCE_OPTIONS.map((opt) => {
            const active = value === opt.value
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.optionCard, active && styles.optionCardActive]}
                onPress={() => onChange(opt.value)}
                activeOpacity={0.7}
              >
                <Text style={styles.optionIcon}>{opt.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{opt.label}</Text>
                  <Text style={styles.optionSub}>{opt.sub}</Text>
                </View>
                <View style={[styles.optionRadio, active && styles.optionRadioActive]}>
                  {active && <View style={styles.optionRadioDot} />}
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
      <View style={styles.stepFooter}>
        <TouchableOpacity style={styles.btnPrimary} onPress={onNext} activeOpacity={0.85}>
          <Text style={styles.btnPrimaryText}>Continue →</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.btnGhost}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ─── STEP 2 — GOAL + DAYS PER WEEK ───────────────────────────────────────────

function StepGoal({
  goal, setGoal, daysPerWeek, setDaysPerWeek, onNext, onBack,
}: {
  goal: string; setGoal: (v: string) => void
  daysPerWeek: number; setDaysPerWeek: (v: number) => void
  onNext: () => void; onBack: () => void
}) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>What's your{'\n'}main goal?</Text>
        <Text style={styles.stepSub}>The AI will tailor reps, sets, and exercise selection accordingly.</Text>
        <View style={styles.chipGrid}>
          {GOALS.map((g) => {
            const active = goal === g
            return (
              <TouchableOpacity
                key={g}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setGoal(g)}
                activeOpacity={0.7}
              >
                {active && <Text style={{ fontSize: 10, color: ACCENT, marginRight: 5 }}>✓</Text>}
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{g}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <Text style={[styles.stepTitle, { fontSize: 22, marginTop: 28, marginBottom: 8 }]}>
          Days per week?
        </Text>
        <Text style={styles.stepSub}>How many days can you commit to training?</Text>
        <View style={styles.chipGrid}>
          {DAYS.map((d) => {
            const active = daysPerWeek === d
            return (
              <TouchableOpacity
                key={d}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setDaysPerWeek(d)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{d} days</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
      <View style={styles.stepFooter}>
        <TouchableOpacity style={styles.btnPrimary} onPress={onNext} activeOpacity={0.85}>
          <Text style={styles.btnPrimaryText}>Continue →</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.btnGhost}>Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

// ─── STEP 3 — EQUIPMENT ───────────────────────────────────────────────────────

const EQUIPMENT_OPTIONS: { value: Equipment; icon: string; label: string; sub: string }[] = [
  { value: 'full_gym', icon: '🏋️', label: 'Full Gym', sub: 'Barbells, cables, machines, dumbbells' },
  { value: 'home_gym', icon: '🏠', label: 'Home Gym', sub: 'Dumbbells, bench, some equipment' },
  { value: 'bodyweight', icon: '🤸', label: 'Bodyweight', sub: 'No equipment needed' },
]

function StepEquipment({
  value, onChange, onNext, onBack,
}: { value: Equipment; onChange: (v: Equipment) => void; onNext: () => void; onBack: () => void }) {
  return (
    <View style={styles.stepWrap}>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>What's your{'\n'}setup?</Text>
        <Text style={styles.stepSub}>
          The AI will only suggest exercises you can actually do.
        </Text>
        <View style={styles.optionList}>
          {EQUIPMENT_OPTIONS.map((opt) => {
            const active = value === opt.value
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.optionCard, active && styles.optionCardActive]}
                onPress={() => onChange(opt.value)}
                activeOpacity={0.7}
              >
                <Text style={styles.optionIcon}>{opt.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{opt.label}</Text>
                  <Text style={styles.optionSub}>{opt.sub}</Text>
                </View>
                <View style={[styles.optionRadio, active && styles.optionRadioActive]}>
                  {active && <View style={styles.optionRadioDot} />}
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
      <View style={styles.stepFooter}>
        <TouchableOpacity style={styles.btnPrimary} onPress={onNext} activeOpacity={0.85}>
          <Text style={styles.btnPrimaryText}>Continue →</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.btnGhost}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ─── STEP 4 — MUSCLE FOCUS + INJURIES ─────────────────────────────────────────

function StepMuscles({
  value, onChange, injuries, setInjuries, onNext, onBack,
}: {
  value: string[]; onChange: (v: string[]) => void
  injuries: string; setInjuries: (v: string) => void
  onNext: () => void; onBack: () => void
}) {
  const toggle = (m: string) => {
    onChange(value.includes(m) ? value.filter((x) => x !== m) : [...value, m])
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>What do you{'\n'}want to train?</Text>
        <Text style={styles.stepSub}>
          Pick your focus areas. We'll suggest exercises and track progress by muscle group.
        </Text>
        <View style={styles.chipGrid}>
          {MUSCLES.map((m) => {
            const active = value.includes(m)
            return (
              <TouchableOpacity
                key={m}
                onPress={() => toggle(m)}
                activeOpacity={0.7}
                style={[styles.chip, active && styles.chipActive]}
              >
                {active && <Text style={{ fontSize: 10, color: ACCENT, marginRight: 5 }}>✓</Text>}
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{m}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
        <Text style={styles.selectedCount}>
          {value.length} muscle group{value.length !== 1 ? 's' : ''} selected
        </Text>

        <Text style={[styles.stepTitle, { fontSize: 20, marginTop: 28, marginBottom: 6 }]}>
          Any injuries or limitations?
        </Text>
        <Text style={[styles.stepSub, { marginBottom: 10 }]}>Optional — the AI will avoid or adapt exercises accordingly.</Text>
        <TextInput
          style={styles.injuriesInput}
          placeholder="e.g. bad left knee, shoulder impingement…"
          placeholderTextColor={DIM}
          value={injuries}
          onChangeText={setInjuries}
          multiline
          numberOfLines={3}
        />
      </View>
      <View style={styles.stepFooter}>
        <TouchableOpacity
          style={[styles.btnPrimary, value.length === 0 && { opacity: 0.4 }]}
          onPress={onNext}
          disabled={value.length === 0}
          activeOpacity={0.85}
        >
          <Text style={styles.btnPrimaryText}>Continue →</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.btnGhost}>Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

// ─── STEP 5 — BODY STATS ─────────────────────────────────────────────────────

function StepBodyStats({
  goal,
  weightUnit, setWeightUnit,
  heightUnit, setHeightUnit,
  bodyWeight, setBodyWeight,
  bodyHeight, setBodyHeight,
  targetBodyWeight, setTargetBodyWeight,
  onNext, onBack,
}: {
  goal: string
  weightUnit: 'kg' | 'lbs'; setWeightUnit: (v: 'kg' | 'lbs') => void
  heightUnit: 'cm' | 'ft'; setHeightUnit: (v: 'cm' | 'ft') => void
  bodyWeight: string; setBodyWeight: (v: string) => void
  bodyHeight: string; setBodyHeight: (v: string) => void
  targetBodyWeight: string; setTargetBodyWeight: (v: string) => void
  onNext: () => void; onBack: () => void
}) {
  const showTarget = ['Lose Fat', 'Build Muscle', 'Increase Strength'].includes(goal)

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Body stats</Text>
        <Text style={styles.stepSub}>
          Helps the AI set smarter targets. All optional — you can fill these in later.
        </Text>

        {/* Weight */}
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Current weight</Text>
          <View style={styles.statInputWrap}>
            <TextInput
              style={styles.statInput}
              value={bodyWeight}
              onChangeText={setBodyWeight}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={DIM}
            />
            <View style={styles.unitToggle}>
              {(['kg', 'lbs'] as const).map(u => (
                <TouchableOpacity
                  key={u}
                  style={[styles.unitBtn, weightUnit === u && styles.unitBtnActive]}
                  onPress={() => setWeightUnit(u)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.unitTxt, weightUnit === u && styles.unitTxtActive]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Height */}
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Height</Text>
          <View style={styles.statInputWrap}>
            <TextInput
              style={styles.statInput}
              value={bodyHeight}
              onChangeText={setBodyHeight}
              keyboardType="decimal-pad"
              placeholder={heightUnit === 'cm' ? '175' : '5\'10"'}
              placeholderTextColor={DIM}
            />
            <View style={styles.unitToggle}>
              {(['cm', 'ft'] as const).map(u => (
                <TouchableOpacity
                  key={u}
                  style={[styles.unitBtn, heightUnit === u && styles.unitBtnActive]}
                  onPress={() => setHeightUnit(u)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.unitTxt, heightUnit === u && styles.unitTxtActive]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Target weight — shown for weight-relevant goals */}
        {showTarget && (
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>
              Target weight
              <Text style={{ color: DIM, fontSize: 12 }}> ({weightUnit})</Text>
            </Text>
            <View style={styles.statInputWrap}>
              <TextInput
                style={[styles.statInput, { flex: 1 }]}
                value={targetBodyWeight}
                onChangeText={setTargetBodyWeight}
                keyboardType="decimal-pad"
                placeholder="e.g. 80"
                placeholderTextColor={DIM}
              />
              <View style={[styles.unitToggle, { backgroundColor: 'transparent', borderWidth: 0 }]}>
                <Text style={{ color: MUTED, fontSize: 13, paddingHorizontal: 10 }}>{weightUnit}</Text>
              </View>
            </View>
            <Text style={styles.statHint}>
              {goal === 'Lose Fat'
                ? 'The AI will calibrate volume to support a cut'
                : 'The AI will set progressive targets toward this goal'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.stepFooter}>
        <TouchableOpacity style={styles.btnPrimary} onPress={onNext} activeOpacity={0.85}>
          <Text style={styles.btnPrimaryText}>Continue →</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.btnGhost}>Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

// ─── STEP 6 — APPLE SIGN IN ───────────────────────────────────────────────────

function StepAuth({ onFinish }: { onFinish: () => void }) {
  const [error, setError] = useState<string | null>(null)

  const handleAppleSignIn = async () => {
    try {
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

const TOTAL_STEPS = 6

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets()
  const [step, setStep] = useState(0)

  const store = useStore()
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('intermediate')
  const [goal, setGoal] = useState('Build Muscle')
  const [daysPerWeek, setDaysPerWeek] = useState(4)
  const [equipment, setEquipment] = useState<Equipment>('full_gym')
  const [focusMuscles, setFocusMuscles] = useState<string[]>(['Chest', 'Back', 'Legs'])
  const [injuries, setInjuries] = useState('')
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg')
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm')
  const [bodyWeight, setBodyWeight] = useState('')
  const [bodyHeight, setBodyHeight] = useState('')
  const [targetBodyWeight, setTargetBodyWeight] = useState('')

  const finish = async () => {
    store.setExperienceLevel(experienceLevel)
    store.setGoal(goal)
    store.setDaysPerWeek(daysPerWeek)
    store.setEquipment(equipment)
    store.setFocusMuscles(focusMuscles)
    store.setInjuries(injuries)
    store.setBodyStats(
      bodyWeight ? parseFloat(bodyWeight) : null,
      bodyHeight ? parseFloat(bodyHeight) : null,
      targetBodyWeight ? parseFloat(targetBodyWeight) : null,
      weightUnit,
      heightUnit,
    )

    await AsyncStorage.setItem('onboardingComplete', 'true')
    router.replace('/(main)/')

    if (store.isPro && !store.activeProgram) {
      generateAIWorkout(goal, daysPerWeek).then(plan => {
        store.setPendingPlan(plan)
      }).catch(() => {})
    }
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {step > 0 && (
        <View style={styles.stepIndicator}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.stepDot,
                i <= step - 1 && styles.stepDotActive,
                i === step - 1 && styles.stepDotCurrent,
              ]}
            />
          ))}
        </View>
      )}
      {step === 0 && <StepWelcome onNext={() => setStep(1)} />}
      {step === 1 && (
        <StepExperience
          value={experienceLevel}
          onChange={setExperienceLevel}
          onNext={() => setStep(2)}
          onBack={() => setStep(0)}
        />
      )}
      {step === 2 && (
        <StepGoal
          goal={goal}
          setGoal={setGoal}
          daysPerWeek={daysPerWeek}
          setDaysPerWeek={setDaysPerWeek}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <StepEquipment
          value={equipment}
          onChange={setEquipment}
          onNext={() => setStep(4)}
          onBack={() => setStep(2)}
        />
      )}
      {step === 4 && (
        <StepMuscles
          value={focusMuscles}
          onChange={setFocusMuscles}
          injuries={injuries}
          setInjuries={setInjuries}
          onNext={() => setStep(5)}
          onBack={() => setStep(3)}
        />
      )}
      {step === 5 && (
        <StepBodyStats
          goal={goal}
          weightUnit={weightUnit} setWeightUnit={setWeightUnit}
          heightUnit={heightUnit} setHeightUnit={setHeightUnit}
          bodyWeight={bodyWeight} setBodyWeight={setBodyWeight}
          bodyHeight={bodyHeight} setBodyHeight={setBodyHeight}
          targetBodyWeight={targetBodyWeight} setTargetBodyWeight={setTargetBodyWeight}
          onNext={() => setStep(6)}
          onBack={() => setStep(4)}
        />
      )}
      {step === 6 && <StepAuth onFinish={finish} />}
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
  scrollContent: { flexGrow: 1, justifyContent: 'space-between' },
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

  // Option cards (experience, equipment)
  optionList: { gap: 10 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 14, padding: 16,
  },
  optionCardActive: {
    backgroundColor: 'rgba(200,240,101,0.07)',
    borderColor: 'rgba(200,240,101,0.35)',
  },
  optionIcon: { fontSize: 26 },
  optionLabel: { fontSize: 15, fontWeight: '600', color: MUTED, marginBottom: 2 },
  optionLabelActive: { color: '#fff' },
  optionSub: { fontSize: 12, color: DIM },
  optionRadio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  optionRadioActive: { borderColor: ACCENT },
  optionRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: ACCENT },

  // Chips (goal, days, muscles)
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 999, borderWidth: 1, borderColor: BORDER, backgroundColor: CARD,
  },
  chipActive: {
    backgroundColor: 'rgba(200,240,101,0.1)',
    borderColor: 'rgba(200,240,101,0.3)',
  },
  chipText: { fontSize: 14, fontWeight: '500', color: MUTED },
  chipTextActive: { color: ACCENT },
  selectedCount: { fontSize: 12, color: DIM, marginTop: 4 },

  // Injuries input
  injuriesInput: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 12, padding: 14, color: '#fff', fontSize: 14,
    lineHeight: 20, textAlignVertical: 'top', minHeight: 80,
  },

  statRow: { marginBottom: 20 },
  statLabel: { fontSize: 13, fontWeight: '600', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  statInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statInput: {
    flex: 1, height: 48, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 12, paddingHorizontal: 14, fontSize: 16, fontWeight: '600', color: '#fff',
  },
  unitToggle: {
    flexDirection: 'row', backgroundColor: CARD,
    borderWidth: 1, borderColor: BORDER, borderRadius: 10, overflow: 'hidden',
  },
  unitBtn: { paddingHorizontal: 12, paddingVertical: 13 },
  unitBtnActive: { backgroundColor: 'rgba(200,240,101,0.15)' },
  unitTxt: { fontSize: 13, fontWeight: '600', color: MUTED },
  unitTxtActive: { color: ACCENT },
  statHint: { fontSize: 12, color: DIM, marginTop: 6, lineHeight: 17 },

  btnPrimary: {
    backgroundColor: ACCENT, borderRadius: 13, height: 52,
    alignItems: 'center', justifyContent: 'center',
  },
  btnPrimaryText: { fontSize: 16, fontWeight: '700', color: '#000' },
  btnGhost: { textAlign: 'center', fontSize: 14, color: MUTED, paddingVertical: 4 },
  footerNote: { textAlign: 'center', fontSize: 12, color: DIM },
})
