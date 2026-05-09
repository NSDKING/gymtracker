import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useStore, getPRs, getStreak, getTotalVolume } from '../../store/index'
import Heatmap from '../../components/Heatmap'
import WeeklyBars from '../../components/dashboard/WeeklyBars'
import StatGrid from '../../components/dashboard/StatGrid'
import PillNav from '../../components/dashboard/PillNav'
import PRList from '../../components/dashboard/PRList'
import { ACCENT, CARD, BORDER, MUTED } from '@/constants/theme'
 

export default function Dashboard() {
  const insets = useSafeAreaInsets()
  const { sessions, exercises, isPro, pendingPlan, setActiveProgram, setPendingPlan, activeProgram } = useStore()
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
      {isPro && pendingPlan && (
        <View style={styles.pendingPlanCard}>
          <View style={styles.pendingPlanTop}>
            <Text style={styles.pendingPlanBadge}>✨ YOUR PLAN IS READY</Text>
            <TouchableOpacity onPress={() => setPendingPlan(null)}>
              <Text style={styles.pendingPlanDismiss}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.pendingPlanName}>{pendingPlan.planName}</Text>
          <Text style={styles.pendingPlanDesc}>{pendingPlan.description}</Text>
          <Text style={styles.pendingPlanMeta}>{pendingPlan.days.length}-day split</Text>
          <View style={styles.pendingPlanActions}>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => { setActiveProgram(pendingPlan); setPendingPlan(null) }}
            >
              <Text style={styles.acceptBtnTxt}>Accept Plan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => router.push('/ai-workout')}
            >
              <Text style={styles.editBtnTxt}>Edit →</Text>
            </TouchableOpacity>
          </View>
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

      {/* Today's Workout Card */}
      {activeProgram ? (() => {
        const dayIndex = sessions.length % activeProgram.days.length
        const day = activeProgram.days[dayIndex]
        const preview = day.exercises.slice(0, 4)
        const overflow = day.exercises.length - preview.length
        return (
          <View style={styles.workoutCard}>
            <View style={styles.workoutCardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.workoutCardBadge}>TODAY · {activeProgram.planName.toUpperCase()}</Text>
                <Text style={styles.workoutCardDay}>{day.dayName}</Text>
                <Text style={styles.workoutCardFocus}>{day.focus}</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/ai-workout')} style={styles.workoutEditBtn}>
                <Text style={styles.workoutEditTxt}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.workoutDivider} />
            {preview.map((ex, i) => (
              <View key={i} style={[styles.workoutExRow, i < preview.length - 1 && styles.workoutExRowBorder]}>
                <Text style={styles.workoutExName} numberOfLines={1}>{ex.name}</Text>
                <Text style={styles.workoutExSets}>{ex.sets} × {ex.reps}</Text>
                <Text style={styles.workoutExWeight}>{ex.targetWeight}</Text>
              </View>
            ))}
            {overflow > 0 && (
              <Text style={styles.workoutOverflow}>+{overflow} more exercise{overflow > 1 ? 's' : ''}</Text>
            )}
            <TouchableOpacity style={styles.workoutStartBtn} onPress={() => router.push('/log')} activeOpacity={0.85}>
              <Text style={styles.workoutStartTxt}>Start Workout →</Text>
            </TouchableOpacity>
          </View>
        )
      })() : (
        <TouchableOpacity style={styles.aiCard} onPress={() => router.push('/ai-recommend')} activeOpacity={0.85}>
          <View style={{ flex: 1 }}>
            <Text style={styles.aiCardTitle}>🤖 AI Coach</Text>
            <Text style={styles.aiCardSub}>Get a personalized recommendation based on your training history</Text>
          </View>
          <Text style={styles.aiCardArrow}>→</Text>
        </TouchableOpacity>
      )}

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
  workoutCard: {
    marginHorizontal: 14, marginBottom: 16,
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 14, padding: 16, gap: 0,
  },
  workoutCardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  workoutCardBadge: { fontSize: 10, fontWeight: '700', color: MUTED, letterSpacing: 1.2, marginBottom: 4 },
  workoutCardDay: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  workoutCardFocus: { fontSize: 12, color: ACCENT, fontWeight: '600', marginTop: 2 },
  workoutEditBtn: {
    borderWidth: 1, borderColor: BORDER, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  workoutEditTxt: { fontSize: 12, fontWeight: '600', color: MUTED },
  workoutDivider: { height: 1, backgroundColor: BORDER, marginBottom: 4 },
  workoutExRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, gap: 8,
  },
  workoutExRowBorder: { borderBottomWidth: 1, borderBottomColor: BORDER },
  workoutExName: { flex: 1, fontSize: 14, fontWeight: '500', color: '#fff' },
  workoutExSets: { fontSize: 13, color: MUTED, width: 64, textAlign: 'right' },
  workoutExWeight: { fontSize: 13, fontWeight: '600', color: ACCENT, width: 52, textAlign: 'right' },
  workoutOverflow: { fontSize: 12, color: MUTED, marginTop: 6, marginBottom: 2 },
  workoutStartBtn: {
    backgroundColor: ACCENT, borderRadius: 10, height: 44,
    alignItems: 'center', justifyContent: 'center', marginTop: 14,
  },
  workoutStartTxt: { fontSize: 14, fontWeight: '700', color: '#000' },
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
})