import React from 'react'
import { View, Text, Dimensions } from 'react-native'
import { ACCENT, BORDER, DIM } from '../../constants/theme'

const { width } = Dimensions.get('window')
const CHART_W = width - 28 - 26   // card marginHorizontal 14×2 + padding 13×2
const STROKE = 2
const DOT = 4
const PAD = DOT + 2               // vertical padding so dots aren't clipped

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
  const H = height - PAD * 2

  const toX = (i: number) => (i / (points.length - 1)) * CHART_W
  const toY = (v: number) => PAD + (1 - (v - min) / range) * H

  const coords = points.map((v, i) => ({ x: toX(i), y: toY(v) }))

  return (
    <View style={{ height }}>
      {/* Grid lines */}
      {[0, 0.5, 1].map((t, i) => (
        <View
          key={i}
          style={{
            position: 'absolute', left: 0, right: 0,
            top: PAD + t * H, height: 1,
            backgroundColor: BORDER, opacity: 0.4,
          }}
        />
      ))}

      {/* Line segments */}
      {coords.slice(0, -1).map((p1, i) => {
        const p2 = coords[i + 1]
        const dx = p2.x - p1.x
        const dy = p2.y - p1.y
        const len = Math.sqrt(dx * dx + dy * dy)
        const angle = Math.atan2(dy, dx) * (180 / Math.PI)
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: (p1.x + p2.x) / 2 - len / 2,
              top: (p1.y + p2.y) / 2 - STROKE / 2,
              width: len,
              height: STROKE,
              borderRadius: STROKE / 2,
              backgroundColor: color,
              transform: [{ rotate: `${angle}deg` }],
            }}
          />
        )
      })}

      {/* Dots */}
      {coords.map((p, i) => {
        const isLast = i === coords.length - 1
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: p.x - DOT,
              top: p.y - DOT,
              width: DOT * 2,
              height: DOT * 2,
              borderRadius: DOT,
              backgroundColor: isLast ? color : '#000',
              borderWidth: 1.5,
              borderColor: color,
              opacity: isLast ? 1 : 0.65,
            }}
          />
        )
      })}

      {/* Latest value */}
      <View style={{ position: 'absolute', right: 0, top: 0 }}>
        <Text style={{ fontSize: 10, color, fontWeight: '700' }}>
          {points[points.length - 1]}
        </Text>
      </View>
    </View>
  )
}
