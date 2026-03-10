import React from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'

const { width } = Dimensions.get('window')
const ACCENT = '#C8F065'
const CARD = '#1a1a1a'
const BORDER = '#2a2a2a'
const MUTED = '#8e8e93'
const DIM = '#3a3a3c'

export default function Heatmap({ sessions }: { sessions: { date: string }[] }) {
  const COLS = 16
  const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
  const trainedDates = new Set(sessions.map((s) => s.date))

  const today = new Date()
  const cells: { date: string; trained: boolean }[] = []
  for (let i = COLS * 7 - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    cells.push({ date: dateStr, trained: trainedDates.has(dateStr) })
  }

  const grid: { date: string; trained: boolean }[][] = []
  for (let c = 0; c < COLS; c++) {
    const col = []
    for (let r = 0; r < 7; r++) col.push(cells[c * 7 + r])
    grid.push(col)
  }

  const startDate = new Date(cells[0].date).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  const endDate = new Date(cells[cells.length - 1].date).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <View style={styles.heatmap}>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ marginRight: 5 }}>
          {DAYS.map((d) => (
            <Text key={d} style={styles.dayLabel}>{d}</Text>
          ))}
        </View>
        <View style={{ flex: 1, flexDirection: 'row', gap: 2 }}>
          {grid.map((col, ci) => (
            <View key={ci} style={{ flex: 1, gap: 2 }}>
              {col.map((cell, ri) => (
                <View
                  key={ri}
                  style={[styles.cell, cell.trained && styles.cellActive]}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
      <View style={styles.nav}>
        <View style={styles.navBtn}><Text style={styles.navBtnText}>‹</Text></View>
        <Text style={styles.range}>{startDate} – {endDate}</Text>
        <View style={styles.navBtn}><Text style={styles.navBtnText}>›</Text></View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  heatmap: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 13, padding: 12, marginHorizontal: 14, marginBottom: 10,
  },
  dayLabel: {
    fontSize: 11, color: DIM, height: 11,
    lineHeight: 11, marginBottom: 2, width: 16,
  },
  cell: { height: 11, borderRadius: 2, backgroundColor: '#222', marginBottom: 2 },
  cellActive: { backgroundColor: ACCENT },
  nav: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 8, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: BORDER,
  },
  navBtn: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: BORDER, alignItems: 'center', justifyContent: 'center',
  },
  navBtnText: { fontSize: 11, color: ACCENT, lineHeight: 14 },
  range: { fontSize: 12, color: MUTED },
})