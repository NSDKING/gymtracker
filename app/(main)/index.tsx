import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useStore, getPRs, getStreak, getTotalVolume, getScheduleInfo, generateDefaultWeeklySchedule } from '../../store/index'
import { generateAIWorkout } from '../../lib/ai'
import { scheduleWeeklyReminders } from '../../lib/notifications'
import Heatmap from '../../components/Heatmap'
import WeeklyBars from '../../components/dashboard/WeeklyBars'
import StatGrid from '../../components/dashboard/StatGrid'
import PillNav from '../../components/dashboard/PillNav'
import PRList from '../../components/dashboard/PRList'
import TodayWorkout from '../../components/dashboard/TodayWorkout'
import PlanAnalysisModal from '../../components/dashboard/PlanAnalysisModal'
import { ACCENT, CARD, BORDER, MUTED } from '@/constants/theme'


export default function Dashboard() {
  const insets = useSafeAreaInsets()
  const {
    sessions, exercises, isPro,
    pendingPlan, setPendingPlan,
    activeProgram, goal, daysPerWeek,
    activateNewProgram, weeklySchedule, planStartDate,
    notificationsEnabled, reminderHour,
  } = useStore()
  const [showSwap, setShowSwap] = useState(false)
  const [swapFeedback, setSwapFeedback] = useState('')
  const [swapLoading, setSwapLoading] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [skippedRest, setSkippedRest] = useState(false)

  const handleValidatePlan = () => {
    if (!pendingPlan) return
    activateNewProgram(pendingPlan, daysPerWeek)
    if (notificationsEnabled) {
      const newSchedule = generateDefaultWeeklySchedule(daysPerWeek)
      scheduleWeeklyReminders(newSchedule, pendingPlan.days, reminderHour).catch(() => {})
    }
    setPendingPlan(null)
    setShowSwap(false)
    setSkippedRest(false)
  }

  const handleSwap = async (feedback?: string) => {
    if (!isPro) { router.push('/paywall'); return }
    try {
      setSwapLoading(true)
      const result = await generateAIWorkout(goal, daysPerWeek, feedback)
      setPendingPlan(result)
      setShowSwap(false)
      setSwapFeedback('')
    } catch {
      Alert.alert('Error', 'Could not generate a new plan. Try again.')
    } finally {
      setSwapLoading(false)
    }
  }

  const prs = getPRs(sessions, exercises)
  const streak = getStreak(sessions)
  const totalVol = sessions.reduce((t, s) => t + getTotalVolume(s.entries), 0)

  const today = new Date()
  const thisMonth = today.toISOString().slice(0, 7)
  const trainedDaysThisMonth = new Set(
    sessions.filter((s) => s.date.startsWith(thisMonth)).map((s) => s.date)
  ).size
  const consistency = Math.round((trainedDaysThisMonth / today.getDate()) * 100)

  const prList = Object.entries(prs)
    .map(([exId, pr]) => ({
      exercise: exercises.find((e) => e.id === exId),
      ...pr,
    }))
    .filter((p) => p.exercise)
    .slice(0, 3)

  const monthLabel = today.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  // Compute today's scheduled workout
  const planDaysCount = activeProgram?.days.length ?? 0
  const { today: todayResult, nextWorkout: nextWorkoutIdx } = getScheduleInfo(
    weeklySchedule,
    planStartDate,
    planDaysCount,
    sessions.length,
  )

  const isRestDay = todayResult === 'rest' && !skippedRest
  const activeDayIndex = isRestDay
    ? 0  // won't be used (rest card shown instead)
    : skippedRest
      ? nextWorkoutIdx
      : (todayResult as number)

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.sub}>{monthLabel}</Text>
        </View>

      </View>

      <PillNav />

      {/* Pending AI plan card */}
      {pendingPlan && (
        <View style={styles.pendingPlanCard}>
          <View style={styles.pendingPlanTop}>
            <Text style={styles.pendingPlanBadge}>✨ PROPOSED PLAN</Text>
            <TouchableOpacity onPress={() => { setPendingPlan(null); setShowSwap(false) }}>
              <Text style={styles.pendingPlanDismiss}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.pendingPlanName}>{pendingPlan.planName}</Text>
          <Text style={styles.pendingPlanDesc}>{pendingPlan.description}</Text>
          <Text style={styles.pendingPlanMeta}>{pendingPlan.days.length}-day split</Text>

          <View style={styles.pendingPlanActions}>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={handleValidatePlan}
            >
              <Text style={styles.acceptBtnTxt}>Validate ✓</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => router.push('/ai-workout')}
            >
              <Text style={styles.editBtnTxt}>Edit →</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.swapToggleBtn, showSwap && styles.swapToggleBtnActive]}
              onPress={() => setShowSwap(v => !v)}
            >
              <Text style={[styles.swapToggleTxt, showSwap && styles.swapToggleTxtActive]}>↻</Text>
            </TouchableOpacity>
          </View>

          {showSwap && (
            <View style={styles.swapSection}>
              <TextInput
                style={styles.swapInput}
                placeholder="Tell the AI what to change… (optional)"
                placeholderTextColor={MUTED}
                value={swapFeedback}
                onChangeText={setSwapFeedback}
                multiline
                editable={!swapLoading}
              />
              <View style={styles.swapActions}>
                <TouchableOpacity
                  style={[styles.swapBtn, swapLoading && { opacity: 0.5 }]}
                  onPress={() => handleSwap()}
                  disabled={swapLoading}
                >
                  {swapLoading && !swapFeedback.trim()
                    ? <ActivityIndicator size="small" color={MUTED} />
                    : <Text style={styles.swapBtnTxt}>🎲 Try another</Text>
                  }
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.swapApplyBtn, (!swapFeedback.trim() || swapLoading) && { opacity: 0.4 }]}
                  onPress={() => handleSwap(swapFeedback.trim())}
                  disabled={!swapFeedback.trim() || swapLoading}
                >
                  {swapLoading && swapFeedback.trim()
                    ? <ActivityIndicator size="small" color="#000" />
                    : <Text style={styles.swapApplyTxt}>Apply →</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      <Heatmap sessions={sessions} />
      <StatGrid
        streak={streak}
        totalVol={totalVol}
        sessionCount={sessions.length}
        consistency={consistency}
      />
      <WeeklyBars sessions={sessions} />

      {/* Today's Workout */}
      {activeProgram && activeProgram.days.length > 0 ? (
        <TodayWorkout
          program={activeProgram}
          dayIndex={activeDayIndex}
          isRestDay={isRestDay}
          onSkipRest={() => setSkippedRest(true)}
          onAnalyze={() => setShowAnalysis(true)}
        />
      ) : (
        <TouchableOpacity style={styles.aiCard} onPress={() => router.push('/ai-recommend')} activeOpacity={0.85}>
          <View style={{ flex: 1 }}>
            <Text style={styles.aiCardTitle}>🤖 AI Coach</Text>
            <Text style={styles.aiCardSub}>Get a personalized recommendation based on your training history</Text>
          </View>
          <Text style={styles.aiCardArrow}>→</Text>
        </TouchableOpacity>
      )}

      {/* AI coach analysis — only when a program is active (Pro) */}
      {activeProgram && isPro && (
        <TouchableOpacity style={styles.analyseCard} onPress={() => setShowAnalysis(true)} activeOpacity={0.85}>
          <View style={{ flex: 1 }}>
            <Text style={styles.analyseTitle}>Coach Analysis</Text>
            <Text style={styles.analyseSub}>AI feedback on your current training & imbalances</Text>
          </View>
          <Text style={styles.analyseArrow}>→</Text>
        </TouchableOpacity>
      )}

      <PlanAnalysisModal visible={showAnalysis} onClose={() => setShowAnalysis(false)} />

      {/* Recent PRs */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Recent PRs</Text>
        <Text style={styles.sectionLink}>All</Text>
      </View>
      <PRList prs={prList} />

      {/* Empty state */}
      {sessions.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🏋️</Text>
          <Text style={styles.emptyTitle}>No sessions yet</Text>
          <Text style={styles.emptyText}>
            Tap Log Session to record your first workout
          </Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000',
    paddingTop: 40 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', paddingHorizontal: 16, paddingBottom: 10,
  },
  title: {
    fontSize: 40, fontWeight: '800', color: '#fff',
    letterSpacing: -1, lineHeight: 44,
  },
  sub: { fontSize: 14, color: MUTED, marginTop: 3 },
  iconBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  iconBtnText: {
    fontSize: 20, color: MUTED,
    includeFontPadding: false, textAlign: 'center',
  },
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 14,
    paddingTop: 4, paddingBottom: 8,
  },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  sectionLink: { fontSize: 14, color: ACCENT, fontWeight: '500' },
  emptyState: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 6 },
  emptyText: { fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 18 },
  aiCard: {
    marginHorizontal: 14, marginBottom: 16,
    backgroundColor: 'rgba(200,240,101,0.07)', borderWidth: 1,
    borderColor: 'rgba(200,240,101,0.25)', borderRadius: 14,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  aiCardTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 3 },
  aiCardSub: { fontSize: 12, color: MUTED, lineHeight: 16 },
  aiCardArrow: { fontSize: 20, fontWeight: '700', color: ACCENT },

  pendingPlanCard: {
    marginHorizontal: 14, marginBottom: 16,
    backgroundColor: 'rgba(200,240,101,0.06)', borderWidth: 1,
    borderColor: 'rgba(200,240,101,0.3)', borderRadius: 14, padding: 16, gap: 6,
  },
  pendingPlanTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pendingPlanBadge: { fontSize: 10, fontWeight: '800', color: ACCENT, letterSpacing: 1.2 },
  pendingPlanDismiss: { fontSize: 14, color: MUTED, paddingLeft: 12 },
  pendingPlanName: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.4, marginTop: 2 },
  pendingPlanDesc: { fontSize: 13, color: MUTED, lineHeight: 18, marginBottom: 4 },
  pendingPlanMeta: { fontSize: 12, color: ACCENT, fontWeight: '600' },
  pendingPlanActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  acceptBtn: {
    flex: 1, backgroundColor: ACCENT, borderRadius: 10,
    height: 42, alignItems: 'center', justifyContent: 'center',
  },
  acceptBtnTxt: { fontSize: 14, fontWeight: '700', color: '#000' },
  editBtn: {
    paddingHorizontal: 20, borderRadius: 10, height: 42,
    borderWidth: 1, borderColor: 'rgba(200,240,101,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  editBtnTxt: { fontSize: 14, fontWeight: '600', color: ACCENT },
  swapToggleBtn: {
    width: 42, height: 42, borderRadius: 10,
    borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  swapToggleBtnActive: { backgroundColor: 'rgba(200,240,101,0.1)', borderColor: 'rgba(200,240,101,0.4)' },
  swapToggleTxt: { fontSize: 18, color: MUTED },
  swapToggleTxtActive: { color: ACCENT },
  swapSection: { marginTop: 10, gap: 8 },
  swapInput: {
    backgroundColor: '#111', borderWidth: 1, borderColor: BORDER,
    borderRadius: 10, padding: 12, color: '#fff', fontSize: 14,
    minHeight: 60, textAlignVertical: 'top',
  },
  swapActions: { flexDirection: 'row', gap: 8 },
  swapBtn: {
    flex: 1, height: 40, borderRadius: 9,
    borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  swapBtnTxt: { fontSize: 13, fontWeight: '600', color: MUTED },
  swapApplyBtn: {
    flex: 1, height: 40, borderRadius: 9,
    backgroundColor: ACCENT,
    alignItems: 'center', justifyContent: 'center',
  },
  swapApplyTxt: { fontSize: 13, fontWeight: '700', color: '#000' },
  analyseCard: {
    marginHorizontal: 14, marginBottom: 16,
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  analyseTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 3 },
  analyseSub: { fontSize: 12, color: MUTED, lineHeight: 16 },
  analyseArrow: { fontSize: 20, fontWeight: '700', color: MUTED },
})
