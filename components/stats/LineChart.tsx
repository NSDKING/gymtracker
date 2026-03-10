import React from 'react'
import { View, Text, Dimensions } from 'react-native'
import { ACCENT, BORDER, DIM } from '../../constants/theme'

const { width } = Dimensions.get('window')
const CHART_W = width - 28 - 26

export default function LineChart({
  points,
  height = 80,
  color = ACCENT,
}: {
  points: number[]
  height?: number
  color?: string
}) {
  if (points.length < 2) {
    return (
      <View style={{ height, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: DIM, fontSize: 12 }}>Not enough data</Text>
      </View>
    )
  }

  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const H = height

  return (
    <View style={{ height }}>
      <View style={{ position: 'absolute', inset: 0 }}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: 0, right: 0,
              top: (i / 2) * (H - 12),
              height: 1,
              backgroundColor: BORDER,
              opacity: 0.5,
            }}
          />
        ))}
      </View>
      <View style={{ height, justifyContent: 'flex-end' }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: 3 }}>
          {points.map((v, i) => {
            const barH = Math.max(3, ((v - min) / range) * (H - 16))
            const isLast = i === points.length - 1
            return (
              <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height }}>
                <View style={{
                  width: '100%', height: barH, borderRadius: 3,
                  backgroundColor: isLast ? color : `${color}40`,
                }} />
              </View>
            )
          })}
        </View>
      </View>
      <View style={{ position: 'absolute', right: 0, top: 0 }}>
        <Text style={{ fontSize: 10, color, fontWeight: '700' }}>
          {points[points.length - 1]}
        </Text>
      </View>
    </View>
  )
}