import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert,
} from 'react-native'
import { router } from 'expo-router'
import { useStore } from '../../store'
import { swapExercise } from '../../lib/ai'
import { ACCENT, CARD, BORDER, MUTED, RED } from '../../constants/theme'
import type { WorkoutPlan } from '../../store'

type PlanEx = WorkoutPlan['days'][number]['exercises'][number]

interface Props {
  program: WorkoutPlan
  dayIndex: number
}

export default function TodayWorkout({ program, dayIndex }: Props) {
  const { setActiveProgram, isPro } = useStore()
  const day = program.days[dayIndex]

  if (!day) return null

  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [editSets, setEditSets] = useState('')
  const [editReps, setEditReps] = useState('')
  const [editWeight, setEditWeight] = useState('')

  const [swapIdx, setSwapIdx] = useState<number | null>(null)
  const [swapMode, setSwapMode] = useState<'ai' | 'manual' | null>(null)
  const [swapText, setSwapText] = useState('')
  const [swapLoading, setSwapLoading] = useState(false)
  const [swapSuggestion, setSwapSuggestion] = useState<PlanEx | null>(null)

  const updateExercises = (exercises: PlanEx[]) => {
    setActiveProgram({
      ...program,
      days: program.days.map((d, i) => i === dayIndex ? { ...d, exercises } : d),
    })
  }

  const closeAll = () => {
    setEditIdx(null)
    setSwapIdx(null)
    setSwapMode(null)
    setSwapText('')
    setSwapLoading(false)
    setSwapSuggestion(null)
  }

  const openEdit = (idx: number) => {
    closeAll()
    const ex = day.exercises[idx]
    setEditIdx(idx)
    setEditSets(String(ex.sets))
    setEditReps(ex.reps)
    setEditWeight(ex.targetWeight)
  }

  const saveEdit = () => {
    if (editIdx === null) return
    updateExercises(
      day.exercises.map((ex, i) =>
        i === editIdx
          ? { ...ex, sets: parseInt(editSets) || ex.sets, reps: editReps || ex.reps, targetWeight: editWeight }
          : ex
      )
    )
    closeAll()
  }

  const openSwap = (idx: number) => {
    closeAll()
    setSwapIdx(idx)
  }

  const fetchAiSwap = async (idx: number, userRequest?: string) => {
    if (!isPro) { router.push('/paywall'); return }
    setSwapMode('ai')
    setSwapLoading(true)
    setSwapSuggestion(null)
    try {
      const suggestion = await swapExercise(day.exercises[idx].name, day.focus, userRequest)
      setSwapSuggestion(suggestion)
    } catch {
      Alert.alert('Error', 'Could not fetch a replacement. Try again.')
    } finally {
      setSwapLoading(false)
    }
  }

  const confirmSwap = (idx: number, replacement: PlanEx) => {
    updateExercises(day.exercises.map((ex, i) => i === idx ? replacement : ex))
    closeAll()
  }

  const applyManualSwap = (idx: number) => {
    if (!swapText.trim()) return
    updateExercises(day.exercises.map((ex, i) => i === idx ? { ...ex, name: swapText.trim() } : ex))
    closeAll()
  }

  const removeExercise = (idx: number) => {
    if (editIdx === idx || swapIdx === idx) closeAll()
    updateExercises(day.exercises.filter((_, i) => i !== idx))
  }

  if (day.exercises.length === 0) {
    return (
      <View style={styles.restCard}>
        <Text style={styles.restEmoji}>😴</Text>
        <Text style={styles.restTitle}>Rest Day</Text>
        <Text style={styles.restSub}>Recovery is part of the program. Take it easy today.</Text>
      </View>
    )
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.badge}>TODAY · {program.planName.toUpperCase()}</Text>
          <Text style={styles.dayName}>{day.dayName}</Text>
          <Text style={styles.focus}>{day.focus}</Text>
        </View>
        <TouchableOpacity style={styles.editPlanBtn} onPress={() => router.push('/ai-workout')}>
          <Text style={styles.editPlanTxt}>Edit plan</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {day.exercises.map((ex, idx) => {
        const isEditing = editIdx === idx
        const isSwapping = swapIdx === idx
        const isLast = idx === day.exercises.length - 1

        return (
          <View key={idx}>
            <View style={[styles.exRow, !isLast && !isEditing && !isSwapping && styles.exRowBorder]}>
              <View style={styles.exInfo}>
                <Text style={styles.exName} numberOfLines={1}>{ex.name}</Text>
                <Text style={styles.exMeta}>
                  {ex.sets} × {ex.reps}{ex.targetWeight ? ` · ${ex.targetWeight}` : ''}
                </Text>
              </View>

              <View style={styles.exActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, isEditing && styles.actionBtnOn]}
                  onPress={() => isEditing ? closeAll() : openEdit(idx)}
                >
                  <Text style={styles.actionTxt}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, isSwapping && styles.actionBtnOn]}
                  onPress={() => isSwapping ? closeAll() : openSwap(idx)}
                >
                  <Text style={styles.actionTxt}>⇄</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => removeExercise(idx)}>
                  <Text style={[styles.actionTxt, { color: RED }]}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {isEditing && (
              <View style={[styles.panel, !isLast && styles.panelBorder]}>
                <View style={styles.editFields}>
                  <View style={styles.editField}>
                    <Text style={styles.editLabel}>Sets</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editSets}
                      onChangeText={setEditSets}
                      keyboardType="numeric"
                      selectTextOnFocus
                    />
                  </View>
                  <View style={styles.editField}>
                    <Text style={styles.editLabel}>Reps</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editReps}
                      onChangeText={setEditReps}
                      selectTextOnFocus
                    />
                  </View>
                  <View style={styles.editField}>
                    <Text style={styles.editLabel}>Weight</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editWeight}
                      onChangeText={setEditWeight}
                      selectTextOnFocus
                    />
                  </View>
                </View>
                <View style={styles.panelBtns}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={closeAll}>
                    <Text style={styles.cancelTxt}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={saveEdit}>
                    <Text style={styles.saveTxt}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {isSwapping && (
              <View style={[styles.panel, !isLast && styles.panelBorder]}>
                {swapMode === null && (
                  <View style={styles.swapChoices}>
                    <TouchableOpacity style={styles.swapChoice} onPress={() => fetchAiSwap(idx)}>
                      <Text style={styles.swapChoiceEmoji}>🤖</Text>
                      <Text style={styles.swapChoiceTxt}>AI pick</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.swapChoice} onPress={() => setSwapMode('manual')}>
                      <Text style={styles.swapChoiceEmoji}>✏️</Text>
                      <Text style={styles.swapChoiceTxt}>I'll type it</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {swapMode === 'ai' && (
                  <View style={styles.swapAiContent}>
                    {swapLoading ? (
                      <View style={styles.swapLoadingRow}>
                        <ActivityIndicator size="small" color={ACCENT} />
                        <Text style={styles.swapLoadingTxt}>Finding a replacement…</Text>
                      </View>
                    ) : swapSuggestion ? (
                      <View>
                        <Text style={styles.suggestName}>{swapSuggestion.name}</Text>
                        <Text style={styles.suggestMeta}>
                          {swapSuggestion.sets} × {swapSuggestion.reps} · {swapSuggestion.targetWeight}
                        </Text>
                        {swapSuggestion.notes ? (
                          <Text style={styles.suggestNotes}>{swapSuggestion.notes}</Text>
                        ) : null}
                        <View style={styles.panelBtns}>
                          <TouchableOpacity style={styles.cancelBtn} onPress={() => fetchAiSwap(idx)}>
                            <Text style={styles.cancelTxt}>Try again</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.saveBtn} onPress={() => confirmSwap(idx, swapSuggestion!)}>
                            <Text style={styles.saveTxt}>Use this</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity style={styles.saveBtn} onPress={() => fetchAiSwap(idx)}>
                        <Text style={styles.saveTxt}>Retry</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={[styles.cancelBtn, { marginTop: 6, alignSelf: 'flex-start' }]} onPress={closeAll}>
                      <Text style={styles.cancelTxt}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {swapMode === 'manual' && (
                  <>
                    <TextInput
                      style={styles.swapInput}
                      placeholder="Exercise name…"
                      placeholderTextColor={MUTED}
                      value={swapText}
                      onChangeText={setSwapText}
                      autoFocus
                    />
                    <View style={styles.panelBtns}>
                      <TouchableOpacity style={styles.cancelBtn} onPress={closeAll}>
                        <Text style={styles.cancelTxt}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.saveBtn, !swapText.trim() && { opacity: 0.4 }]}
                        onPress={() => applyManualSwap(idx)}
                        disabled={!swapText.trim()}
                      >
                        <Text style={styles.saveTxt}>Apply</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            )}
          </View>
        )
      })}

      <TouchableOpacity
        style={styles.logBtn}
        onPress={() => router.push(`/log?prefillDay=${dayIndex}`)}
        activeOpacity={0.85}
      >
        <Text style={styles.logTxt}>Log Workout →</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  restCard: {
    marginHorizontal: 14, marginBottom: 16,
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 14, padding: 20, alignItems: 'center', gap: 6,
  },
  restEmoji: { fontSize: 36, marginBottom: 4 },
  restTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  restSub: { fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 18 },

  card: {
    marginHorizontal: 14, marginBottom: 16,
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 14, overflow: 'hidden',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, paddingBottom: 12 },
  badge: { fontSize: 10, fontWeight: '700', color: MUTED, letterSpacing: 1.2, marginBottom: 4 },
  dayName: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  focus: { fontSize: 12, color: ACCENT, fontWeight: '600', marginTop: 2 },
  editPlanBtn: {
    borderWidth: 1, borderColor: BORDER, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6, marginTop: 4,
  },
  editPlanTxt: { fontSize: 12, fontWeight: '600', color: MUTED },
  divider: { height: 1, backgroundColor: BORDER },

  exRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12, gap: 10,
  },
  exRowBorder: { borderBottomWidth: 1, borderBottomColor: BORDER },
  exInfo: { flex: 1 },
  exName: { fontSize: 14, fontWeight: '600', color: '#fff' },
  exMeta: { fontSize: 12, color: MUTED, marginTop: 2 },
  exActions: { flexDirection: 'row', gap: 6 },
  actionBtn: {
    width: 30, height: 30, borderRadius: 7,
    borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtnOn: { backgroundColor: 'rgba(200,240,101,0.1)', borderColor: 'rgba(200,240,101,0.4)' },
  actionTxt: { fontSize: 13 },

  panel: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 14, gap: 10, backgroundColor: '#111' },
  panelBorder: { borderBottomWidth: 1, borderBottomColor: BORDER },
  panelBtns: { flexDirection: 'row', gap: 8 },
  cancelBtn: {
    flex: 1, height: 36, borderRadius: 8,
    borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelTxt: { fontSize: 13, fontWeight: '600', color: MUTED },
  saveBtn: {
    flex: 1, height: 36, borderRadius: 8,
    backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center',
  },
  saveTxt: { fontSize: 13, fontWeight: '700', color: '#000' },

  editFields: { flexDirection: 'row', gap: 8 },
  editField: { flex: 1, gap: 4 },
  editLabel: { fontSize: 10, fontWeight: '700', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8 },
  editInput: {
    height: 40, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: BORDER,
    borderRadius: 8, paddingHorizontal: 10, color: '#fff', fontSize: 14, fontWeight: '600',
  },

  swapChoices: { flexDirection: 'row', gap: 8 },
  swapChoice: {
    flex: 1, height: 52, borderRadius: 10,
    borderWidth: 1, borderColor: BORDER, backgroundColor: '#1a1a1a',
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  swapChoiceEmoji: { fontSize: 18 },
  swapChoiceTxt: { fontSize: 12, fontWeight: '600', color: MUTED },
  swapAiContent: { gap: 8 },
  swapLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  swapLoadingTxt: { fontSize: 13, color: MUTED },
  suggestName: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 2 },
  suggestMeta: { fontSize: 12, color: ACCENT, fontWeight: '600', marginBottom: 4 },
  suggestNotes: { fontSize: 12, color: MUTED, lineHeight: 16, marginBottom: 6 },
  swapInput: {
    height: 42, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: BORDER,
    borderRadius: 8, paddingHorizontal: 12, color: '#fff', fontSize: 14,
  },

  logBtn: {
    margin: 14, marginTop: 12,
    backgroundColor: ACCENT, borderRadius: 10, height: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  logTxt: { fontSize: 14, fontWeight: '700', color: '#000' },
})
