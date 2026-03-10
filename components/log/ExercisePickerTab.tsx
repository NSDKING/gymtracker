import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { Exercise } from '../../store/index'
import { useStore } from '../../store/index'
import { ACCENT, CARD, BORDER, MUTED, DIM } from '../../constants/theme'

type Props = {
  exercises: Exercise[]
  onPick: (ex: Exercise) => void
}

export default function ExercisePickerTab({ exercises, onPick }: Props) {
  const { sessions } = useStore()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')

  const muscles = ['All', ...Array.from(new Set(exercises.map((e) => e.muscle)))]

  // Recent = exercises used in last 5 sessions
  const recentIds = Array.from(new Set(
    sessions
      .slice(-5)
      .flatMap((s) => s.entries.map((e) => e.exerciseId))
  ))
  const recentExercises = recentIds
    .map((id) => exercises.find((e) => e.id === id))
    .filter(Boolean) as Exercise[]

  const filtered = exercises.filter((ex) => {
    const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase())
    const matchMuscle = filter === 'All' || ex.muscle === filter
    return matchSearch && matchMuscle
  })

  // Group filtered by muscle
  const grouped: Record<string, Exercise[]> = {}
  filtered.forEach((ex) => {
    if (!grouped[ex.muscle]) grouped[ex.muscle] = []
    grouped[ex.muscle].push(ex)
  })

  const showRecent = search === '' && filter === 'All' && recentExercises.length > 0

  return (
    <View style={{ flex: 1 }}>
      {/* Search */}
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
          <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={16} color={DIM} />
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

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Recent section */}
        {showRecent && (
          <View>
            <Text style={styles.sectionLabel}>RECENT</Text>
            <View style={styles.groupCard}>
              {recentExercises.map((ex, i) => (
                <TouchableOpacity
                  key={ex.id}
                  style={[styles.row, i < recentExercises.length - 1 && styles.rowBorder]}
                  onPress={() => onPick(ex)}
                  activeOpacity={0.7}
                >
                  <View style={styles.dotActive} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exName}>{ex.name}</Text>
                    <Text style={styles.exMuscle}>{ex.muscle}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => onPick(ex)}
                    style={styles.addBtnActive}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={18} color="#000" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Grouped sections */}
        {Object.entries(grouped).map(([muscle, exs]) => (
          <View key={muscle}>
            <Text style={styles.sectionLabel}>{muscle.toUpperCase()}</Text>
            <View style={styles.groupCard}>
              {exs.map((ex, i) => {
                const isRecent = recentIds.includes(ex.id)
                return (
                  <TouchableOpacity
                    key={ex.id}
                    style={[styles.row, i < exs.length - 1 && styles.rowBorder]}
                    onPress={() => onPick(ex)}
                    activeOpacity={0.7}
                  >
                    <View style={isRecent ? styles.dotActive : styles.dot} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.exName}>{ex.name}</Text>
                      <Text style={styles.exMuscle}>{ex.muscle}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => onPick(ex)}
                      style={styles.addBtn}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="add" size={16} color={MUTED} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        ))}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No exercises found</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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

  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: DIM,
    textTransform: 'uppercase', letterSpacing: 1.2,
    paddingHorizontal: 14, paddingBottom: 6, paddingTop: 4,
  },
  groupCard: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 13, marginHorizontal: 14, marginBottom: 10, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 12,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: BORDER },
  dot: {
    width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#333',
  },
  dotActive: {
    width: 7, height: 7, borderRadius: 3.5, backgroundColor: ACCENT,
  },
  exName: { fontSize: 15, fontWeight: '600', color: '#fff' },
  exMuscle: { fontSize: 11, color: MUTED, marginTop: 2 },

  addBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#222', borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnActive: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: ACCENT,
    alignItems: 'center', justifyContent: 'center',
  },

  empty: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 13, color: DIM },
})