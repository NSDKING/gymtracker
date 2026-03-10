import React from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import { ACCENT, CARD, BORDER, MUTED, DIM } from '@/constants/theme'

const { width } = Dimensions.get('window')

const COLS = 16
const DAY_LABEL_W = 22
const PADDING = 12
const GAP = 3
const CARD_MARGIN = 14

const GRID_W = width - CARD_MARGIN * 2 - PADDING * 2 - DAY_LABEL_W
const CELL_SIZE = Math.floor((GRID_W - GAP * (COLS - 1)) / COLS)

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

type Session = {
  date: string
  entries: { sets: { reps: number; weight: number }[] }[]
}

type Cell = { date: string; vol: number } | null

export default function Heatmap({ sessions }: { sessions: Session[] }) {
  // Volume per date
  const volumeByDate = new Map<string, number>()
  sessions.forEach((s) => {
    const vol = s.entries.reduce((t, e) =>
      t + e.sets.reduce((st, set) => st + set.reps * set.weight, 0), 0)
    volumeByDate.set(s.date, (volumeByDate.get(s.date) ?? 0) + vol)
  })
  const maxVol = Math.max(...Array.from(volumeByDate.values()), 1)

  const today = new Date()
  const todayDow = (today.getDay() + 6) % 7

  const totalCells = COLS * 7
  const todayIndex = totalCells - 1 - (6 - todayDow)

  const cells: Cell[] = Array(totalCells).fill(null)
  for (let i = 0; i <= todayIndex; i++) {
    const daysAgo = todayIndex - i
    const d = new Date(today)
    d.setDate(d.getDate() - daysAgo)
    const dateStr = d.toISOString().slice(0, 10)
    cells[i] = { date: dateStr, vol: volumeByDate.get(dateStr) ?? 0 }
  }

  const grid: Cell[][] = []
  for (let c = 0; c < COLS; c++) {
    const col: Cell[] = []
    for (let r = 0; r < 7; r++) col.push(cells[c * 7 + r])
    grid.push(col)
  }

  const getColor = (vol: number) => {
    if (vol === 0) return '#252525'
    const intensity = Math.min(vol / maxVol, 1)
    // 4 levels: dim → full accent
    if (intensity < 0.25) return `${ACCENT}50`
    if (intensity < 0.5)  return `${ACCENT}80`
    if (intensity < 0.75) return `${ACCENT}B0`
    return ACCENT
  }

  const firstReal = cells.find((c) => c !== null)
  const lastReal = cells[todayIndex]
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const rangeLabel = firstReal && lastReal
    ? `${fmt(firstReal.date)} – ${fmt(lastReal.date)}` : ''

  return (
    <View style={styles.heatmap}>
      <View style={{ flexDirection: 'row' }}>
        {/* Day labels */}
        <View style={{ width: DAY_LABEL_W }}>
          {DAYS.map((d) => (
            <View key={d} style={{ height: CELL_SIZE, marginBottom: GAP, justifyContent: 'center' }}>
              <Text style={styles.dayLabel}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Grid */}
        <View style={{ flexDirection: 'row', gap: GAP }}>
          {grid.map((col, ci) => (
            <View key={ci} style={{ flexDirection: 'column', gap: GAP }}>
              {col.map((cell, ri) => (
                <View
                  key={ri}
                  style={[
                    styles.cell,
                    cell === null
                      ? styles.cellFuture
                      : { backgroundColor: getColor(cell.vol) },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.range}>{rangeLabel}</Text>
        <View style={styles.legend}>
          <View style={[styles.legendDot, { backgroundColor: '#252525' }]} />
          <View style={[styles.legendDot, { backgroundColor: `${ACCENT}50` }]} />
          <View style={[styles.legendDot, { backgroundColor: `${ACCENT}80` }]} />
          <View style={[styles.legendDot, { backgroundColor: `${ACCENT}B0` }]} />
          <View style={[styles.legendDot, { backgroundColor: ACCENT }]} />
          <Text style={styles.legendText}>more</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  heatmap: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 13, padding: PADDING,
    marginHorizontal: CARD_MARGIN, marginBottom: 10,
  },
  dayLabel: { fontSize: 9, color: DIM, fontWeight: '500' },
  cell: {
    width: CELL_SIZE, height: CELL_SIZE,
    borderRadius: 3, backgroundColor: '#252525',
  },
  cellFuture: { backgroundColor: 'transparent' },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 10, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: BORDER,
  },
  range: { fontSize: 11, color: DIM },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  legendDot: { width: 8, height: 8, borderRadius: 2 },
  legendText: { fontSize: 10, color: DIM, marginLeft: 2 },
})