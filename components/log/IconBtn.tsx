import React from 'react'
import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import { CARD, BORDER } from '../../constants/theme'

type Props = {
  onPress: () => void
  label: string
  variant?: 'default' | 'danger' | 'accent'
}

export default function IconBtn({ onPress, label, variant = 'default' }: Props) {
  const bg = variant === 'danger' ? 'rgba(255,69,58,0.15)'
    : variant === 'accent' ? '#C8F065' : CARD
  const border = variant === 'danger' ? 'rgba(255,69,58,0.3)'
    : variant === 'accent' ? '#C8F065' : BORDER
  const color = variant === 'danger' ? '#ff453a'
    : variant === 'accent' ? '#000' : '#fff'

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.btn, { backgroundColor: bg, borderColor: border }]}
    >
      <Text style={[styles.text, { color }]}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  btn: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  text: { fontSize: 13, fontWeight: '600' },
})