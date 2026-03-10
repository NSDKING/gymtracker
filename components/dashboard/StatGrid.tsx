import React from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'

const { width } = Dimensions.get('window')
const ACCENT = '#C8F065'
const CARD = '#1a1a1a'
const BORDER = '#2a2a2a'
const MUTED = '#8e8e93'
const DIM = '#3a3a3c'

type Props = {
  streak: number
  totalVol: number
  sessionCount: number
  consistency: number
}

export default function StatGrid({ streak, totalVol, sessionCount, consistency }: Props) {
  const stats = [
    {
      label: '🔥  STREAK',
      value: `${streak}`,
      unit: 'd',
      sub: 'Keep it up',
    },
    {
      label: '⬆  VOLUME',
      value: totalVol > 999 ? (totalVol / 1000).toFixed(1) : `${totalVol}`,
      unit: totalVol > 999 ? 'k kg' : 'kg',
      sub: 'All time',
    },
    {
      label: '✓  SESSIONS',
      value: `${sessionCount}`,
      unit: '',
      sub: 'Total logged',
    },
    {
      label: '◎  CONSISTENCY',
      value: `${consistency}`,
      unit: '%',
      sub: 'This month',
      accent: true,
    },
  ]

  return (
    <View style={styles.grid}>
      {stats.map((s, i) => (
        <View key={i} style={styles.card}>
          <Text style={styles.label}>{s.label}</Text>
          <View style={styles.valueRow}>
            <Text style={[styles.value, s.accent && { color: ACCENT }]}>
              {s.value}
            </Text>
            {s.unit ? (
              <Text style={[styles.unit, s.accent && { color: ACCENT }]}>
                {s.unit}
              </Text>
            ) : null}
          </View>
          <Text style={styles.sub}>{s.sub}</Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 8, paddingHorizontal: 14, marginBottom: 10,
  },
  card: {
    width: (width - 28 - 8) / 2,
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 13, padding: 16,
    minHeight: 135, justifyContent: 'space-between',
  },
  label: {
    fontSize: 12, fontWeight: '600', textTransform: 'uppercase',
    letterSpacing: 1, color: MUTED, marginBottom: 10,
  },
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  value: {
    fontSize: 40, fontWeight: '700', color: '#fff',
    letterSpacing: -1.5, lineHeight: 44,
    
  },
  unit: { fontSize: 16, fontWeight: '400', color: MUTED, marginBottom: 6 },
  sub: { fontSize: 11, color: DIM, marginTop: 7 },
})