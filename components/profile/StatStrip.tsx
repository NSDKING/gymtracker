import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { CARD, BORDER, MUTED } from '../../constants/theme'

type Stat = { label: string; value: string }

export default function StatStrip({ stats }: { stats: Stat[] }) {
  return (
    <View style={styles.strip}>
      {stats.map((s, i) => (
        <View key={s.label} style={[styles.item, i < stats.length - 1 && styles.border]}>
          <Text style={styles.value}>{s.value}</Text>
          <Text style={styles.label}>{s.label}</Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row', backgroundColor: CARD,
    borderWidth: 1, borderColor: BORDER,
    borderRadius: 13, overflow: 'hidden', width: '100%',
  },
  item: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  border: { borderRightWidth: 1, borderRightColor: BORDER },
  value: {
    fontSize: 16, fontWeight: '700', color: '#fff',
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 9, fontWeight: '600', color: MUTED,
    textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 3,
  },
})