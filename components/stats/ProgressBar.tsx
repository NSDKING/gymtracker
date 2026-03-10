import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { ACCENT, BORDER, MUTED } from '../../constants/theme'

type Props = {
  label: string
  pct: number
  value: string
}

export default function ProgressBar({ label, pct, value }: Props) {
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
        <Text style={{ fontSize: 12, color: '#fff' }}>{label}</Text>
        <Text style={{ fontSize: 11, color: MUTED }}>{value}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(pct * 100, 100)}%` }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  track: { height: 4, backgroundColor: BORDER, borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: ACCENT, borderRadius: 999 },
})