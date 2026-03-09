import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Header from '@/components/Header'
import { useStore, getTotalVolume } from '../../store/index'

const ACCENT = '#C8F065'
const CARD = '#1a1a1a'
const BORDER = '#2a2a2a'
const MUTED = '#8e8e93'
const DIM = '#3a3a3c'

// ─── HEATMAP ──────────────────────────────────────────────────────────────────

function Heatmap({ sessions }: { sessions: { date: string }[] }) {
  const COLS = 15
  const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

  // Build a set of trained dates
  const trainedDates = new Set(sessions.map((s) => s.date))

  // Generate last COLS * 7 days
  const today = new Date()
  const totalDays = COLS * 7
  const cells: { date: string; trained: boolean }[] = []

  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    cells.push({ date: dateStr, trained: trainedDates.has(dateStr) })
  }

  // Reshape into columns
  const grid: { date: string; trained: boolean }[][] = []
  for (let c = 0; c < COLS; c++) {
    const col = []
    for (let r = 0; r < 7; r++) {
      col.push(cells[c * 7 + r])
    }
    grid.push(col)
  }

  // Date range label
  const startDate = cells[0].date
  const endDate = cells[cells.length - 1].date
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <View style={styles.heatmap}>
      <View style={styles.heatmapGrid}>
        {/* Day labels */}
        <View style={styles.heatmapLabels}>
          {DAYS.map((d) => (
            <Text key={d} style={styles.heatmapDayLabel}>{d}</Text>
          ))}
        </View>
        {/* Columns */}
        {grid.map((col, ci) => (
          <View key={ci} style={styles.heatmapCol}>
            {col.map((cell, ri) => (
              <View
                key={ri}
                style={[
                  styles.heatmapCell,
                  cell.trained && styles.heatmapCellActive,
                ]}
              />
            ))}
          </View>
        ))}
      </View>
      {/* Range nav */}
      <View style={styles.heatmapNav}>
        <View style={styles.heatmapNavBtn}>
          <Text style={styles.heatmapNavBtnText}>‹</Text>
        </View>
        <Text style={styles.heatmapRange}>{fmt(startDate)} – {fmt(endDate)}</Text>
        <View style={styles.heatmapNavBtn}>
          <Text style={styles.heatmapNavBtnText}>›</Text>
        </View>
      </View>
    </View>
  )
}

// ─── SESSION CARD ─────────────────────────────────────────────────────────────

function SessionCard({
  session,
  exercises,
}: {
  session: any
  exercises: any[]
}) {
  const vol = getTotalVolume(session.entries)
  const sets = session.entries.reduce((t: number, e: any) => t + e.sets.length, 0)
  const exerciseNames = session.entries
    .map((e: any) => exercises.find((x) => x.id === e.exerciseId)?.name)
    .filter(Boolean)

  const isToday = session.date === new Date().toISOString().slice(0, 10)

  const dateLabel = new Date(session.date).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <TouchableOpacity
      style={styles.sessionCard}
      activeOpacity={0.7}
      onPress={() => {}}
    >
      {/* Top row */}
      <View style={styles.sessionCardHeader}>
        <View style={styles.sessionCardHeaderLeft}>
          <Text style={styles.sessionCardDate}>{dateLabel}</Text>
          {isToday && (
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>Today</Text>
            </View>
          )}
        </View>
        <View style={styles.sessionCardMeta}>
          {vol > 0 && (
            <Text style={styles.sessionCardVol}>
              {vol > 999 ? `${(vol / 1000).toFixed(1)}k` : vol} kg
            </Text>
          )}
          <Text style={styles.sessionCardDot}>·</Text>
          <Text style={styles.sessionCardSets}>{sets} sets</Text>
        </View>
      </View>

      {/* Exercise chips */}
      <View style={styles.sessionCardChips}>
        {exerciseNames.slice(0, 4).map((name: string, i: number) => (
          <View key={i} style={styles.chip}>
            <Text style={styles.chipText}>{name}</Text>
          </View>
        ))}
        {exerciseNames.length > 4 && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>+{exerciseNames.length - 4}</Text>
          </View>
        )}
      </View>

      {/* Note */}
      {session.note ? (
        <Text style={styles.sessionNote} numberOfLines={1}>
          📝 {session.note}
        </Text>
      ) : null}
    </TouchableOpacity>
  )
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const insets = useSafeAreaInsets()
  const { sessions, exercises } = useStore()

  // Group sessions by month
  const grouped: Record<string, typeof sessions> = {}
  sessions.forEach((s) => {
    const month = new Date(s.date).toLocaleDateString('en-GB', {
      month: 'long', year: 'numeric',
    })
    if (!grouped[month]) grouped[month] = []
    grouped[month].push(s)
  })

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <Header
        title="History"
        subtitle={`${sessions.length} session${sessions.length !== 1 ? 's' : ''} total`}
      />

      {/* Heatmap */}
      <Heatmap sessions={sessions} />

      {/* Empty state */}
      {sessions.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No sessions yet</Text>
          <Text style={styles.emptyText}>
            Tap Log Session to record your first workout
          </Text>
        </View>
      )}

      {/* Grouped sessions */}
      {Object.entries(grouped).map(([month, monthSessions]) => (
        <View key={month}>
          <View style={styles.monthHeader}>
            <Text style={styles.monthTitle}>{month}</Text>
            <View style={styles.monthBadge}>
              <Text style={styles.monthBadgeText}>{monthSessions.length}</Text>
            </View>
          </View>
          {monthSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              exercises={exercises}
            />
          ))}
        </View>
      ))}
    </ScrollView>
  )
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },

  // Heatmap
  heatmap: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 13,
    padding: 12,
    marginHorizontal: 14,
    marginBottom: 10,
  },
  heatmapGrid: {
    flexDirection: 'row',
    gap: 2,
  },
  heatmapLabels: {
    flexDirection: 'column',
    gap: 2,
    marginRight: 4,
  },
  heatmapDayLabel: {
    height: 9,
    fontSize: 7,
    color: DIM,
    width: 18,
    lineHeight: 9,
  },
  heatmapCol: {
    flexDirection: 'column',
    gap: 2,
    flex: 1,
  },
  heatmapCell: {
    height: 9,
    borderRadius: 2,
    backgroundColor: '#222',
  },
  heatmapCellActive: {
    backgroundColor: ACCENT,
  },
  heatmapNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  heatmapNavBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heatmapNavBtnText: {
    fontSize: 10,
    color: ACCENT,
    lineHeight: 14,
  },
  heatmapRange: {
    fontSize: 9,
    color: MUTED,
    fontVariant: ['tabular-nums'],
  },

  // Month group
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.3,
  },
  monthBadge: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  monthBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: MUTED,
  },

  // Session card
  sessionCard: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 13,
    marginHorizontal: 14,
    marginBottom: 8,
    overflow: 'hidden',
  },
  sessionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 13,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  sessionCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionCardDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  todayBadge: {
    backgroundColor: 'rgba(200,240,101,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(200,240,101,0.25)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  todayBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: ACCENT,
  },
  sessionCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sessionCardVol: {
    fontSize: 11,
    color: MUTED,
    fontVariant: ['tabular-nums'],
  },
  sessionCardDot: {
    fontSize: 10,
    color: DIM,
  },
  sessionCardSets: {
    fontSize: 11,
    color: MUTED,
    fontVariant: ['tabular-nums'],
  },

  // Chips
  sessionCardChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: 10,
  },
  chip: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 11,
    color: MUTED,
  },

  // Note
  sessionNote: {
    fontSize: 12,
    color: DIM,
    paddingHorizontal: 13,
    paddingBottom: 10,
  },

  // Empty
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#fff', marginBottom: 6 },
  emptyText: { fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 18 },
})