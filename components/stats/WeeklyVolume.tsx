import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import LineChart from './LineChart'
import { CARD, BORDER, MUTED, DIM } from '../../constants/theme'

type Props = {
  weeklyVols: number[]
  hasData: boolean
}

export default function WeeklyVolume({ weeklyVols, hasData }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Volume (kg)</Text>
      {!hasData ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Log sessions to see your volume trend</Text>
        </View>
      ) : (
        <LineChart points={weeklyVols} height={90} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 13, marginHorizontal: 14, marginBottom: 10, padding: 13,
  },
  label: {
    fontSize: 9, fontWeight: '600', textTransform: 'uppercase',
    letterSpacing: 1.2, color: MUTED, marginBottom: 10,
  },
  empty: { height: 80, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111', borderRadius: 8 },
  emptyText: { fontSize: 12, color: DIM, textAlign: 'center' },
})