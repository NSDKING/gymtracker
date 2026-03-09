import React from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Header from '@/components/Header'
import { useStore, getPRs, getStreak, getTotalVolume } from '../../store/index'

export default function Dashboard() {
  const insets = useSafeAreaInsets()
  const { sessions, exercises } = useStore()
  const prs = getPRs(sessions, exercises)
  const streak = getStreak(sessions)

  // Weekly volume — last 7 days
  const today = new Date()
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
  const weekLabels = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
  const weekVols = last7.map((dateStr) => {
    const daySessions = sessions.filter((s) => s.date === dateStr)
    return daySessions.reduce((total, s) => total + getTotalVolume(s.entries), 0)
  })
  const maxVol = Math.max(...weekVols, 1)

  // Total volume all time
  const totalVol = sessions.reduce((t, s) => t + getTotalVolume(s.entries), 0)

  // Consistency this month
  const thisMonth = today.toISOString().slice(0, 7)
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const trainedDaysThisMonth = new Set(
    sessions.filter((s) => s.date.startsWith(thisMonth)).map((s) => s.date)
  ).size
  const consistency = Math.round((trainedDaysThisMonth / today.getDate()) * 100)

  // PRs list
  const prList = Object.entries(prs)
    .map(([exId, pr]) => ({
      exercise: exercises.find((e) => e.id === exId),
      ...pr,
    }))
    .filter((p) => p.exercise)
    .slice(0, 3)

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <Header title="Dashboard" subtitle={today.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} />

      {/* ── STAT GRID ── */}
      <View style={styles.statGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>🔥  Streak</Text>
          <Text style={styles.statValue}>
            {streak}<Text style={styles.statUnit}>d</Text>
          </Text>
          <Text style={styles.statSub}>Keep it up</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>⬆  Volume</Text>
          <Text style={styles.statValue}>
            {totalVol > 999
              ? `${(totalVol / 1000).toFixed(1)}k`
              : totalVol}
            <Text style={styles.statUnit}>kg</Text>
          </Text>
          <Text style={styles.statSub}>All time</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>✓  Sessions</Text>
          <Text style={styles.statValue}>{sessions.length}</Text>
          <Text style={styles.statSub}>Total logged</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>◎  Consistency</Text>
          <Text style={[styles.statValue, { color: '#C8F065', fontSize: 22 }]}>
            {consistency}<Text style={styles.statUnit}>%</Text>
          </Text>
          <Text style={styles.statSub}>This month</Text>
        </View>
      </View>

      {/* ── WEEKLY VOLUME BAR CHART ── */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Weekly Volume</Text>
        <View style={styles.barChart}>
          {weekVols.map((vol, i) => {
            const isToday = i === 6
            const barHeight = Math.max(3, (vol / maxVol) * 52)
            return (
              <View key={i} style={styles.barCol}>
                <View
                  style={[
                    styles.bar,
                    { height: barHeight },
                    isToday && styles.barActive,
                    vol === 0 && styles.barEmpty,
                  ]}
                />
                <Text style={styles.barLabel}>{weekLabels[i]}</Text>
              </View>
            )
          })}
        </View>
      </View>

      {/* ── RECENT PRs ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent PRs</Text>
        <Text style={styles.sectionLink}>All</Text>
      </View>

      <View style={[styles.card, { padding: 0 }]}>
        {prList.length === 0 ? (
          <View style={{ padding: 16 }}>
            <Text style={styles.empty}>Log sessions to see your PRs here</Text>
          </View>
        ) : (
          prList.map((pr, i) => (
            <View
              key={i}
              style={[styles.prRow, i < prList.length - 1 && styles.prRowBorder]}
            >
              <View>
                <Text style={styles.prName}>{pr.exercise?.name}</Text>
                <Text style={styles.prDate}>
                  {new Date(pr.date).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short',
                  })}
                </Text>
              </View>
              <View style={styles.prBadge}>
                <Text style={styles.prBadgeText}>⚡ {pr.weight} kg</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* ── EMPTY STATE ── */}
      {sessions.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏋️</Text>
          <Text style={styles.emptyTitle}>No sessions yet</Text>
          <Text style={styles.emptyText}>Tap Log Session to record your first workout</Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },

  // Stat grid
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  statCard: {
    width: '47.5%',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 13,
    padding: 13,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: '#8e8e93',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  statUnit: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8e8e93',
  },
  statSub: {
    fontSize: 9,
    color: '#3a3a3c',
    marginTop: 5,
  },

  // Bar chart
  card: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
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
    color: '#8e8e93',
    marginBottom: 12,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 68,
    paddingBottom: 2,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 2,
    backgroundColor: 'rgba(200,240,101,0.18)',
  },
  barActive: {
    backgroundColor: '#C8F065',
  },
  barEmpty: {
    height: 3,
    backgroundColor: '#2a2a2a',
  },
  barLabel: {
    fontSize: 8,
    color: '#3a3a3c',
    fontWeight: '500',
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.3,
  },
  sectionLink: {
    fontSize: 12,
    color: '#C8F065',
    fontWeight: '500',
  },

  // PR rows
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  prRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  prName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#fff',
  },
  prDate: {
    fontSize: 10,
    color: '#3a3a3c',
    marginTop: 2,
  },
  prBadge: {
    backgroundColor: 'rgba(200,240,101,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(200,240,101,0.22)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  prBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#C8F065',
  },

  // Empty
  empty: {
    fontSize: 13,
    color: '#3a3a3c',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#8e8e93',
    textAlign: 'center',
    lineHeight: 18,
  },
})