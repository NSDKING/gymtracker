import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { MUTED, DIM } from '../../constants/theme'

type Props = {
  label: string
  value: string
  sub?: string
}

export default function StatRow({ label, value, sub }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.value}>{value}</Text>
        {sub && <Text style={styles.sub}>{sub}</Text>}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 13,
  },
  label: { fontSize: 13, color: MUTED },
  value: { fontSize: 14, fontWeight: '600', color: '#fff', fontVariant: ['tabular-nums'] },
  sub: { fontSize: 10, color: DIM, marginTop: 2 },
})