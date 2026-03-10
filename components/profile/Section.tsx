import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { CARD, BORDER, MUTED, RED } from '../../constants/theme'

type Props = {
  title: string
  children: React.ReactNode
  danger?: boolean
}

export default function Section({ title, children, danger }: Props) {
  return (
    <View style={{ marginBottom: 6 }}>
      <Text style={[styles.label, danger && { color: RED }]}>{title}</Text>
      <View style={[styles.card, { padding: 0 }]}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11, fontWeight: '600', color: MUTED,
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: 14, paddingTop: 16, paddingBottom: 6,
  },
  card: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 13, marginHorizontal: 14,
  },
})