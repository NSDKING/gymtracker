import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { getTotalVolume } from '../../store/index'

const ACCENT = '#C8F065'
const CARD = '#1a1a1a'
const BORDER = '#2a2a2a'
const MUTED = '#8e8e93'
const DIM = '#3a3a3c'

export default function WeeklyBars({ sessions }: { sessions: any[] }) {
  const today = new Date()
  const days = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })

  const vols = last7.map((dateStr) =>
    sessions
      .filter((s) => s.date === dateStr)
      .reduce((t, s) => t + getTotalVolume(s.entries), 0)
  )
  const maxVol = Math.max(...vols, 1)

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Weekly Volume</Text>
      <View style={styles.chart}>
        {vols.map((vol, i) => {
          const isToday = i === 6
          const barH = Math.max(3, (vol / maxVol) * 52)
          return (
            <View key={i} style={styles.col}>
              <View style={[
                styles.bar,
                { height: barH },
                isToday && vol > 0 && styles.barToday,
                vol === 0 && styles.barEmpty,
              ]} />
              <Text style={[styles.barLabel, isToday && { color: MUTED }]}>
                {days[i]}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 13, marginHorizontal: 14, marginBottom: 10, padding: 13,
  },
  label: {
    fontSize: 10, fontWeight: '600', textTransform: 'uppercase',
    letterSpacing: 1.2, color: MUTED, marginBottom: 12,
  },
  chart: {
    flexDirection: 'row', alignItems: 'flex-end',
    gap: 4, height: 68, paddingBottom: 2,
  },
  col: { flex: 1, alignItems: 'center', gap: 4, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 3, backgroundColor: 'rgba(200,240,101,0.18)' },
  barToday: { backgroundColor: ACCENT },
  barEmpty: { height: 3, backgroundColor: '#222' },
  barLabel: { fontSize: 9, color: DIM, fontWeight: '500' },
})