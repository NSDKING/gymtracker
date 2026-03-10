import React from 'react'
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native'
import { ACCENT, BORDER, MUTED, DIM, RED } from '../../constants/theme'

type Props = {
  label: string
  value?: string
  toggle?: boolean
  toggleValue?: boolean
  onToggle?: (v: boolean) => void
  onPress?: () => void
  danger?: boolean
}

export default function SettingRow({
  label, value, toggle, toggleValue, onToggle, onPress, danger
}: Props) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress && !toggle}
    >
      <Text style={[styles.label, danger && { color: RED }]}>{label}</Text>
      <View style={styles.right}>
        {value && <Text style={styles.value}>{value}</Text>}
        {toggle && (
          <Switch
            value={toggleValue}
            onValueChange={onToggle}
            trackColor={{ false: BORDER, true: ACCENT }}
            thumbColor="#fff"
            ios_backgroundColor={BORDER}
          />
        )}
        {onPress && !toggle && (
          <Text style={[styles.arrow, danger && { color: RED }]}>›</Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14,
  },
  label: { fontSize: 14, color: '#fff' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  value: { fontSize: 13, color: MUTED },
  arrow: { fontSize: 18, color: DIM, lineHeight: 20 },
})