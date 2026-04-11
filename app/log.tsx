import React, { useState, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Alert, Modal
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useStore } from '@/store/index'
import type { SessionEntry, Exercise } from '@/store/index'
import EntryCard from '@/components/log/EntryCard'
import type { DraftSet, DraftEntry } from '@/components/log/EntryCard'
import ExercisePickerSheet from '@/components/log/ExercisePickerSheet'
import { ACCENT, CARD, BORDER, MUTED, DIM } from '@/constants/theme'

export default function LogScreen() {
  const insets = useSafeAreaInsets()
  const { exercises, addSession } = useStore()

  const [entries, setEntries] = useState<DraftEntry[]>([])
  const [note, setNote] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [date] = useState(new Date().toISOString().slice(0, 10))

  const addEntry = useCallback((ex: Exercise) => {
    if (entries.find((e) => e.exercise.id === ex.id)) {
      Alert.alert('Already added', `${ex.name} is already in this session.`)
      return
    }
    setEntries((prev) => [
      ...prev,
      { exercise: ex, sets: [{ sets: '1', reps: '', weight: '' }] }
    ])
    setShowPicker(false)
  }, [entries])

  const removeEntry = (i: number) =>
    setEntries((prev) => prev.filter((_, idx) => idx !== i))

  const addSet = (ei: number) =>
    setEntries((prev) =>
      prev.map((e, i) =>
        i === ei
          ? { ...e, sets: [...e.sets, { sets: '1', reps: '', weight: '' }] }
          : e
      )
    )

  const removeSet = (ei: number, si: number) =>
    setEntries((prev) =>
      prev.map((e, i) =>
        i === ei ? { ...e, sets: e.sets.filter((_, j) => j !== si) } : e
      )
    )

  const updateSet = (
    ei: number, si: number, field: 'sets' | 'reps' | 'weight', val: string
  ) =>
    setEntries((prev) =>
      prev.map((e, i) =>
        i === ei
          ? { ...e, sets: e.sets.map((s, j) => j === si ? { ...s, [field]: val } : s) }
          : e
      )
    )

  const save = () => {
    if (entries.length === 0) {
      Alert.alert('No exercises', 'Add at least one exercise before saving.')
      return
    }
    const sessionEntries: SessionEntry[] = entries.map((e) => ({
      exercise: e.exercise,
      sets: e.sets
        .filter((s) => s.reps !== '' || s.weight !== '')
        .flatMap((s) =>
          Array.from({ length: Number(s.sets) || 1 }, () => ({
            reps: Number(s.reps) || 0,
            weight: Number(s.weight) || 0,
          }))
        ),
    }))

    const sessionId = addSession({ date, entries: sessionEntries, note })
    router.replace(`/session/${sessionId}`)
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => router.dismiss()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Log Session</Text>
          <Text style={styles.headerSub}>
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'short', day: 'numeric', month: 'short',
            })}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.dismiss()}
          style={styles.closeBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={16} color="#ff453a" />
        </TouchableOpacity>
      </View>

      {/* Entries */}
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
          <Ionicons name="add" size={16} color={MUTED} />
          <Text style={styles.addExBtnText}>add exercise</Text>
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

      {/* Save */}
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

      {/* Picker — Modal isolates its render tree to avoid Hermes GC handle overflow */}
      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
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
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: CARD,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  headerSub: { fontSize: 11, color: MUTED, marginTop: 2 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,69,58,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,69,58,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },

  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyIcon: { fontSize: 36 },
  emptyText: { fontSize: 13, color: DIM, textAlign: 'center' },

  addExBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderColor: BORDER, borderStyle: 'dashed',
    borderRadius: 13, height: 48, marginBottom: 14,
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