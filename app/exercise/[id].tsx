import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useStore, getPRs } from '../../store/index'

const ACCENT = '#C8F065'
const CARD = '#1a1a1a'
const BORDER = '#2a2a2a'
const MUTED = '#8e8e93'
const DIM = '#3a3a3c'
const { width } = Dimensions.get('window')
const CHART_W = width - 28 - 26

// ─── TIME RANGES ──────────────────────────────────────────────────────────────

const RANGES = ['1M', '3M', 'All'] as const
type Range = typeof RANGES[number]

function filterByRange(
  data: { date: string; weight: number }[],
  range: Range
) {
  if (range === 'All') return data
  const now = new Date()
  const months = range === '1M' ? 1 : 3
  const cutoff = new Date(now)
  cutoff.setMonth(now.getMonth() - months)
  return data.filter((d) => new Date(d.date) >= cutoff)
}

// ─── PROGRESS CHART ───────────────────────────────────────────────────────────

function ProgressChart({
  points,
  height = 88,
}: {
  points: { date: string; weight: number }[]
  height?: number
}) {
  if (points.length < 2) {
    return (
      <View style={[styles.emptyChart, { height }]}>
        <Text style={styles.emptyChartText}>
          Log this exercise at least twice to see progress
        </Text>
      </View>
    )
  }

  const weights = points.map((p) => p.weight)
  const min = Math.min(...weights)
  const max = Math.max(...weights)
  const range = max - min || 1
  const W = CHART_W
  const H = height
  const PAD = 8

  const pts = points.map((p, i) => ({
    x: (i / (points.length - 1)) * W,
    y: H - ((p.weight - min) / range) * (H - PAD * 2) - PAD,
    weight: p.weight,
    date: p.date,
  }))

  return (
    <View style={{ height }}>
      {/* Grid lines */}
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: 0, right: 0,
            top: (i / 2) * (H - PAD) + PAD / 2,
            height: 1,
            backgroundColor: BORDER,
            opacity: 0.5,
          }}
        />
      ))}

      {/* Bars */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        height, gap: 2,
        paddingBottom: 2,
      }}>
        {points.map((p, i) => {
          const barH = Math.max(4, ((p.weight - min) / range) * (H - PAD * 2) + PAD)
          const isLast = i === points.length - 1
          const isPR = p.weight === max
          return (
            <View
              key={i}
              style={{
                flex: 1, height: barH,
                borderRadius: 3,
                backgroundColor: isPR
                  ? ACCENT
                  : isLast
                  ? `${ACCENT}80`
                  : `${ACCENT}30`,
              }}
            />
          )
        })}
      </View>

      {/* First / last label */}
      <View style={{
        position: 'absolute', bottom: -18,
        left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'space-between',
      }}>
        <Text style={{ fontSize: 9, color: DIM }}>
          {new Date(points[0].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </Text>
        <Text style={{ fontSize: 9, color: ACCENT, fontWeight: '600' }}>
          {points[points.length - 1].weight} kg →
        </Text>
      </View>
    </View>
  )
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function ExerciseDetailScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { exercises, sessions } = useStore()
  const [range, setRange] = useState<Range>('All')

  const exercise = exercises.find((e) => e.id === id)

  if (!exercise) {
    return (
      <View style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: MUTED }}>Exercise not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: ACCENT }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // ── All sessions that include this exercise ────────────────────────────────
  const exerciseSessions = sessions
    .filter((s) => s.entries.some((e) => e.exerciseId === id))
    .sort((a, b) => a.date.localeCompare(b.date))

  // ── Max weight per session ─────────────────────────────────────────────────
  const allProgress = exerciseSessions.map((s) => {
    const entry = s.entries.find((e) => e.exerciseId === id)!
    const maxWeight = Math.max(...entry.sets.map((set) => set.weight))
    return { date: s.date, weight: maxWeight }
  })

  const filteredProgress = filterByRange(allProgress, range)

  // ── PR ────────────────────────────────────────────────────────────────────
  const prs = getPRs(sessions, exercises)
  const pr = prs[id]

  // ── Last session ──────────────────────────────────────────────────────────
  const lastSession = exerciseSessions[exerciseSessions.length - 1]
  const lastEntry = lastSession?.entries.find((e) => e.exerciseId === id)

  // ── Previous session for delta ────────────────────────────────────────────
  const prevSession = exerciseSessions[exerciseSessions.length - 2]
  const prevEntry = prevSession?.entries.find((e) => e.exerciseId === id)
  const prevMax = prevEntry ? Math.max(...prevEntry.sets.map((s) => s.weight)) : null
  const currentMax = lastEntry ? Math.max(...lastEntry.sets.map((s) => s.weight)) : null
  const delta = currentMax !== null && prevMax !== null ? currentMax - prevMax : null

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalSets = exerciseSessions.reduce((t, s) => {
    const entry = s.entries.find((e) => e.exerciseId === id)
    return t + (entry?.sets.length ?? 0)
  }, 0)

  const avgSetsPerSession = exerciseSessions.length
    ? (totalSets / exerciseSessions.length).toFixed(1)
    : '0'

  const bestVolSession = exerciseSessions.reduce((best, s) => {
    const entry = s.entries.find((e) => e.exerciseId === id)
    const vol = entry?.sets.reduce((t, set) => t + set.reps * set.weight, 0) ?? 0
    return vol > best ? vol : best
  }, 0)

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{exercise.name}</Text>
          <View style={styles.headerBadges}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{exercise.muscle}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* ── PR HERO ── */}
        {pr ? (
          <View style={styles.prHero}>
            <View>
              <Text style={styles.prLabel}>⚡ Personal Record</Text>
              <Text style={styles.prValue}>
                {pr.weight}
                <Text style={styles.prUnit}> kg</Text>
              </Text>
              <Text style={styles.prDate}>
                {new Date(pr.date).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </Text>
            </View>
            {delta !== null && (
              <View style={styles.deltaWrap}>
                <Text style={styles.deltaSub}>vs last session</Text>
                <Text style={[
                  styles.deltaValue,
                  { color: delta >= 0 ? ACCENT : '#ff453a' }
                ]}>
                  {delta >= 0 ? '+' : ''}{delta} kg {delta >= 0 ? '↑' : '↓'}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noPrCard}>
            <Text style={styles.noPrText}>
              Log this exercise to start tracking your PR
            </Text>
          </View>
        )}

        {/* ── PROGRESS CHART ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Max Weight Progress</Text>
          {/* Range tabs */}
          <View style={styles.rangeTabs}>
            {RANGES.map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setRange(r)}
                activeOpacity={0.7}
                style={[styles.rangeTab, range === r && styles.rangeTabActive]}
              >
                <Text style={[styles.rangeTabText, range === r && styles.rangeTabTextActive]}>
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.card, { paddingBottom: 28 }]}>
          <ProgressChart points={filteredProgress} />
        </View>

        {/* ── QUICK STATS ── */}
        <View style={styles.statsRow}>
          {[
            { label: 'Sessions', value: `${exerciseSessions.length}` },
            { label: 'Avg Sets', value: avgSetsPerSession },
            { label: 'Best Vol', value: bestVolSession > 999 ? `${(bestVolSession / 1000).toFixed(1)}k` : `${bestVolSession}` },
          ].map((s, i) => (
            <View
              key={s.label}
              style={[styles.statCard, i < 2 && { marginRight: 7 }]}
            >
              <Text style={styles.statCardLabel}>{s.label}</Text>
              <Text style={styles.statCardValue}>{s.value}</Text>
            </View>
          ))}
        </View>

        {/* ── LAST SESSION ── */}
        {lastEntry && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Last Session</Text>
              <Text style={styles.sectionSub}>
                {new Date(lastSession.date).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short',
                })}
              </Text>
            </View>

            <View style={[styles.card, { padding: 0 }]}>
              {/* Column headers */}
              <View style={styles.setHeaderRow}>
                <Text style={[styles.setHeaderText, { width: 30 }]}>SET</Text>
                <Text style={[styles.setHeaderText, { flex: 1, textAlign: 'center' }]}>REPS</Text>
                <Text style={[styles.setHeaderText, { flex: 1, textAlign: 'center' }]}>KG</Text>
                <Text style={[styles.setHeaderText, { flex: 1, textAlign: 'center' }]}>VOL</Text>
              </View>

              {lastEntry.sets.map((s, i) => {
                const isPR = s.weight === pr?.weight
                return (
                  <View
                    key={i}
                    style={[
                      styles.setRow,
                      i < lastEntry.sets.length - 1 && styles.setRowBorder,
                    ]}
                  >
                    <View style={[styles.setNum, isPR && styles.setNumPR]}>
                      <Text style={[styles.setNumText, isPR && { color: '#000' }]}>
                        {i + 1}
                      </Text>
                    </View>
                    <Text style={[styles.setCell, { flex: 1 }]}>{s.reps}</Text>
                    <View style={[styles.setWeightWrap, { flex: 1 }]}>
                      <Text style={styles.setCell}>{s.weight}</Text>
                      {isPR && <Text style={styles.prDot}>⚡</Text>}
                    </View>
                    <Text style={[styles.setCell, styles.setCellMuted, { flex: 1 }]}>
                      {s.reps * s.weight}
                    </Text>
                  </View>
                )
              })}
            </View>
          </>
        )}

        {/* ── ALL SESSIONS ── */}
        {exerciseSessions.length > 1 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>All Sessions</Text>
              <Text style={styles.sectionSub}>{exerciseSessions.length} total</Text>
            </View>

            <View style={[styles.card, { padding: 0 }]}>
              {[...exerciseSessions].reverse().map((s, i) => {
                const entry = s.entries.find((e) => e.exerciseId === id)!
                const maxW = Math.max(...entry.sets.map((set) => set.weight))
                const vol = entry.sets.reduce((t, set) => t + set.reps * set.weight, 0)
                const isFirst = i === 0
                return (
                  <View
                    key={s.id}
                    style={[
                      styles.historyRow,
                      i < exerciseSessions.length - 1 && styles.historyRowBorder,
                    ]}
                  >
                    <View>
                      <Text style={styles.historyDate}>
                        {new Date(s.date).toLocaleDateString('en-GB', {
                          weekday: 'short', day: 'numeric', month: 'short',
                        })}
                      </Text>
                      <Text style={styles.historyMeta}>
                        {entry.sets.length} sets · {vol} kg vol
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.historyMax, isFirst && { color: ACCENT }]}>
                        {maxW} kg
                      </Text>
                      {isFirst && (
                        <Text style={styles.historyLatest}>latest</Text>
                      )}
                    </View>
                  </View>
                )
              })}
            </View>
          </>
        )}

        {/* Empty state */}
        {exerciseSessions.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏋️</Text>
            <Text style={styles.emptyTitle}>No data yet</Text>
            <Text style={styles.emptyText}>
              Log a session with {exercise.name} to start tracking progress
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { fontSize: 22, color: '#fff', lineHeight: 26 },
  headerTitle: {
    fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4,
  },
  headerBadges: { flexDirection: 'row', gap: 6, marginTop: 4 },
  badge: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3,
  },
  badgeText: { fontSize: 11, color: MUTED },

  // PR Hero
  prHero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 13,
    margin: 14,
    padding: 16,
  },
  prLabel: { fontSize: 10, color: MUTED, fontWeight: '600', marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: 1 },
  prValue: {
    fontSize: 52, fontWeight: '800', color: ACCENT,
    letterSpacing: -2, lineHeight: 56,
  },
  prUnit: { fontSize: 20, fontWeight: '400', color: MUTED },
  prDate: { fontSize: 12, color: MUTED, marginTop: 4 },
  deltaWrap: { alignItems: 'flex-end' },
  deltaSub: { fontSize: 10, color: DIM, marginBottom: 4 },
  deltaValue: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },

  noPrCard: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 13, margin: 14, padding: 20, alignItems: 'center',
  },
  noPrText: { fontSize: 13, color: DIM, textAlign: 'center' },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 8, paddingBottom: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  sectionSub: { fontSize: 12, color: MUTED },

  // Range tabs
  rangeTabs: { flexDirection: 'row', gap: 3 },
  rangeTab: {
    paddingVertical: 4, paddingHorizontal: 9,
    borderRadius: 7, backgroundColor: 'transparent',
  },
  rangeTabActive: { backgroundColor: 'rgba(200,240,101,0.1)' },
  rangeTabText: { fontSize: 11, fontWeight: '600', color: DIM },
  rangeTabTextActive: { color: ACCENT },

  // Card
  card: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 13, marginHorizontal: 14, marginBottom: 8, padding: 13,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 13, padding: 13,
  },
  statCardLabel: {
    fontSize: 9, fontWeight: '600', textTransform: 'uppercase',
    letterSpacing: 1, color: MUTED, marginBottom: 6,
  },
  statCardValue: {
    fontSize: 22, fontWeight: '700', color: '#fff',
    letterSpacing: -0.5, fontVariant: ['tabular-nums'],
  },

  // Set table
  setHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  setHeaderText: {
    fontSize: 8, fontWeight: '600', color: DIM,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13, paddingVertical: 11,
  },
  setRowBorder: { borderBottomWidth: 1, borderBottomColor: BORDER },
  setNum: {
    width: 24, height: 24, borderRadius: 6,
    backgroundColor: '#2a2a2a',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 6,
  },
  setNumPR: { backgroundColor: ACCENT },
  setNumText: { fontSize: 10, fontWeight: '600', color: MUTED },
  setCell: {
    fontSize: 13, fontWeight: '600', color: '#fff',
    textAlign: 'center', fontVariant: ['tabular-nums'],
  },
  setCellMuted: { color: MUTED },
  setWeightWrap: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 3,
  },
  prDot: { fontSize: 10 },

  // History
  historyRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 13,
  },
  historyRowBorder: { borderBottomWidth: 1, borderBottomColor: BORDER },
  historyDate: { fontSize: 13, fontWeight: '500', color: '#fff', marginBottom: 3 },
  historyMeta: { fontSize: 11, color: MUTED, fontVariant: ['tabular-nums'] },
  historyMax: { fontSize: 15, fontWeight: '700', color: '#fff', fontVariant: ['tabular-nums'] },
  historyLatest: { fontSize: 9, color: DIM, marginTop: 2 },

  // Empty
  emptyChart: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#111', borderRadius: 8 },
  emptyChartText: { fontSize: 12, color: DIM, textAlign: 'center', paddingHorizontal: 16 },
  empty: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#fff', marginBottom: 6 },
  emptyText: { fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 18 },
})