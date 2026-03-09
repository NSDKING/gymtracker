import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Header from '../../components/Header'
import { useStore, getTotalVolume } from '../../store/index'

const ACCENT = '#C8F065'
const CARD = '#1a1a1a'
const BORDER = '#2a2a2a'
const MUTED = '#8e8e93'
const DIM = '#3a3a3c'
const { width } = Dimensions.get('window')
const CHART_W = width - 28 - 26 // screen - horizontal margins - card padding

// ─── LINE CHART ───────────────────────────────────────────────────────────────

function LineChart({
  points,
  height = 80,
  color = ACCENT,
}: {
  points: number[]
  height?: number
  color?: string
}) {
  if (points.length < 2) {
    return (
      <View style={{ height, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: DIM, fontSize: 12 }}>Not enough data</Text>
      </View>
    )
  }

  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const W = CHART_W
  const H = height

  const pts = points.map((v, i) => ({
    x: (i / (points.length - 1)) * W,
    y: H - ((v - min) / range) * (H - 12) - 6,
  }))

  const polyline = pts.map((p) => `${p.x},${p.y}`).join(' ')
  const area = [
    ...pts.map((p) => `${p.x},${p.y}`),
    `${W},${H}`,
    `0,${H}`,
  ].join(' ')

  return (
    <View style={{ height }}>
      {/* SVG-like using absolute positioned views — RN compatible */}
      <View style={{ position: 'absolute', inset: 0 }}>
        {/* Grid lines */}
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: (i / 2) * (H - 12),
              height: 1,
              backgroundColor: BORDER,
              opacity: 0.5,
            }}
          />
        ))}
      </View>

      {/* We use a canvas-like SVG string rendered via Text trick — 
          For proper charts install victory-native or use this lightweight approach */}
      <View style={{ height, justifyContent: 'flex-end' }}>
        {/* Bars as a simple approximation until we add victory-native */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: 3 }}>
          {points.map((v, i) => {
            const barH = Math.max(3, ((v - min) / range) * (H - 16))
            const isLast = i === points.length - 1
            return (
              <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height }}>
                <View
                  style={{
                    width: '100%',
                    height: barH,
                    borderRadius: 3,
                    backgroundColor: isLast ? color : `${color}40`,
                  }}
                />
              </View>
            )
          })}
        </View>
      </View>

      {/* Last value dot label */}
      <View style={{ position: 'absolute', right: 0, top: 0 }}>
        <Text style={{ fontSize: 10, color, fontWeight: '700' }}>
          {points[points.length - 1]}
        </Text>
      </View>
    </View>
  )
}

// ─── STAT ROW ─────────────────────────────────────────────────────────────────

function StatRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statRowLabel}>{label}</Text>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.statRowValue}>{value}</Text>
        {sub && <Text style={styles.statRowSub}>{sub}</Text>}
      </View>
    </View>
  )
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────

function ProgressBar({ label, pct, value }: { label: string; pct: number; value: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
        <Text style={{ fontSize: 12, color: '#fff' }}>{label}</Text>
        <Text style={{ fontSize: 11, color: MUTED, fontVariant: ['tabular-nums'] }}>{value}</Text>
      </View>
      <View style={styles.pbTrack}>
        <View style={[styles.pbFill, { width: `${Math.min(pct * 100, 100)}%` }]} />
      </View>
    </View>
  )
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function StatsScreen() {
  const insets = useSafeAreaInsets()
  const { sessions, exercises } = useStore()
  const [selectedExercise, setSelectedExercise] = useState(exercises[0]?.id ?? '')

  // ── Volume per week (last 8 weeks) ────────────────────────────────────────
  const today = new Date()
  const weeklyVols = Array.from({ length: 8 }, (_, i) => {
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - (7 - i) * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const weekSessions = sessions.filter((s) => {
      const d = new Date(s.date)
      return d >= weekStart && d <= weekEnd
    })
    return weekSessions.reduce((t, s) => t + getTotalVolume(s.entries), 0)
  })

  // ── Max weight over time for selected exercise ────────────────────────────
  const exerciseProgress = sessions
    .filter((s) => s.entries.some((e) => e.exerciseId === selectedExercise))
    .map((s) => {
      const entry = s.entries.find((e) => e.exerciseId === selectedExercise)
      const maxWeight = entry ? Math.max(...entry.sets.map((set) => set.weight)) : 0
      return { date: s.date, weight: maxWeight }
    })
    .sort((a, b) => a.date.localeCompare(b.date))

  const progressWeights = exerciseProgress.map((p) => p.weight)

  // ── Muscle breakdown ──────────────────────────────────────────────────────
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
  const muscleEntries = Object.entries(muscleVols)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // ── All time stats ────────────────────────────────────────────────────────
  const totalVol = sessions.reduce((t, s) => t + getTotalVolume(s.entries), 0)
  const totalSets = sessions.reduce(
    (t, s) => t + s.entries.reduce((tt, e) => tt + e.sets.length, 0), 0
  )
  const avgSetsPerSession = sessions.length
    ? (totalSets / sessions.length).toFixed(1)
    : '0'

  // ── Best week ─────────────────────────────────────────────────────────────
  const bestWeekVol = Math.max(...weeklyVols, 0)

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <Header title="Analytics" subtitle="All time" />

      {/* ── ALL TIME STATS ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>All Time</Text>
      </View>
      <View style={[styles.card, { padding: 0 }]}>
        <StatRow
          label="Total Volume"
          value={totalVol > 999 ? `${(totalVol / 1000).toFixed(1)}k kg` : `${totalVol} kg`}
        />
        <View style={styles.divider} />
        <StatRow label="Total Sessions" value={`${sessions.length}`} />
        <View style={styles.divider} />
        <StatRow label="Total Sets" value={`${totalSets}`} />
        <View style={styles.divider} />
        <StatRow
          label="Avg Sets / Session"
          value={avgSetsPerSession}
        />
        <View style={styles.divider} />
        <StatRow
          label="Best Week"
          value={bestWeekVol > 999 ? `${(bestWeekVol / 1000).toFixed(1)}k kg` : `${bestWeekVol} kg`}
        />
      </View>

      {/* ── WEEKLY VOLUME ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Weekly Volume</Text>
        <Text style={styles.sectionSub}>Last 8 weeks</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Volume (kg)</Text>
        {sessions.length === 0 ? (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyChartText}>Log sessions to see your volume trend</Text>
          </View>
        ) : (
          <LineChart points={weeklyVols} height={90} />
        )}
      </View>

      {/* ── EXERCISE PROGRESS ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Exercise Progress</Text>
      </View>
      <View style={styles.card}>
        {/* Exercise selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6, marginBottom: 14 }}
        >
          {exercises.map((ex) => (
            <TouchableOpacity
              key={ex.id}
              onPress={() => setSelectedExercise(ex.id)}
              activeOpacity={0.7}
              style={[
                styles.exChip,
                selectedExercise === ex.id && styles.exChipActive,
              ]}
            >
              <Text
                style={[
                  styles.exChipText,
                  selectedExercise === ex.id && styles.exChipTextActive,
                ]}
              >
                {ex.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Chart */}
        <Text style={styles.cardLabel}>Max Weight (kg)</Text>
        {progressWeights.length < 2 ? (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyChartText}>
              Log this exercise at least twice to see progress
            </Text>
          </View>
        ) : (
          <>
            <LineChart points={progressWeights} height={90} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={{ fontSize: 10, color: DIM }}>
                {exerciseProgress[0].date}
              </Text>
              <Text style={{ fontSize: 10, color: ACCENT, fontWeight: '600' }}>
                {progressWeights[progressWeights.length - 1]} kg →
              </Text>
            </View>
          </>
        )}
      </View>

      {/* ── MUSCLE BREAKDOWN ── */}
      {muscleEntries.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Muscle Focus</Text>
            <Text style={styles.sectionSub}>By volume</Text>
          </View>
          <View style={styles.card}>
            {muscleEntries.map(([muscle, vol]) => (
              <ProgressBar
                key={muscle}
                label={muscle}
                pct={vol / totalMuscleVol}
                value={`${Math.round((vol / totalMuscleVol) * 100)}%`}
              />
            ))}
          </View>
        </>
      )}

      {/* Empty state */}
      {sessions.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>No data yet</Text>
          <Text style={styles.emptyText}>
            Log sessions to see your analytics here
          </Text>
        </View>
      )}
    </ScrollView>
  )
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 12,
    color: MUTED,
  },

  card: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 13,
    marginHorizontal: 14,
    marginBottom: 10,
    padding: 13,
  },
  cardLabel: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: MUTED,
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginHorizontal: 13,
  },

  // Stat row
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 13,
  },
  statRowLabel: { fontSize: 13, color: MUTED },
  statRowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  statRowSub: { fontSize: 10, color: DIM, marginTop: 2 },

  // Progress bar
  pbTrack: {
    height: 4,
    backgroundColor: BORDER,
    borderRadius: 999,
    overflow: 'hidden',
  },
  pbFill: {
    height: '100%',
    backgroundColor: ACCENT,
    borderRadius: 999,
  },

  // Exercise chip
  exChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#111',
  },
  exChipActive: {
    backgroundColor: 'rgba(200,240,101,0.1)',
    borderColor: 'rgba(200,240,101,0.3)',
  },
  exChipText: { fontSize: 12, fontWeight: '500', color: MUTED },
  exChipTextActive: { color: ACCENT },

  // Empty
  emptyChart: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
    borderRadius: 8,
  },
  emptyChartText: { fontSize: 12, color: DIM, textAlign: 'center' },
  empty: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#fff', marginBottom: 6 },
  emptyText: { fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 18 },
})