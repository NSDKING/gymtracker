import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { generateAIWorkout } from '../lib/ai'
import { ACCENT, CARD, BORDER, MUTED, DIM } from '../constants/theme'

const GOALS = ['Build muscle', 'Increase strength', 'Lose fat', 'Improve endurance', 'General fitness']
const DAYS = [2, 3, 4, 5, 6]

type WorkoutPlan = {
  planName: string
  description: string
  days: {
    dayName: string
    focus: string
    exercises: { name: string; sets: number; reps: string; notes: string }[]
  }[]
}

export default function AIWorkoutScreen() {
  const insets = useSafeAreaInsets()
  const [goal, setGoal] = useState(GOALS[0])
  const [daysPerWeek, setDaysPerWeek] = useState(4)
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<WorkoutPlan | null>(null)

  const handleGenerate = async () => {
    try {
      setLoading(true)
      const result = await generateAIWorkout(goal, daysPerWeek)
      setPlan(result)
    } catch (e: any) {
      Alert.alert('Error', 'Could not generate workout. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backTxt}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>AI Workout</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        {/* Goal picker */}
        <Text style={styles.sectionLabel}>Your goal</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
          {GOALS.map(g => (
            <TouchableOpacity
              key={g}
              style={[styles.pill, goal === g && styles.pillActive]}
              onPress={() => setGoal(g)}
            >
              <Text style={[styles.pillTxt, goal === g && styles.pillTxtActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Days per week */}
        <Text style={styles.sectionLabel}>Days per week</Text>
        <View style={styles.daysRow}>
          {DAYS.map(d => (
            <TouchableOpacity
              key={d}
              style={[styles.dayBtn, daysPerWeek === d && styles.dayBtnActive]}
              onPress={() => setDaysPerWeek(d)}
            >
              <Text style={[styles.dayBtnTxt, daysPerWeek === d && styles.dayBtnTxtActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Generate button */}
        <TouchableOpacity
          style={[styles.generateBtn, loading && { opacity: 0.6 }]}
          onPress={handleGenerate}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.generateTxt}>
                {plan ? '🔄 Regenerate Plan' : '✨ Generate My Plan'}
              </Text>
          }
        </TouchableOpacity>

        {loading && (
          <Text style={styles.loadingHint}>Claude is building your plan…</Text>
        )}

        {/* Plan result */}
        {plan && !loading && (
          <View style={styles.planWrap}>
            <Text style={styles.planName}>{plan.planName}</Text>
            <Text style={styles.planDesc}>{plan.description}</Text>

            {plan.days.map((day, i) => (
              <View key={i} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayName}>{day.dayName}</Text>
                  <Text style={styles.dayFocus}>{day.focus}</Text>
                </View>
                {day.exercises.map((ex, j) => (
                  <View key={j} style={[styles.exRow, j < day.exercises.length - 1 && styles.exRowBorder]}>
                    <View style={styles.exLeft}>
                      <Text style={styles.exName}>{ex.name}</Text>
                      {ex.notes ? <Text style={styles.exNotes}>{ex.notes}</Text> : null}
                    </View>
                    <View style={styles.exRight}>
                      <Text style={styles.exSets}>{ex.sets} × {ex.reps}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: BORDER },
  backBtn: { width: 60 },
  backTxt: { fontSize: 17, color: ACCENT },
  navTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: MUTED, textTransform: 'uppercase', letterSpacing: 1, marginTop: 24, marginBottom: 10, paddingHorizontal: 16 },
  pillRow: { paddingHorizontal: 16, gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER },
  pillActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  pillTxt: { fontSize: 14, color: MUTED, fontWeight: '500' },
  pillTxtActive: { color: '#000', fontWeight: '700' },
  daysRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8 },
  dayBtn: { flex: 1, height: 44, borderRadius: 10, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  dayBtnActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  dayBtnTxt: { fontSize: 16, fontWeight: '700', color: MUTED },
  dayBtnTxtActive: { color: '#000' },
  generateBtn: { margin: 16, marginTop: 24, backgroundColor: ACCENT, borderRadius: 13, height: 52, alignItems: 'center', justifyContent: 'center' },
  generateTxt: { fontSize: 16, fontWeight: '800', color: '#000' },
  loadingHint: { textAlign: 'center', color: MUTED, fontSize: 13, marginTop: 8 },
  planWrap: { paddingHorizontal: 16, gap: 12, marginTop: 8 },
  planName: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  planDesc: { fontSize: 14, color: MUTED, lineHeight: 20, marginBottom: 4 },
  dayCard: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 13, overflow: 'hidden' },
  dayHeader: { padding: 12, borderBottomWidth: 1, borderBottomColor: BORDER, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayName: { fontSize: 14, fontWeight: '700', color: '#fff' },
  dayFocus: { fontSize: 11, color: MUTED },
  exRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  exRowBorder: { borderBottomWidth: 1, borderBottomColor: BORDER },
  exLeft: { flex: 1 },
  exName: { fontSize: 14, fontWeight: '500', color: '#fff' },
  exNotes: { fontSize: 11, color: DIM, marginTop: 2 },
  exRight: {},
  exSets: { fontSize: 13, fontWeight: '700', color: ACCENT },
})