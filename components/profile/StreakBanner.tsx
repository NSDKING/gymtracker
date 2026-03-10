import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { ACCENT } from '../../constants/theme'

export default function StreakBanner({ streak }: { streak: number }) {
  if (streak === 0) return null
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>🔥 {streak}-day streak — keep it going!</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: 'rgba(200,240,101,0.07)',
    borderWidth: 1, borderColor: 'rgba(200,240,101,0.2)',
    borderRadius: 11, marginHorizontal: 14, marginBottom: 14,
    padding: 12, alignItems: 'center',
  },
  text: { fontSize: 13, fontWeight: '600', color: ACCENT },
})