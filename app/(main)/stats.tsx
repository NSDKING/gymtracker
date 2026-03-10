import React, { useState } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Header from '../../components/Header'
import AllTimeStats from '../../components/stats/AllTimeStats'
import WeeklyVolume from '../../components/stats/WeeklyVolume'
import ExerciseProgress from '../../components/stats/ExerciseProgress'
import MuscleBreakdown from '../../components/stats/MuscleBreakdown'
import { useStore, getTotalVolume } from '../../store/index'
import { MUTED } from '../../constants/theme'

export default function StatsScreen() {
  const insets = useSafeAreaInsets()
  const { sessions, exercises } = useStore()
  const [selectedExercise, setSelectedExercise] = useState(exercises[0]?.id ?? '')

  const today = new Date()

  // Weekly vols
  const weeklyVols = Array.from({ length: 8 }, (_, i) => {
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - (7 - i) * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    return sessions
      .filter((s) => { const d = new Date(s.date); return d >= weekStart && d <= weekEnd })
      .reduce((t, s) => t + getTotalVolume(s.entries), 0)
  })

  // Exercise progress
  const exerciseProgress = sessions
    .filter((s) => s.entries.some((e) => e.exerciseId === selectedExercise))
    .map((s) => {
      const entry = s.entries.find((e) => e.exerciseId === selectedExercise)
      return {
        date: s.date,
        weight: entry ? Math.max(...entry.sets.map((set) => set.weight)) : 0,
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date))

  const progressWeights = exerciseProgress.map((p) => p.weight)

  // Muscle breakdown
  const muscleVols: Record<string, number> = {}
  sessions.forEach((s) => {
    s.entries.forEach((e) => {
      const ex = exercises.find((x) => x.id === e.exerciseId)
      if (!ex) return
      const vol = e.sets.reduce((t, set) => t + set.reps * set.weight, 0)
      muscleVols[ex.muscle] = (muscleVols[ex.muscle] || 0) + vol
    })
  })
  const totalMuscleVol = Object.values(muscleVols).reduce((a, b) => a + b, 0) || 1
  const muscleEntries = Object.entries(muscleVols).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // All time
  const totalVol = sessions.reduce((t, s) => t + getTotalVolume(s.entries), 0)
  const totalSets = sessions.reduce((t, s) => t + s.entries.reduce((tt, e) => tt + e.sets.length, 0), 0)
  const avgSets = sessions.length ? (totalSets / sessions.length).toFixed(1) : '0'
  const bestWeekVol = Math.max(...weeklyVols, 0)

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <Header title="Analytics" subtitle="All time" />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>All Time</Text>
      </View>
      <AllTimeStats
        totalVol={totalVol}
        sessionCount={sessions.length}
        totalSets={totalSets}
        avgSets={avgSets}
        bestWeekVol={bestWeekVol}
      />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Weekly Volume</Text>
        <Text style={styles.sectionSub}>Last 8 weeks</Text>
      </View>
      <WeeklyVolume weeklyVols={weeklyVols} hasData={sessions.length > 0} />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Exercise Progress</Text>
      </View>
      <ExerciseProgress
        exercises={exercises}
        selectedId={selectedExercise}
        onSelect={setSelectedExercise}
        progressWeights={progressWeights}
        firstDate={exerciseProgress[0]?.date ?? ''}
        lastWeight={progressWeights[progressWeights.length - 1] ?? 0}
      />

      {muscleEntries.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Muscle Focus</Text>
            <Text style={styles.sectionSub}>By volume</Text>
          </View>
          <MuscleBreakdown entries={muscleEntries} total={totalMuscleVol} />
        </>
      )}

      {sessions.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>No data yet</Text>
          <Text style={styles.emptyText}>Log sessions to see your analytics here</Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 14, paddingTop: 8, paddingBottom: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  sectionSub: { fontSize: 12, color: MUTED },
  empty: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#fff', marginBottom: 6 },
  emptyText: { fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 18 },
})