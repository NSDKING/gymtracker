import React from 'react'
import { View, StyleSheet } from 'react-native'
import StatRow from './StatRow'
import { BORDER, CARD } from '../../constants/theme'

type Props = {
  totalVol: number
  sessionCount: number
  totalSets: number
  avgSets: string
  bestWeekVol: number
}

export default function AllTimeStats({ totalVol, sessionCount, totalSets, avgSets, bestWeekVol }: Props) {
  const fmt = (v: number) => v > 999 ? `${(v / 1000).toFixed(1)}k kg` : `${v} kg`

  return (
    <View style={styles.card}>
      <StatRow label="Total Volume" value={fmt(totalVol)} />
      <View style={styles.divider} />
      <StatRow label="Total Sessions" value={`${sessionCount}`} />
      <View style={styles.divider} />
      <StatRow label="Total Sets" value={`${totalSets}`} />
      <View style={styles.divider} />
      <StatRow label="Avg Sets / Session" value={avgSets} />
      <View style={styles.divider} />
      <StatRow label="Best Week" value={fmt(bestWeekVol)} />
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 13, marginHorizontal: 14, marginBottom: 10,
  },
  divider: { height: 1, backgroundColor: BORDER, marginHorizontal: 13 },
})