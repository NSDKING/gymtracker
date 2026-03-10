import React from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Header from '../../components/Header'
import SessionCard from '../../components/history/SessionCard'
import { useStore } from '../../store/index'
import { CARD, BORDER, MUTED, DIM } from '../../constants/theme'
import Heatmap from '@/components/Heatmap'

export default function HistoryScreen() {
  const insets = useSafeAreaInsets()
  const { sessions, exercises } = useStore()

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

      <Heatmap sessions={sessions} />

      {sessions.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No sessions yet</Text>
          <Text style={styles.emptyText}>Tap Log Session to record your first workout</Text>
        </View>
      )}

      {Object.entries(grouped).map(([month, monthSessions]) => (
        <View key={month}>
          <View style={styles.monthHeader}>
            <Text style={styles.monthTitle}>{month}</Text>
            <View style={styles.monthBadge}>
              <Text style={styles.monthBadgeText}>{monthSessions.length}</Text>
            </View>
          </View>
          {monthSessions.map((session) => (
            <SessionCard key={session.id} session={session} exercises={exercises} />
          ))}
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  monthHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingTop: 16, paddingBottom: 8,
  },
  monthTitle: { fontSize: 18, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  monthBadge: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2,
  },
  monthBadgeText: { fontSize: 11, fontWeight: '600', color: MUTED },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#fff', marginBottom: 6 },
  emptyText: { fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 18 },
})