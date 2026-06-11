import React, { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import * as Haptics from 'expo-haptics'
import { ACCENT, CARD, BORDER, MUTED } from '../../constants/theme'
import {
  scheduleTimerNotification,
  cancelTimerNotification,
} from '../../lib/notifications'

const PRESETS = [
  { label: '45s', seconds: 45 },
  { label: '60s', seconds: 60 },
  { label: '90s', seconds: 90 },
  { label: '2m',  seconds: 120 },
  { label: '3m',  seconds: 180 },
]

export default function RestTimer() {
  const [selected, setSelected] = useState(90)
  const [remaining, setRemaining] = useState(90)
  const [running, setRunning] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTick = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  useEffect(() => {
    if (!running) { clearTick(); return }

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearTick()
          setRunning(false)
          cancelTimerNotification()
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return clearTick
  }, [running])

  const start = () => {
    setRunning(true)
    scheduleTimerNotification(remaining).catch(() => {})
  }

  const pause = () => {
    setRunning(false)
    cancelTimerNotification()
  }

  const reset = (nextSeconds = selected) => {
    setRunning(false)
    setRemaining(nextSeconds)
    cancelTimerNotification()
  }

  const pickPreset = (seconds: number) => {
    setSelected(seconds)
    reset(seconds)
  }

  const mm = Math.floor(remaining / 60)
  const ss = remaining % 60
  const timeLabel = mm > 0
    ? `${mm}:${ss.toString().padStart(2, '0')}`
    : `${remaining}s`

  const pct = selected > 0 ? remaining / selected : 0
  const done = remaining === 0

  // ── Collapsed pill ──────────────────────────────────────────────────────────
  if (!expanded) {
    return (
      <TouchableOpacity
        style={[styles.pill, running && styles.pillActive, done && styles.pillDone]}
        onPress={() => setExpanded(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.pillIcon}>⏱</Text>
        <Text style={[styles.pillLabel, running && styles.pillLabelActive, done && styles.pillLabelDone]}>
          {running
            ? `Rest · ${timeLabel}`
            : done
              ? 'Rest over — back to work! 💪'
              : 'Rest Timer'}
        </Text>
        {/* thin progress stripe at bottom */}
        {(running || done) && (
          <View style={[styles.stripe, { width: `${Math.round(pct * 100)}%` }]} />
        )}
      </TouchableOpacity>
    )
  }

  // ── Expanded card ───────────────────────────────────────────────────────────
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>⏱  Rest Timer</Text>
        <TouchableOpacity
          onPress={() => setExpanded(false)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.hideBtn}>Hide ↑</Text>
        </TouchableOpacity>
      </View>

      {/* Preset buttons */}
      <View style={styles.presets}>
        {PRESETS.map(p => (
          <TouchableOpacity
            key={p.seconds}
            style={[styles.presetBtn, selected === p.seconds && styles.presetBtnOn]}
            onPress={() => pickPreset(p.seconds)}
            activeOpacity={0.75}
          >
            <Text style={[styles.presetTxt, selected === p.seconds && styles.presetTxtOn]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Countdown */}
      <View style={styles.countdown}>
        <Text style={[styles.timerNum, done && styles.timerNumDone]}>
          {done ? 'Go! 💪' : timeLabel}
        </Text>

        {/* Progress bar */}
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              { width: `${Math.round(pct * 100)}%` },
              done && styles.fillDone,
            ]}
          />
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.mainBtn, done && styles.mainBtnDone]}
          onPress={running ? pause : start}
          activeOpacity={0.85}
        >
          <Text style={[styles.mainBtnTxt, done && styles.mainBtnTxtDone]}>
            {running ? '⏸  Pause' : done ? '✓  Done' : '▶  Start'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetBtn} onPress={() => reset()} activeOpacity={0.75}>
          <Text style={styles.resetTxt}>↺  Reset</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  // ── Collapsed ──
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
    marginBottom: 14, overflow: 'hidden',
  },
  pillActive: { borderColor: 'rgba(200,240,101,0.35)' },
  pillDone: { borderColor: 'rgba(200,240,101,0.6)', backgroundColor: 'rgba(200,240,101,0.06)' },
  pillIcon: { fontSize: 14 },
  pillLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: MUTED },
  pillLabelActive: { color: ACCENT },
  pillLabelDone: { color: ACCENT },
  stripe: {
    position: 'absolute', bottom: 0, left: 0, height: 2,
    backgroundColor: ACCENT,
  },

  // ── Expanded ──
  card: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 14, padding: 14, marginBottom: 14, gap: 14,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  hideBtn: { fontSize: 12, color: MUTED, fontWeight: '500' },

  presets: { flexDirection: 'row', gap: 6 },
  presetBtn: {
    flex: 1, height: 32, borderRadius: 8,
    borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  presetBtnOn: {
    backgroundColor: 'rgba(200,240,101,0.1)',
    borderColor: 'rgba(200,240,101,0.4)',
  },
  presetTxt: { fontSize: 12, fontWeight: '600', color: MUTED },
  presetTxtOn: { color: ACCENT },

  countdown: { alignItems: 'center', gap: 10 },
  timerNum: { fontSize: 48, fontWeight: '800', color: '#fff', letterSpacing: -2 },
  timerNumDone: { fontSize: 32, color: ACCENT, letterSpacing: -1 },
  track: {
    width: '100%', height: 4,
    backgroundColor: '#2a2a2a', borderRadius: 2, overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: 'rgba(200,240,101,0.55)',
    borderRadius: 2,
  },
  fillDone: { backgroundColor: ACCENT },

  controls: { flexDirection: 'row', gap: 8 },
  mainBtn: {
    flex: 1, height: 44, borderRadius: 10,
    backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center',
  },
  mainBtnDone: { backgroundColor: 'rgba(200,240,101,0.15)' },
  mainBtnTxt: { fontSize: 14, fontWeight: '700', color: '#000' },
  mainBtnTxtDone: { color: ACCENT },
  resetBtn: {
    width: 80, height: 44, borderRadius: 10,
    borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  resetTxt: { fontSize: 13, fontWeight: '600', color: MUTED },
})
