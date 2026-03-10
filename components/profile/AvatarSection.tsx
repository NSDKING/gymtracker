import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import StatStrip from './StatStrip'
import { MUTED } from '../../constants/theme'

type Props = {
  memberSince: string
  sessions: number
  totalVol: number
  totalSets: number
  prCount: number
}

export default function AvatarSection({ memberSince, sessions, totalVol, totalSets, prCount }: Props) {
  const stats = [
    { label: 'Sessions', value: `${sessions}` },
    { label: 'Volume', value: totalVol > 999 ? `${(totalVol / 1000).toFixed(0)}k` : `${totalVol}` },
    { label: 'Sets', value: `${totalSets}` },
    { label: 'PRs', value: `${prCount}` },
  ]

  return (
    <View style={styles.section}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>💪</Text>
      </View>
      <Text style={styles.name}>Athlete</Text>
      <Text style={styles.sub}>Lifting since {memberSince}</Text>
      <StatStrip stats={stats} />
    </View>
  )
}

const styles = StyleSheet.create({
  section: { alignItems: 'center', paddingHorizontal: 14, paddingBottom: 16 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(200,240,101,0.1)',
    borderWidth: 2, borderColor: 'rgba(200,240,101,0.3)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  avatarText: { fontSize: 32 },
  name: {
    fontSize: 20, fontWeight: '700', color: '#fff',
    letterSpacing: -0.3, marginBottom: 4,
  },
  sub: { fontSize: 12, color: MUTED, marginBottom: 16 },
})