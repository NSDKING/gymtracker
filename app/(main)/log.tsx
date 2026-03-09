import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useStore } from '@/store/index'
import type { SessionEntry, Exercise } from '@/store/index'

// ─── TYPES ────────────────────────────────────────────────────────────────────

type DraftSet = { reps: string; weight: string }
type DraftEntry = { exercise: Exercise; sets: DraftSet[] }

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const MUSCLES = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Other']
const ACCENT = '#C8F065'
const CARD = '#1a1a1a'
const BORDER = '#2a2a2a'
const MUTED = '#8e8e93'
const DIM = '#3a3a3c'

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────

function IconBtn({
  onPress, label, variant = 'default'
}: {
  onPress: () => void
  label: string
  variant?: 'default' | 'danger' | 'accent'
}) {
  const bg = variant === 'danger'
    ? 'rgba(255,69,58,0.15)'
    : variant === 'accent'
    ? ACCENT
    : CARD

  const border = variant === 'danger'
    ? 'rgba(255,69,58,0.3)'
    : variant === 'accent'
    ? ACCENT
    : BORDER

  const color = variant === 'danger'
    ? '#ff453a'
    : variant === 'accent'
    ? '#000'
    : '#fff'

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.iconBtn, { backgroundColor: bg, borderColor: border }]}
    >
      <Text style={[styles.iconBtnText, { color }]}>{label}</Text>
    </TouchableOpacity>
  )
}

// ─── CREATE EXERCISE TAB ──────────────────────────────────────────────────────

function CreateExerciseTab({ onCreated }: { onCreated: (ex: Exercise) => void }) {
  const { addExercise, exercises } = useStore()
  const [name, setName] = useState('')
  const [muscle, setMuscle] = useState('Chest')

  const create = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      Alert.alert('Missing name', 'Give your exercise a name.')
      return
    }
    const exists = exercises.find(
      (e) => e.name.toLowerCase() === trimmed.toLowerCase()
    )
    if (exists) {
      Alert.alert('Already exists', 'An exercise with that name already exists.')
      return
    }
    const newEx: Exercise = {
      id: Date.now().toString(),
      name: trimmed,
      muscle,
    }
    addExercise(newEx)
    onCreated(newEx)
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Name input */}
      <Text style={styles.fieldLabel}>Exercise Name</Text>
      <TextInput
        style={styles.fieldInput}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Incline Dumbbell Press"
        placeholderTextColor={DIM}
        returnKeyType="done"
        autoCorrect={false}
      />

      {/* Muscle group */}
      <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Muscle Group</Text>
      <View style={styles.muscleGrid}>
        {MUSCLES.map((m) => (
          <TouchableOpacity
            key={m}
            onPress={() => setMuscle(m)}
            activeOpacity={0.7}
            style={[
              styles.muscleChip,
              muscle === m && styles.muscleChipActive,
            ]}
          >
            {muscle === m && (
              <Text style={{ fontSize: 9, color: ACCENT, marginRight: 4 }}>✓</Text>
            )}
            <Text
              style={[
                styles.muscleChipText,
                muscle === m && styles.muscleChipTextActive,
              ]}
            >
              {m}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Live preview */}
      <View style={[
        styles.previewCard,
        !name.trim() && { opacity: 0.3 }
      ]}>
        <View style={styles.previewDot} />
        <View style={{ flex: 1 }}>
          <Text style={styles.previewName}>
            {name.trim() || 'Exercise name'}
          </Text>
          <Text style={styles.previewMuscle}>{muscle}</Text>
        </View>
        <View style={styles.previewChip}>
          <Text style={styles.previewChipText}>New</Text>
        </View>
      </View>

      {/* CTA */}
      <TouchableOpacity
        onPress={create}
        activeOpacity={0.85}
        style={[
          styles.createBtn,
          !name.trim() && styles.createBtnDisabled,
        ]}
      >
        <Text style={styles.createBtnText}>
          {name.trim()
            ? `Create "${name.trim()}" & Add`
            : 'Create & Add to Session'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

// ─── EXERCISE PICKER TAB ──────────────────────────────────────────────────────

function ExercisePickerTab({
  exercises,
  onPick,
}: {
  exercises: Exercise[]
  onPick: (ex: Exercise) => void
}) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')

  const muscles = ['All', ...Array.from(new Set(exercises.map((e) => e.muscle)))]

  const filtered = exercises.filter((ex) => {
    const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase())
    const matchMuscle = filter === 'All' || ex.muscle === filter
    return matchSearch && matchMuscle
  })

  return (
    <View style={{ flex: 1 }}>
      {/* Search */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises…"
          placeholderTextColor={DIM}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
            <Text style={{ fontSize: 13, color: MUTED }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Muscle filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {muscles.map((m) => (
          <TouchableOpacity
            key={m}
            onPress={() => setFilter(m)}
            activeOpacity={0.7}
            style={[styles.filterChip, filter === m && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, filter === m && styles.filterChipTextActive]}>
              {m}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {filtered.length === 0 && (
          <View style={{ padding: 32, alignItems: 'center' }}>
            <Text style={{ color: DIM, fontSize: 13 }}>No exercises found</Text>
          </View>
        )}
        {filtered.map((ex, i) => (
          <TouchableOpacity
            key={ex.id}
            style={[styles.exRow, i < filtered.length - 1 && styles.exRowBorder]}
            onPress={() => onPick(ex)}
            activeOpacity={0.7}
          >
            <View style={styles.exDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.exName}>{ex.name}</Text>
              <Text style={styles.exMuscle}>{ex.muscle}</Text>
            </View>
            <View style={styles.exAddBtn}>
              <Text style={styles.exAddBtnText}>+</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}


// ─── EXERCISE PICKER SHEET ────────────────────────────────────────────────────

function ExercisePickerSheet({
  exercises,
  onPick,
  onClose,
}: {
  exercises: Exercise[]
  onPick: (ex: Exercise) => void
  onClose: () => void
}) {
  const [tab, setTab] = useState<'pick' | 'create'>('pick')
  const insets = useSafeAreaInsets()

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.sheet, { paddingBottom: insets.bottom }]}
    >
      {/* Handle */}
      <View style={styles.sheetHandle} />

      {/* Header */}
      <View style={styles.sheetHeader}>
        <Text style={styles.sheetTitle}>Add Exercise</Text>
        <IconBtn onPress={onClose} label="✕" variant="danger" />
      </View>

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          onPress={() => setTab('pick')}
          activeOpacity={0.7}
          style={[styles.tabBtn, tab === 'pick' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabBtnText, tab === 'pick' && styles.tabBtnTextActive]}>
            My Exercises
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab('create')}
          activeOpacity={0.7}
          style={[styles.tabBtn, tab === 'create' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabBtnText, tab === 'create' && styles.tabBtnTextActive]}>
            ✦  Create New
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {tab === 'pick' ? (
          <ExercisePickerTab exercises={exercises} onPick={onPick} />
        ) : (
          <CreateExerciseTab onCreated={onPick} />
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

// ─── ENTRY CARD ───────────────────────────────────────────────────────────────

function EntryCard({
  entry, index, onAddSet, onRemoveSet, onUpdateSet, onRemoveEntry,
}: {
  entry: DraftEntry
  index: number
  onAddSet: (i: number) => void
  onRemoveSet: (ei: number, si: number) => void
  onUpdateSet: (ei: number, si: number, field: 'reps' | 'weight', val: string) => void
  onRemoveEntry: (i: number) => void
}) {
  return (
    <View style={styles.entryCard}>
      {/* Header */}
      <View style={styles.entryHeader}>
        <View>
          <Text style={styles.entryName}>{entry.exercise.name}</Text>
          <Text style={styles.entryMuscle}>{entry.exercise.muscle}</Text>
        </View>
        <IconBtn onPress={() => onRemoveEntry(index)} label="✕" variant="danger" />
      </View>

      {/* Column headers */}
      <View style={styles.setHeaders}>
        <View style={{ width: 28 }} />
        <Text style={[styles.setHeaderText, { flex: 1, textAlign: 'center' }]}>REPS</Text>
        <Text style={[styles.setHeaderText, { flex: 1, textAlign: 'center' }]}>KG</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Sets */}
      {entry.sets.map((set, si) => (
        <View key={si} style={styles.setRow}>
          <View style={styles.setNum}>
            <Text style={styles.setNumText}>{si + 1}</Text>
          </View>
          <TextInput
            style={styles.setInput}
            value={set.reps}
            onChangeText={(v) => onUpdateSet(index, si, 'reps', v)}
            keyboardType="numeric"
            placeholder="10"
            placeholderTextColor={DIM}
            maxLength={3}
          />
          <TextInput
            style={styles.setInput}
            value={set.weight}
            onChangeText={(v) => onUpdateSet(index, si, 'weight', v)}
            keyboardType="decimal-pad"
            placeholder="60"
            placeholderTextColor={DIM}
            maxLength={6}
          />
          {entry.sets.length > 1 ? (
            <TouchableOpacity
              onPress={() => onRemoveSet(index, si)}
              style={styles.removeSetBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.removeSetBtnText}>−</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 28 }} />
          )}
        </View>
      ))}

      {/* Add set */}
      <TouchableOpacity
        onPress={() => onAddSet(index)}
        style={styles.addSetBtn}
        activeOpacity={0.7}
      >
        <Text style={styles.addSetBtnText}>+ Add Set</Text>
      </TouchableOpacity>
    </View>
  )
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function LogScreen() {
  const insets = useSafeAreaInsets()
  const { exercises, addSession } = useStore()

  const [entries, setEntries] = useState<DraftEntry[]>([])
  const [note, setNote] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [date] = useState(new Date().toISOString().slice(0, 10))

  // ── Entry actions ──────────────────────────────────────────────────────────

  const addEntry = (ex: Exercise) => {
    // prevent duplicate exercise in same session
    const alreadyAdded = entries.find((e) => e.exercise.id === ex.id)
    if (alreadyAdded) {
      Alert.alert('Already added', `${ex.name} is already in this session.`)
      return
    }
    setEntries((prev) => [...prev, { exercise: ex, sets: [{ reps: '', weight: '' }] }])
    setShowPicker(false)
  }

  const removeEntry = (i: number) =>
    setEntries((prev) => prev.filter((_, idx) => idx !== i))

  const addSet = (ei: number) =>
    setEntries((prev) =>
      prev.map((e, i) =>
        i === ei ? { ...e, sets: [...e.sets, { reps: '', weight: '' }] } : e
      )
    )

  const removeSet = (ei: number, si: number) =>
    setEntries((prev) =>
      prev.map((e, i) =>
        i === ei ? { ...e, sets: e.sets.filter((_, j) => j !== si) } : e
      )
    )

  const updateSet = (
    ei: number, si: number, field: 'reps' | 'weight', val: string
  ) =>
    setEntries((prev) =>
      prev.map((e, i) =>
        i === ei
          ? { ...e, sets: e.sets.map((s, j) => j === si ? { ...s, [field]: val } : s) }
          : e
      )
    )

  // ── Save ──────────────────────────────────────────────────────────────────

const save = () => {
  if (entries.length === 0) {
    Alert.alert('No exercises', 'Add at least one exercise before saving.')
    return
  }
  const sessionEntries: SessionEntry[] = entries.map((e) => ({
    exerciseId: e.exercise.id,
    sets: e.sets
      .filter((s) => s.reps !== '' || s.weight !== '')
      .map((s) => ({
        reps: Number(s.reps) || 0,
        weight: Number(s.weight) || 0,
      })),
  }))

  const sessionId = Date.now().toString()

  addSession({
    id: sessionId,
    date,
    entries: sessionEntries,
    note,
  })

  // Navigate to summary instead of just dismissing
  router.replace(`/session/${sessionId}`)
}
  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ gap: 2 }}>
          <Text style={styles.headerTitle}>Log Session</Text>
          <Text style={styles.headerSub}>
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'short', day: 'numeric', month: 'short',
            })}
          </Text>
        </View>
        <IconBtn onPress={() => router.dismiss()} label="✕" variant="danger" />
      </View>

      {/* Entries */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 14, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {entries.length === 0 && (
          <View style={styles.emptyEntries}>
            <Text style={styles.emptyEntriesIcon}>🏋️</Text>
            <Text style={styles.emptyEntriesText}>
              No exercises yet — tap below to add one
            </Text>
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

        {/* Add exercise */}
        <TouchableOpacity
          style={styles.addExBtn}
          onPress={() => setShowPicker(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.addExBtnText}>+ Add Exercise</Text>
        </TouchableOpacity>

        {/* Note */}
        <Text style={[styles.fieldLabel, { marginTop: 8 }]}>Notes (optional)</Text>
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
            {entries.length === 0 ? 'Add exercises to save' : `Save Session · ${entries.length} exercise${entries.length > 1 ? 's' : ''}`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Picker overlay */}
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

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#1a1a1a',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  headerSub: { fontSize: 11, color: MUTED },

  // Icon button
  iconBtn: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  iconBtnText: { fontSize: 13, fontWeight: '600' },

  // Empty state
  emptyEntries: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyEntriesIcon: { fontSize: 36 },
  emptyEntriesText: { fontSize: 13, color: DIM, textAlign: 'center' },

  // Entry card
  entryCard: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 13, marginBottom: 10, overflow: 'hidden',
  },
  entryHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 13, borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  entryName: { fontSize: 15, fontWeight: '700', color: '#fff' },
  entryMuscle: { fontSize: 10, color: MUTED, marginTop: 2 },

  // Set headers
  setHeaders: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, paddingHorizontal: 13, paddingVertical: 6,
  },
  setHeaderText: {
    fontSize: 8, fontWeight: '600', color: DIM,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },

  // Set row
  setRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 13, paddingVertical: 7,
    borderTopWidth: 1, borderTopColor: BORDER,
  },
  setNum: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#2a2a2a',
    alignItems: 'center', justifyContent: 'center',
  },
  setNumText: { fontSize: 10, fontWeight: '600', color: MUTED },
  setInput: {
    flex: 1, backgroundColor: '#111', borderWidth: 1, borderColor: BORDER,
    borderRadius: 8, height: 38, textAlign: 'center',
    fontSize: 14, fontWeight: '600', color: '#fff',
  },
  removeSetBtn: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#2a2a2a',
    alignItems: 'center', justifyContent: 'center',
  },
  removeSetBtnText: { fontSize: 16, color: MUTED, lineHeight: 20 },
  addSetBtn: {
    padding: 12, alignItems: 'center',
    borderTopWidth: 1, borderTopColor: BORDER,
  },
  addSetBtnText: { fontSize: 13, color: ACCENT, fontWeight: '600' },

  // Add exercise
  addExBtn: {
    borderWidth: 1, borderColor: BORDER, borderStyle: 'dashed',
    borderRadius: 13, height: 48,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  addExBtnText: { fontSize: 14, color: MUTED, fontWeight: '500' },

  // Fields
  fieldLabel: { fontSize: 11, color: MUTED, marginBottom: 7, fontWeight: '500' },
  fieldInput: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 11, height: 46, paddingHorizontal: 13,
    fontSize: 15, color: '#fff',
  },
  noteInput: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 11, padding: 12, color: '#fff', fontSize: 14, minHeight: 48,
  },

  // Muscle grid
  muscleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  muscleChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 999, borderWidth: 1, borderColor: BORDER, backgroundColor: CARD,
  },
  muscleChipActive: {
    backgroundColor: 'rgba(200,240,101,0.1)',
    borderColor: 'rgba(200,240,101,0.3)',
  },
  muscleChipText: { fontSize: 13, fontWeight: '500', color: MUTED },
  muscleChipTextActive: { color: ACCENT },

  // Preview card
  previewCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#111', borderWidth: 1,
    borderColor: 'rgba(200,240,101,0.2)',
    borderRadius: 11, padding: 13, marginBottom: 16,
  },
  previewDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: ACCENT },
  previewName: { fontSize: 14, fontWeight: '600', color: '#fff' },
  previewMuscle: { fontSize: 11, color: MUTED, marginTop: 2 },

  // Create button
  createBtn: {
    backgroundColor: ACCENT, borderRadius: 13, height: 50,
    alignItems: 'center', justifyContent: 'center',
  },
  createBtnDisabled: { opacity: 0.4 },
  createBtnText: { fontSize: 15, fontWeight: '700', color: '#000' },

  // Save
  saveWrap: {
    paddingHorizontal: 14, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: '#1a1a1a', backgroundColor: '#000',
  },
  saveBtn: {
    backgroundColor: ACCENT, borderRadius: 13, height: 50,
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#000' },

  // Sheet
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: CARD,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderTopWidth: 1, borderColor: BORDER,
    maxHeight: '85%',
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: BORDER,
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 14,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },

  // Tabs inside sheet
  tabRow: {
    flexDirection: 'row', backgroundColor: '#111',
    borderRadius: 10, padding: 3, marginHorizontal: 14, marginBottom: 12,
  },
  tabBtn: {
    flex: 1, textAlign: 'center', paddingVertical: 8,
    borderRadius: 8, alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: BORDER },
  tabBtnText: { fontSize: 13, fontWeight: '500', color: MUTED },
  tabBtnTextActive: { color: '#fff' },

  // Picker list
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111', borderWidth: 1, borderColor: BORDER,
    borderRadius: 11, marginHorizontal: 14, marginBottom: 10,
    paddingHorizontal: 12, height: 42,
  },
  searchIcon: { fontSize: 16, color: DIM, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#fff', height: '100%' },
  filterRow: { paddingHorizontal: 14, gap: 6, paddingBottom: 10 },
  filterChip: {
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 999, borderWidth: 1, borderColor: BORDER, backgroundColor: '#111',
  },
  filterChipActive: {
    backgroundColor: 'rgba(200,240,101,0.1)',
    borderColor: 'rgba(200,240,101,0.3)',
  },
  filterChipText: { fontSize: 12, fontWeight: '500', color: MUTED },
  filterChipTextActive: { color: ACCENT },
  exRow: { flexDirection: 'row', alignItems: 'center', padding: 13, gap: 12 },
  exRowBorder: { borderBottomWidth: 1, borderBottomColor: BORDER },
  exDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: ACCENT },
  exName: { fontSize: 14, fontWeight: '500', color: '#fff' },
  exMuscle: { fontSize: 10, color: MUTED, marginTop: 2 },
  exAddBtn: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: ACCENT,
    alignItems: 'center', justifyContent: 'center',
  },
  exAddBtnText: { fontSize: 16, fontWeight: '700', color: '#000', lineHeight: 20 },
  // Preview card updated
  previewChip: {
    backgroundColor: 'rgba(200,240,101,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(200,240,101,0.25)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  previewChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: ACCENT,
  },
})