import React, { useState, useRef } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet, Image, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Header from '@/components/Header'
import { useStore, getTotalVolume } from '@/store/index'
import { ACCENT, CARD, BORDER, MUTED, DIM } from '@/constants/theme'
import Heatmap from '@/components/Heatmap'
import type { Session } from '@/store/index'
import ViewShot from 'react-native-view-shot'
import * as Sharing from 'expo-sharing'

type DaySummary = {
  date: string
  sessions: Session[]
  totalVol: number
  totalSets: number
  exerciseNames: string[]
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets()
  const { sessions } = useStore()
  const [selectedDay, setSelectedDay] = useState<DaySummary | null>(null)
  const shareRef = useRef<ViewShot>(null)

  const handleShare = async () => {
    try {
      const uri = await shareRef.current!.capture!()
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share Workout' })
    } catch (e: any) {
      Alert.alert('Share failed', e.message)
    }
  }

  // Group sessions by day
  const byDay: Record<string, Session[]> = {}
  sessions.forEach((s) => {
    if (!byDay[s.date]) byDay[s.date] = []
    byDay[s.date].push(s)
  })

  // Build day summaries sorted newest first
  const days: DaySummary[] = Object.entries(byDay)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, daySessions]) => {
      const allEntries = daySessions.flatMap((s) => s.entries)
      const totalVol = daySessions.reduce((t, s) => t + getTotalVolume(s.entries), 0)
      const totalSets = allEntries.reduce((t, e) => t + e.sets.length, 0)
      const seen = new Set<string>()
      const exerciseNames = allEntries
        .map((e) => e.exercise?.name)
        .filter((n): n is string => !!n && !seen.has(n) && !!seen.add(n))
      return { date, sessions: daySessions, totalVol, totalSets, exerciseNames }
    })

  // Group days by month
  const byMonth: Record<string, DaySummary[]> = {}
  days.forEach((d) => {
    const month = new Date(d.date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    if (!byMonth[month]) byMonth[month] = []
    byMonth[month].push(d)
  })

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Header
          title="History"
          subtitle={`${days.length} day${days.length !== 1 ? 's' : ''} trained`}
        />

        <Heatmap sessions={sessions} />

        {days.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No sessions yet</Text>
            <Text style={styles.emptyText}>Tap Log Session to record your first workout</Text>
          </View>
        )}

        {Object.entries(byMonth).map(([month, monthDays]) => (
          <View key={month}>
            <View style={styles.monthHeader}>
              <Text style={styles.monthTitle}>{month}</Text>
              <View style={styles.monthBadge}>
                <Text style={styles.monthBadgeText}>{monthDays.length}</Text>
              </View>
            </View>
            {monthDays.map((day) => {
              const isToday = day.date === new Date().toISOString().slice(0, 10)
              const dateLabel = new Date(day.date).toLocaleDateString('en-GB', {
                weekday: 'short', day: 'numeric', month: 'short',
              })
              return (
                <TouchableOpacity
                  key={day.date}
                  style={styles.dayCard}
                  activeOpacity={0.7}
                  onPress={() => setSelectedDay(day)}
                >
                  <View style={styles.dayHeader}>
                    <View style={styles.dayHeaderLeft}>
                      <Text style={styles.dayDate}>{dateLabel}</Text>
                      {isToday && (
                        <View style={styles.todayBadge}>
                          <Text style={styles.todayBadgeText}>Today</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.dayMeta}>
                      {day.totalVol > 0 && (
                        <Text style={styles.dayMetaText}>
                          {day.totalVol > 999 ? `${(day.totalVol / 1000).toFixed(1)}k` : day.totalVol} kg
                        </Text>
                      )}
                      <Text style={styles.dayMetaDot}>·</Text>
                      <Text style={styles.dayMetaText}>{day.totalSets} sets</Text>
                    </View>
                  </View>
                  <View style={styles.chips}>
                    {day.exerciseNames.slice(0, 4).map((name, i) => (
                      <View key={i} style={styles.chip}>
                        <Text style={styles.chipText}>{name}</Text>
                      </View>
                    ))}
                    {day.exerciseNames.length > 4 && (
                      <View style={styles.chip}>
                        <Text style={styles.chipText}>+{day.exerciseNames.length - 4}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        ))}
      </ScrollView>

      {/* Day detail modal */}
      <Modal
        visible={!!selectedDay}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedDay(null)}
      >
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setSelectedDay(null)} />
        {selectedDay && (
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.sheetHandle} />

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Share card — captured by ViewShot */}
              <ViewShot ref={shareRef} options={{ format: 'png', quality: 1 }}>
                <View style={styles.shareCard}>
                  <View style={styles.shareCardHeader}>
                    <Image source={require('../../assets/images/icon.png')} style={styles.shareIcon} />
                    <Text style={styles.shareAppName}>Repd</Text>
                  </View>
                  <Text style={styles.sheetDate}>
                    {new Date(selectedDay.date).toLocaleDateString('en-GB', {
                      weekday: 'long', day: 'numeric', month: 'long',
                    })}
                  </Text>
                  <View style={styles.sheetStats}>
                    <Text style={styles.sheetStat}>
                      {selectedDay.totalVol > 999
                        ? `${(selectedDay.totalVol / 1000).toFixed(1)}k`
                        : selectedDay.totalVol} kg
                    </Text>
                    <Text style={styles.sheetStatDot}>·</Text>
                    <Text style={styles.sheetStat}>{selectedDay.totalSets} sets</Text>
                    <Text style={styles.sheetStatDot}>·</Text>
                    <Text style={styles.sheetStat}>{selectedDay.exerciseNames.length} exercises</Text>
                  </View>

                  {selectedDay.sessions.flatMap((s) => s.entries).map((entry, i, arr) => {
                    const vol = entry.sets.reduce((t, s) => t + s.reps * s.weight, 0)
                    const maxWeight = Math.max(...entry.sets.map((s) => s.weight), 0)
                    return (
                      <View key={i} style={[styles.exRow, i < arr.length - 1 && styles.exRowBorder]}>
                        <View style={styles.exRowTop}>
                          <Text style={styles.exName}>{entry.exercise?.name ?? 'Unknown'}</Text>
                          <Text style={styles.exVol}>
                            {vol > 999 ? `${(vol / 1000).toFixed(1)}k` : vol} kg
                          </Text>
                        </View>
                        <View style={styles.exMeta}>
                          <Text style={styles.exMetaText}>{entry.sets.length} sets</Text>
                          <Text style={styles.exMetaDot}>·</Text>
                          <Text style={styles.exMetaText}>{maxWeight} kg max</Text>
                        </View>
                        <View style={styles.setsRow}>
                          {entry.sets.map((s, si) => (
                            <View key={si} style={styles.setChip}>
                              <Text style={styles.setChipText}>{s.reps} × {s.weight}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )
                  })}
                </View>
              </ViewShot>
            </ScrollView>

            <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
              <Text style={styles.shareBtnText}>Share Workout</Text>
            </TouchableOpacity>
          </View>
        )}
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  monthHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingTop: 16, paddingBottom: 8,
  },
  monthTitle: { fontSize: 18, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  monthBadge: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2,
  },
  monthBadgeText: { fontSize: 11, fontWeight: '600', color: MUTED },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#fff', marginBottom: 6 },
  emptyText: { fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 18 },

  dayCard: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 13, marginHorizontal: 14, marginBottom: 8, overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 13,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  dayHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dayDate: { fontSize: 15, fontWeight: '700', color: '#fff' },
  todayBadge: {
    backgroundColor: 'rgba(200,240,101,0.1)', borderWidth: 1,
    borderColor: 'rgba(200,240,101,0.25)', borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  todayBadgeText: { fontSize: 10, fontWeight: '600', color: ACCENT },
  dayMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dayMetaText: { fontSize: 13, color: MUTED },
  dayMetaDot: { fontSize: 10, color: DIM },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 11 },
  chip: {
    backgroundColor: '#111', borderWidth: 1, borderColor: BORDER,
    borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5,
  },
  chipText: { fontSize: 12, color: MUTED },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#111', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '80%', paddingTop: 12,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: BORDER,
    alignSelf: 'center', marginBottom: 16,
  },
  sheetHeader: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  sheetDate: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.3, marginBottom: 6 },
  sheetStats: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sheetStat: { fontSize: 13, color: MUTED },
  sheetStatDot: { fontSize: 10, color: DIM },

  exRow: { padding: 14 },
  exRowBorder: { borderBottomWidth: 1, borderBottomColor: BORDER },
  exRowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  exName: { fontSize: 14, fontWeight: '600', color: '#fff' },
  exVol: { fontSize: 13, color: ACCENT, fontWeight: '600' },
  exMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  exMetaText: { fontSize: 12, color: MUTED },
  exMetaDot: { fontSize: 10, color: DIM },
  setsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  setChip: {
    backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: BORDER,
    borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4,
  },
  setChipText: { fontSize: 11, color: MUTED },

  shareCard: { backgroundColor: '#111', padding: 16 },
  shareCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  shareIcon: { width: 28, height: 28, borderRadius: 6 },
  shareAppName: { fontSize: 14, fontWeight: '700', color: MUTED },
  shareBtn: {
    margin: 16, backgroundColor: ACCENT, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  shareBtnText: { fontSize: 15, fontWeight: '700', color: '#000' },
})
