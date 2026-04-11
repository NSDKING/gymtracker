import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { getTotalVolume } from '../../store/index'
import { ACCENT, CARD, BORDER, MUTED, DIM } from '../../constants/theme'

type Props = {
  session: any
  exercises: any[]
}

export default function SessionCard({ session, exercises }: Props) {
  const vol = getTotalVolume(session.entries)
  const sets = session.entries.reduce((t: number, e: any) => t + e.sets.length, 0)
  const exerciseNames = session.entries
    .map((e: any) => e.exercise?.name ?? exercises.find((x) => x.id === e.exerciseId)?.name)
    .filter(Boolean)

  const isToday = session.date === new Date().toISOString().slice(0, 10)
  const dateLabel = new Date(session.date).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => router.push(`/session/${session.id}`)}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.date}>{dateLabel}</Text>
          {isToday && (
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>Today</Text>
            </View>
          )}
        </View>
        <View style={styles.meta}>
          {vol > 0 && (
            <Text style={styles.vol}>
              {vol > 999 ? `${(vol / 1000).toFixed(1)}k` : vol} kg
            </Text>
          )}
          <Text style={styles.dot}>·</Text>
          <Text style={styles.sets}>{sets} sets</Text>
        </View>
      </View>

      <View style={styles.chips}>
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

      {session.note ? (
        <Text style={styles.note} numberOfLines={1}>📝 {session.note}</Text>
      ) : null}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 13, marginHorizontal: 14, marginBottom: 8, overflow: 'hidden',
    minHeight: 100,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 13,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  date: { fontSize: 18, fontWeight: '700', color: '#fff' },
  todayBadge: {
    backgroundColor: 'rgba(200,240,101,0.1)',
    borderWidth: 1, borderColor: 'rgba(200,240,101,0.25)',
    borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2,
  },
  todayBadgeText: { fontSize: 10, fontWeight: '600', color: ACCENT },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  vol: { fontSize: 14, color: MUTED },
  dot: { fontSize: 10, color: DIM },
  sets: { fontSize: 14, color: MUTED },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 11 },
  chip: {
    backgroundColor: '#111', borderWidth: 1, borderColor: BORDER,
    borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6,
  },
  chipText: { fontSize: 14, color: MUTED },
  note: { fontSize: 12, color: DIM, paddingHorizontal: 13, paddingBottom: 10 },
})