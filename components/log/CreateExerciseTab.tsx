import React, { useState, useCallback, memo } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native'
import { useStore } from '../../store/index'
import type { Exercise } from '../../store/index'
import { ACCENT, CARD, BORDER, MUTED, DIM } from '../../constants/theme'

const MUSCLES = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Other']

const MuscleChip = memo(function MuscleChip({
  label, selected, onSelect,
}: { label: string; selected: boolean; onSelect: (m: string) => void }) {
  const handlePress = useCallback(() => onSelect(label), [label, onSelect])
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={[styles.chip, selected && styles.chipActive]}
    >
      {selected && <Text style={{ fontSize: 9, color: ACCENT, marginRight: 4 }}>✓</Text>}
      <Text style={[styles.chipText, selected && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  )
})

export default function CreateExerciseTab({ onCreated }: { onCreated: (ex: Exercise) => void }) {
  const { addExercise, exercises } = useStore()
  const [name, setName] = useState('')
  const [muscle, setMuscle] = useState('Chest')

  const handleSelectMuscle = useCallback((m: string) => setMuscle(m), [])

  const create = useCallback(() => {
    const trimmed = name.trim()
    if (!trimmed) { Alert.alert('Missing name', 'Give your exercise a name.'); return }
    const exists = exercises.find((e) => e.name.toLowerCase() === trimmed.toLowerCase())
    if (exists) { Alert.alert('Already exists', 'An exercise with that name already exists.'); return }
    const newEx = addExercise(trimmed, muscle)
    onCreated(newEx)
  }, [name, muscle, exercises, addExercise, onCreated])

  const trimmedName = name.trim()

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.label}>Exercise Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Incline Dumbbell Press"
        placeholderTextColor={DIM}
        returnKeyType="done"
        autoCorrect={false}
      />

      <Text style={[styles.label, { marginTop: 20 }]}>Muscle Group</Text>
      <View style={styles.muscleGrid}>
        {MUSCLES.map((m) => (
          <MuscleChip key={m} label={m} selected={muscle === m} onSelect={handleSelectMuscle} />
        ))}
      </View>

      <View style={[styles.preview, !trimmedName && { opacity: 0.3 }]}>
        <View style={styles.previewDot} />
        <View style={{ flex: 1 }}>
          <Text style={styles.previewName}>{trimmedName || 'Exercise name'}</Text>
          <Text style={styles.previewMuscle}>{muscle}</Text>
        </View>
        <View style={styles.previewChip}>
          <Text style={styles.previewChipText}>New</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={create}
        activeOpacity={0.85}
        style={[styles.createBtn, !trimmedName && styles.createBtnDisabled]}
      >
        <Text style={styles.createBtnText}>
          {trimmedName ? `Create "${trimmedName}" & Add` : 'Create & Add to Session'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  label: { fontSize: 11, color: MUTED, marginBottom: 7, fontWeight: '500' },
  input: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 11, height: 46, paddingHorizontal: 13, fontSize: 15, color: '#fff',
  },
  muscleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 999, borderWidth: 1, borderColor: BORDER, backgroundColor: CARD,
  },
  chipActive: { backgroundColor: 'rgba(200,240,101,0.1)', borderColor: 'rgba(200,240,101,0.3)' },
  chipText: { fontSize: 13, fontWeight: '500', color: MUTED },
  chipTextActive: { color: ACCENT },
  preview: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#111', borderWidth: 1, borderColor: 'rgba(200,240,101,0.2)',
    borderRadius: 11, padding: 13, marginBottom: 16,
  },
  previewDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: ACCENT },
  previewName: { fontSize: 14, fontWeight: '600', color: '#fff' },
  previewMuscle: { fontSize: 11, color: MUTED, marginTop: 2 },
  previewChip: {
    backgroundColor: 'rgba(200,240,101,0.1)', borderWidth: 1,
    borderColor: 'rgba(200,240,101,0.25)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  previewChipText: { fontSize: 10, fontWeight: '600', color: ACCENT },
  createBtn: {
    backgroundColor: ACCENT, borderRadius: 13, height: 50,
    alignItems: 'center', justifyContent: 'center',
  },
  createBtnDisabled: { opacity: 0.4 },
  createBtnText: { fontSize: 15, fontWeight: '700', color: '#000' },
})
