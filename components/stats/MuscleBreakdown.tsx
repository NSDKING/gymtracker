import React from 'react'
import { View, StyleSheet } from 'react-native'
import ProgressBar from './ProgressBar'
import { CARD, BORDER } from '../../constants/theme'

type Props = {
  entries: [string, number][]
  total: number
}

export default function MuscleBreakdown({ entries, total }: Props) {
  return (
    <View style={styles.card}>
      {entries.map(([muscle, vol]) => (
        <ProgressBar
          key={muscle}
          label={muscle}
          pct={vol / total}
          value={`${Math.round((vol / total) * 100)}%`}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 13, marginHorizontal: 14, marginBottom: 10, padding: 13,
  },
})