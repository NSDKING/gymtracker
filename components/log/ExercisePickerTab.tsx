import React, { useState, useMemo, useCallback, memo } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, ScrollView, StyleSheet, Alert, Modal,
  type ListRenderItemInfo,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { Exercise } from '../../store/index'
import { useStore } from '../../store/index'
import { ACCENT, CARD, BORDER, MUTED, DIM } from '../../constants/theme'

const MUSCLES = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Other']

type ListItem =
  | { kind: 'header'; id: string; title: string }
  | { kind: 'row'; id: string; exercise: Exercise; isFirst: boolean; isLast: boolean; accent: boolean }

type Props = { exercises: Exercise[]; onPick: (ex: Exercise) => void }

const ExRow = memo(function ExRow({
  exercise, onPick, onLongPress, isFirst, isLast, accent,
}: {
  exercise: Exercise
  onPick: (ex: Exercise) => void
  onLongPress: (ex: Exercise) => void
  isFirst: boolean
  isLast: boolean
  accent: boolean
}) {
  return (
    <TouchableOpacity
      style={[
        styles.row,
        isFirst && styles.rowFirst,
        isLast && styles.rowLast,
        !isLast && styles.rowBorder,
      ]}
      onPress={() => onPick(exercise)}
      onLongPress={() => onLongPress(exercise)}
      delayLongPress={400}
      activeOpacity={0.7}
    >
      <View style={accent ? styles.dotActive : styles.dot} />
      <View style={{ flex: 1 }}>
        <Text style={styles.exName}>{exercise.name}</Text>
        <Text style={styles.exMuscle}>{exercise.muscle}</Text>
      </View>
      <Ionicons name="add" size={16} color={accent ? ACCENT : MUTED} />
    </TouchableOpacity>
  )
})

export default function ExercisePickerTab({ exercises, onPick }: Props) {
  const { sessions, editExercise, removeExercise } = useStore()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [editingEx, setEditingEx] = useState<Exercise | null>(null)
  const [editName, setEditName] = useState('')
  const [editMuscle, setEditMuscle] = useState('')

  const handleLongPress = useCallback((ex: Exercise) => {
    Alert.alert(ex.name, undefined, [
      {
        text: 'Edit',
        onPress: () => { setEditName(ex.name); setEditMuscle(ex.muscle); setEditingEx(ex) },
      },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => Alert.alert(
          'Delete Exercise',
          `Delete "${ex.name}"? This won't remove it from past sessions.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => removeExercise(ex.id) },
          ]
        ),
      },
      { text: 'Cancel', style: 'cancel' },
    ])
  }, [removeExercise])

  const saveEdit = useCallback(() => {
    if (!editingEx || !editName.trim()) return
    editExercise(editingEx.id, editName.trim(), editMuscle)
    setEditingEx(null)
  }, [editingEx, editName, editMuscle, editExercise])

  const muscles = useMemo(
    () => ['All', ...Array.from(new Set(exercises.map((e) => e.muscle)))],
    [exercises]
  )

  const recentIds = useMemo(
    () => Array.from(new Set(
      sessions.slice(-5).flatMap((s) => s.entries.map((e) => e.exercise.id))
    )),
    [sessions]
  )

  const listData = useMemo((): ListItem[] => {
    const items: ListItem[] = []
    const searchLower = search.toLowerCase()
    const showRecent = search === '' && filter === 'All'

    if (showRecent) {
      const recentExs = recentIds
        .map((id) => exercises.find((e) => e.id === id))
        .filter(Boolean) as Exercise[]
      if (recentExs.length > 0) {
        items.push({ kind: 'header', id: '__hdr_recent', title: 'Recent' })
        recentExs.forEach((ex, i) => items.push({
          kind: 'row', id: `recent_${ex.id}`, exercise: ex,
          isFirst: i === 0, isLast: i === recentExs.length - 1, accent: true,
        }))
      }
    }

    const grouped: Record<string, Exercise[]> = {}
    exercises.forEach((ex) => {
      if (!ex.name.toLowerCase().includes(searchLower)) return
      if (filter !== 'All' && ex.muscle !== filter) return
      if (!grouped[ex.muscle]) grouped[ex.muscle] = []
      grouped[ex.muscle].push(ex)
    })

    Object.entries(grouped).forEach(([muscle, exs]) => {
      items.push({ kind: 'header', id: `__hdr_${muscle}`, title: muscle })
      exs.forEach((ex, i) => items.push({
        kind: 'row', id: ex.id, exercise: ex,
        isFirst: i === 0, isLast: i === exs.length - 1, accent: false,
      }))
    })

    return items
  }, [exercises, search, filter, recentIds])

  const clearSearch = useCallback(() => setSearch(''), [])

  const renderItem = useCallback(({ item }: ListRenderItemInfo<ListItem>) => {
    if (item.kind === 'header') {
      return <Text style={styles.sectionLabel}>{item.title.toUpperCase()}</Text>
    }
    return (
      <ExRow
        exercise={item.exercise}
        onPick={onPick}
        onLongPress={handleLongPress}
        isFirst={item.isFirst}
        isLast={item.isLast}
        accent={item.accent}
      />
    )
  }, [onPick, handleLongPress])

  const keyExtractor = useCallback((item: ListItem) => item.id, [])

  return (
    <View style={{ flex: 1 }}>
      {/* Edit modal */}
      <Modal visible={!!editingEx} transparent animationType="fade">
        <View style={styles.editOverlay}>
          <View style={styles.editCard}>
            <Text style={styles.editTitle}>Edit Exercise</Text>

            <Text style={styles.editLabel}>Name</Text>
            <TextInput
              style={styles.editInput}
              value={editName}
              onChangeText={setEditName}
              autoCorrect={false}
              autoFocus
            />

            <Text style={[styles.editLabel, { marginTop: 14 }]}>Muscle Group</Text>
            <View style={styles.muscleGrid}>
              {MUSCLES.map(m => (
                <TouchableOpacity
                  key={m}
                  style={[styles.muscleChip, editMuscle === m && styles.muscleChipActive]}
                  onPress={() => setEditMuscle(m)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.muscleChipTxt, editMuscle === m && styles.muscleChipTxtActive]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.editBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingEx(null)} activeOpacity={0.7}>
                <Text style={styles.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, !editName.trim() && { opacity: 0.4 }]}
                onPress={saveEdit}
                disabled={!editName.trim()}
                activeOpacity={0.7}
              >
                <Text style={styles.saveTxt}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color={DIM} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises…"
          placeholderTextColor={DIM}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={clearSearch} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={16} color={DIM} />
          </TouchableOpacity>
        )}
      </View>

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

      <FlatList
        data={listData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No exercises found</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111', borderWidth: 1, borderColor: BORDER,
    borderRadius: 13, marginHorizontal: 14, marginBottom: 10,
    paddingHorizontal: 12, height: 46,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#fff', height: '100%' },

  filterRow: { paddingHorizontal: 14, gap: 6, paddingBottom: 12 },
  filterChip: {
    paddingVertical: 7, paddingHorizontal: 14,
    borderRadius: 999, borderWidth: 1, borderColor: BORDER, backgroundColor: CARD,
  },
  filterChipActive: {
    backgroundColor: 'rgba(200,240,101,0.1)',
    borderColor: 'rgba(200,240,101,0.3)',
  },
  filterChipText: { fontSize: 13, fontWeight: '500', color: MUTED },
  filterChipTextActive: { color: ACCENT },

  listContent: { paddingHorizontal: 14, paddingBottom: 40 },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: DIM,
    letterSpacing: 1.2, paddingBottom: 6, paddingTop: 10,
  },

  row: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 12,
    backgroundColor: CARD,
    borderLeftWidth: 1, borderRightWidth: 1, borderColor: BORDER,
  },
  rowFirst: { borderTopWidth: 1, borderTopLeftRadius: 13, borderTopRightRadius: 13 },
  rowLast: { borderBottomWidth: 1, borderBottomLeftRadius: 13, borderBottomRightRadius: 13 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: BORDER },

  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#333' },
  dotActive: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: ACCENT },
  exName: { fontSize: 15, fontWeight: '600', color: '#fff' },
  exMuscle: { fontSize: 11, color: MUTED, marginTop: 2 },

  empty: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 13, color: DIM },

  editOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center', alignItems: 'center',
  },
  editCard: {
    backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: BORDER,
    borderRadius: 16, padding: 20, width: '88%',
  },
  editTitle: { fontSize: 17, fontWeight: '700', color: '#fff', marginBottom: 16 },
  editLabel: { fontSize: 11, fontWeight: '600', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 7 },
  editInput: {
    backgroundColor: '#111', borderWidth: 1, borderColor: BORDER,
    borderRadius: 10, height: 44, paddingHorizontal: 12,
    fontSize: 15, color: '#fff',
  },
  muscleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 20 },
  muscleChip: {
    paddingVertical: 7, paddingHorizontal: 13,
    borderRadius: 999, borderWidth: 1, borderColor: BORDER, backgroundColor: CARD,
  },
  muscleChipActive: { backgroundColor: 'rgba(200,240,101,0.1)', borderColor: 'rgba(200,240,101,0.3)' },
  muscleChipTxt: { fontSize: 12, fontWeight: '500', color: MUTED },
  muscleChipTxtActive: { color: ACCENT },
  editBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, height: 44, borderRadius: 10,
    borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelTxt: { fontSize: 14, color: MUTED },
  saveBtn: {
    flex: 1, height: 44, borderRadius: 10,
    backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center',
  },
  saveTxt: { fontSize: 14, fontWeight: '700', color: '#000' },
})
