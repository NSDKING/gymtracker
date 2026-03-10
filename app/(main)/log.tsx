import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Alert
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useStore } from '../store/index'
import type { SessionEntry, Exercise } from '../store/index'
import IconBtn from '../components/log/IconBtn'
import EntryCard from '../components/log/EntryCard'
import ExercisePickerSheet from '../components/log/ExercisePickerSheet'
import { ACCENT, CARD, BORDER, MUTED, DIM } from '../constants/theme'

type DraftSet = { reps: string; weight: string }
type DraftEntry = { exercise: Exercise; sets: DraftSet[] }

export default function LogScreen() {
  const insets = useSafeAreaInsets()
  const { exercises, addSession } = useStore()

  const [entries, setEntries] = useState<DraftEntry[]>([])
  const [note, setNote] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [date] = useState(new Date().toISOString().slice(0, 10))

  const addEntry = (ex: Exercise) => {
    if (entries.find((e) => e.exercise.id === ex.id)) {
      Alert.alert('Already added', `${ex.name} is already in this session.`)
      return
    }
    setEntries((prev) => [...prev, { exercise: ex, sets: [{ reps: '', weight: '' }] }])
    setShowPicker(false)
  }

  const removeEntry = (i: number) => setEntries((prev) => prev.filter((_, idx) => idx !== i))

  const addSet = (ei: number) =>
    setEntries((prev) =>
      prev.map((e, i) => i === ei ? { ...e, sets: [...e.sets, { reps: '', weight: '' }] } : e)
    )

  const removeSet = (ei: number, si: number) =>
    setEntries((prev) =>
      prev.map((e, i) => i === ei ? { ...e, sets: e.sets.filter((_, j) => j !== si) } : e)
    )

  const updateSet = (ei: number, si: number, field: 'reps' | 'weight', val: string) =>
    setEntries((prev) =>
      prev.map((e, i) =>
        i === ei ? { ...e, sets: e.sets.map((s, j) => j === si ? { ...s, [field]: val } : s) } : e
      )
    )

  const save = () => {
    if (entries.length === 0) {
      Alert.alert('No exercises', 'Add at least one exercise before saving.')
      return
    }
    const sessionEntries: SessionEntry[] = entries.map((e) => ({
      exerciseId: e.exercise.id,
      sets: e.sets
        .filter((s) => s.reps !== '' || s.weight !== '')
        .map((s) => ({ reps: Number(s.reps) || 0, weight: Number(s.weight) || 0 })),
    }))
    const sessionId = Date.now().toString()
    addSession({ id: sessionId, date, entries: sessionEntries, note })
    router.replace(`/session/${sessionId}`)
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={{ gap: 2 }}>
          <Text style={styles.headerTitle}>Log Session</Text>
          <Text style={styles.headerSub}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
          </Text>
        </View>
        <IconBtn onPress={() => router.dismiss()} label="✕" variant="danger" />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 14, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {entries.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏋️</Text>
            <Text style={styles.emptyText}>No exercises yet — tap below to add one</Text>
          </View>
        )}

        {entries.map((entry, i) => (
          <EntryCard
            key={`${entry.exercise.id}-${i}`}
            entry={entry}
            index={i}
            onAddSet={addSet}
            onRemoveSet={removeSet}
            onUpdateSet={updateSet}
            onRemoveEntry={removeEntry}
          />
        ))}

        <TouchableOpacity
          style={styles.addExBtn}
          onPress={() => setShowPicker(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.addExBtnText}>+ Add Exercise</Text>
        </TouchableOpacity>

        <Text style={styles.fieldLabel}>Notes (optional)</Text>
        <TextInput
          style={styles.noteInput}
          value={note}
          onChangeText={setNote}
          placeholder="How did it feel?"
          placeholderTextColor={DIM}
          multiline
        />
      </ScrollView>

      <View style={[styles.saveWrap, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.saveBtn, entries.length === 0 && styles.saveBtnDisabled]}
          onPress={save}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>
            {entries.length === 0
              ? 'Add exercises to save'
              : `Save Session · ${entries.length} exercise${entries.length > 1 ? 's' : ''}`}
          </Text>
        </TouchableOpacity>
      </View>

      {showPicker && (
        <View style={StyleSheet.absoluteFill}>
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setShowPicker(false)}
          />
          <ExercisePickerSheet
            exercises={exercises}
            onPick={addEntry}
            onClose={() => setShowPicker(false)}
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: CARD,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  headerSub: { fontSize: 11, color: MUTED },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyIcon: { fontSize: 36 },
  emptyText: { fontSize: 13, color: DIM, textAlign: 'center' },
  addExBtn: {
    borderWidth: 1, borderColor: BORDER, borderStyle: 'dashed',
    borderRadius: 13, height: 48,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  addExBtnText: { fontSize: 14, color: MUTED, fontWeight: '500' },
  fieldLabel: { fontSize: 11, color: MUTED, marginBottom: 7, fontWeight: '500' },
  noteInput: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 11, padding: 12, color: '#fff', fontSize: 14, minHeight: 48,
  },
  saveWrap: {
    paddingHorizontal: 14, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: CARD, backgroundColor: '#000',
  },
  saveBtn: {
    backgroundColor: ACCENT, borderRadius: 13, height: 50,
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#000' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)' },
})