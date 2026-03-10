import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useStore, getPRs, getStreak, getTotalVolume } from '../../store/index'
import Heatmap from '../../components/Heatmap'
import WeeklyBars from '../../components/dashboard/WeeklyBars'
import StatGrid from '../../components/dashboard/StatGrid'
import PillNav from '../../components/dashboard/PillNav'
import PRList from '../../components/dashboard/PRList'
import { ACCENT, CARD, BORDER, MUTED } from '@/constants/theme'
 

export default function Dashboard() {
  const insets = useSafeAreaInsets()
  const { sessions, exercises } = useStore()
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
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
          <Text style={styles.iconBtnText}>⌕</Text>
        </TouchableOpacity>
      </View>

      <PillNav />
      <Heatmap sessions={sessions} />
      <StatGrid
        streak={streak}
        totalVol={totalVol}
        sessionCount={sessions.length}
        consistency={consistency}
      />
      <WeeklyBars sessions={sessions} />

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
})