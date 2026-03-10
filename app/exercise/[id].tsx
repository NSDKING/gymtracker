import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions, Alert, Modal, TextInput
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useStore, getPRs } from '../../store/index'
import { ACCENT, BORDER, CARD, DIM, MUTED } from '../../constants/theme'

const { width } = Dimensions.get('window')
const RANGES = ['1M', '3M', 'All'] as const
type Range = typeof RANGES[number]
const MUSCLES = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Other']

type EditableSet = { reps: string; weight: string }

function filterByRange(data: { date: string; weight: number }[], range: Range) {
  if (range === 'All') return data
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - (range === '1M' ? 1 : 3))
  return data.filter((d) => new Date(d.date) >= cutoff)
}

function ProgressChart({ points, height = 88 }: { points: { date: string; weight: number }[]; height?: number }) {
  if (points.length < 2) {
    return (
      <View style={[styles.emptyChart, { height }]}>
        <Text style={styles.emptyChartText}>Log this exercise at least twice to see progress</Text>
      </View>
    )
  }
  const weights = points.map((p) => p.weight)
  const min = Math.min(...weights)
  const max = Math.max(...weights)
  const range = max - min || 1
  const H = height
  const PAD = 8
  return (
    <View style={{ height }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{
          position: 'absolute', left: 0, right: 0,
          top: (i / 2) * (H - PAD) + PAD / 2,
          height: 1, backgroundColor: BORDER, opacity: 0.5,
        }} />
      ))}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: 2, paddingBottom: 2 }}>
        {points.map((p, i) => {
          const barH = Math.max(4, ((p.weight - min) / range) * (H - PAD * 2) + PAD)
          const isPR = p.weight === max
          const isLast = i === points.length - 1
          return (
            <View key={i} style={{
              flex: 1, height: barH, borderRadius: 3,
              backgroundColor: isPR ? ACCENT : isLast ? `${ACCENT}80` : `${ACCENT}30`,
            }} />
          )
        })}
      </View>
      <View style={{ position: 'absolute', bottom: -18, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 9, color: DIM }}>
          {new Date(points[0].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </Text>
        <Text style={{ fontSize: 9, color: ACCENT, fontWeight: '600' }}>
          {points[points.length - 1].weight} kg →
        </Text>
      </View>
    </View>
  )
}

// ─── EDIT EXERCISE MODAL ──────────────────────────────────────────────────────

function EditExerciseModal({ visible, name, muscle, onSave, onClose }: {
  visible: boolean; name: string; muscle: string
  onSave: (name: string, muscle: string) => void; onClose: () => void
}) {
  const [editName, setEditName] = useState(name)
  const [editMuscle, setEditMuscle] = useState(muscle)
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Edit Exercise</Text>
          <Text style={styles.modalLabel}>Name</Text>
          <TextInput
            style={styles.modalInput} value={editName}
            onChangeText={setEditName} placeholderTextColor={DIM} autoCorrect={false}
          />
          <Text style={[styles.modalLabel, { marginTop: 14 }]}>Muscle Group</Text>
          <View style={styles.muscleGrid}>
            {MUSCLES.map((m) => (
              <TouchableOpacity key={m} onPress={() => setEditMuscle(m)} activeOpacity={0.7}
                style={[styles.muscleChip, editMuscle === m && styles.muscleChipActive]}>
                <Text style={[styles.muscleChipText, editMuscle === m && styles.muscleChipTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.modalBtns}>
            <TouchableOpacity onPress={onClose} style={styles.modalBtnCancel} activeOpacity={0.7}>
              <Text style={styles.modalBtnCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onSave(editName.trim(), editMuscle)}
              style={styles.modalBtnSave} activeOpacity={0.7}>
              <Text style={styles.modalBtnSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

// ─── EDIT SESSION MODAL ───────────────────────────────────────────────────────

function EditSessionModal({ visible, sessionId, exerciseId, initialSets, onSave, onClose }: {
  visible: boolean
  sessionId: string
  exerciseId: string
  initialSets: { reps: number; weight: number }[]
  onSave: (sessionId: string, exerciseId: string, sets: { reps: number; weight: number }[]) => void
  onClose: () => void
}) {
  const [sets, setSets] = useState<EditableSet[]>(
    initialSets.map((s) => ({ reps: s.reps.toString(), weight: s.weight.toString() }))
  )

  const updateSet = (i: number, field: 'reps' | 'weight', val: string) =>
    setSets((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s))

  const addSet = () => setSets((prev) => [...prev, { reps: '', weight: '' }])

  const removeSet = (i: number) =>
    setSets((prev) => prev.filter((_, idx) => idx !== i))

  const handleSave = () => {
    const parsed = sets
      .filter((s) => s.reps !== '' && s.weight !== '')
      .map((s) => ({ reps: Number(s.reps) || 0, weight: Number(s.weight) || 0 }))
    if (parsed.length === 0) { Alert.alert('Add at least one set'); return }
    onSave(sessionId, exerciseId, parsed)
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.sessionModalOverlay}>
        <View style={styles.sessionModalCard}>
          <View style={styles.sessionModalHeader}>
            <Text style={styles.modalTitle}>Edit Session Sets</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={MUTED} />
            </TouchableOpacity>
          </View>

          {/* Column headers */}
          <View style={styles.editSetHeader}>
            <View style={{ width: 28 }} />
            <Text style={[styles.editSetHeaderText, { flex: 1 }]}>REPS</Text>
            <Text style={[styles.editSetHeaderText, { flex: 1 }]}>KG</Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
            {sets.map((s, i) => (
              <View key={i} style={styles.editSetRow}>
                <View style={styles.editSetNum}>
                  <Text style={styles.editSetNumText}>{i + 1}</Text>
                </View>
                <TextInput
                  style={[styles.editSetInput, { flex: 1 }]}
                  value={s.reps}
                  onChangeText={(v) => updateSet(i, 'reps', v)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={DIM}
                  maxLength={3}
                />
                <TextInput
                  style={[styles.editSetInput, { flex: 1 }]}
                  value={s.weight}
                  onChangeText={(v) => updateSet(i, 'weight', v)}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={DIM}
                  maxLength={6}
                />
                <TouchableOpacity
                  onPress={() => removeSet(i)}
                  activeOpacity={0.7}
                  style={styles.editSetRemove}
                  disabled={sets.length === 1}
                >
                  <Ionicons name="close" size={12} color={sets.length === 1 ? DIM : '#ff453a'} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity onPress={addSet} style={styles.addSetRow} activeOpacity={0.7}>
            <Ionicons name="add" size={14} color={ACCENT} />
            <Text style={styles.addSetRowText}>Add Set</Text>
          </TouchableOpacity>

          <View style={[styles.modalBtns, { marginTop: 16 }]}>
            <TouchableOpacity onPress={onClose} style={styles.modalBtnCancel} activeOpacity={0.7}>
              <Text style={styles.modalBtnCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={styles.modalBtnSave} activeOpacity={0.7}>
              <Text style={styles.modalBtnSaveText}>Save Sets</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function ExerciseDetailScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { exercises, sessions } = useStore()
  const [range, setRange] = useState<Range>('All')
  const [showMenu, setShowMenu] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editingSession, setEditingSession] = useState<{
    sessionId: string; sets: { reps: number; weight: number }[]
  } | null>(null)

  const exercise = exercises.find((e) => e.id === id)

  if (!exercise) {
    return (
      <View style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: MUTED }}>Exercise not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: ACCENT }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const exerciseSessions = sessions
    .filter((s) => s.entries.some((e) => e.exerciseId === id))
    .sort((a, b) => a.date.localeCompare(b.date))

  const allProgress = exerciseSessions.map((s) => {
    const entry = s.entries.find((e) => e.exerciseId === id)!
    return { date: s.date, weight: Math.max(...entry.sets.map((set) => set.weight)) }
  })

  const filteredProgress = filterByRange(allProgress, range)
  const prs = getPRs(sessions, exercises)
  const pr = prs[id]

  const lastSession = exerciseSessions[exerciseSessions.length - 1]
  const lastEntry = lastSession?.entries.find((e) => e.exerciseId === id)
  const prevSession = exerciseSessions[exerciseSessions.length - 2]
  const prevEntry = prevSession?.entries.find((e) => e.exerciseId === id)
  const prevMax = prevEntry ? Math.max(...prevEntry.sets.map((s) => s.weight)) : null
  const currentMax = lastEntry ? Math.max(...lastEntry.sets.map((s) => s.weight)) : null
  const delta = currentMax !== null && prevMax !== null ? currentMax - prevMax : null

  const totalSets = exerciseSessions.reduce((t, s) => {
    const entry = s.entries.find((e) => e.exerciseId === id)
    return t + (entry?.sets.length ?? 0)
  }, 0)
  const avgSetsPerSession = exerciseSessions.length
    ? (totalSets / exerciseSessions.length).toFixed(1) : '0'
  const bestVolSession = exerciseSessions.reduce((best, s) => {
    const entry = s.entries.find((e) => e.exerciseId === id)
    const vol = entry?.sets.reduce((t, set) => t + set.reps * set.weight, 0) ?? 0
    return vol > best ? vol : best
  }, 0)

  const handleDelete = () => {
    Alert.alert(
      'Delete Exercise',
      `Delete "${exercise.name}"? This won't remove it from past sessions.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => {
            useStore.setState((s) => ({ exercises: s.exercises.filter((e) => e.id !== id) }))
            router.back()
          },
        },
      ]
    )
  }

  const handleSaveExercise = (newName: string, newMuscle: string) => {
    if (!newName) { Alert.alert('Name required'); return }
    useStore.setState((s) => ({
      exercises: s.exercises.map((e) => e.id === id ? { ...e, name: newName, muscle: newMuscle } : e)
    }))
    setShowEdit(false)
  }

  const handleSaveSets = (
    sessionId: string,
    exerciseId: string,
    newSets: { reps: number; weight: number }[]
  ) => {
    useStore.setState((st) => ({
      sessions: st.sessions.map((sess) =>
        sess.id === sessionId
          ? {
              ...sess,
              entries: sess.entries.map((e) =>
                e.exerciseId === exerciseId ? { ...e, sets: newSets } : e
              ),
            }
          : sess
      ),
    }))
    setEditingSession(null)
  }

  const openSessionMenu = (s: typeof exerciseSessions[0]) => {
    const entry = s.entries.find((e) => e.exerciseId === id)!
    Alert.alert(
      new Date(s.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
      'What would you like to do?',
      [
        {
          text: 'Edit Sets',
          onPress: () => setEditingSession({ sessionId: s.id, sets: entry.sets }),
        },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => {
            useStore.setState((st) => ({
              sessions: st.sessions.map((sess) =>
                sess.id === s.id
                  ? { ...sess, entries: sess.entries.filter((e) => e.exerciseId !== id) }
                  : sess
              ).filter((sess) => sess.entries.length > 0)
            }))
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    )
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{exercise.name}</Text>
          <View style={styles.headerBadges}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{exercise.muscle}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={() => setShowMenu(true)} activeOpacity={0.7} style={styles.menuBtn}>
          <Ionicons name="ellipsis-horizontal" size={18} color={MUTED} />
        </TouchableOpacity>
      </View>

      {/* ⋯ Menu */}
      <Modal visible={showMenu} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowMenu(false)}>
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}
              onPress={() => { setShowMenu(false); setShowEdit(true) }}>
              <Ionicons name="pencil-outline" size={16} color="#fff" />
              <Text style={styles.menuItemText}>Edit Exercise</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}
              onPress={() => { setShowMenu(false); handleDelete() }}>
              <Ionicons name="trash-outline" size={16} color="#ff453a" />
              <Text style={[styles.menuItemText, { color: '#ff453a' }]}>Delete Exercise</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit exercise modal */}
      <EditExerciseModal
        visible={showEdit}
        name={exercise.name}
        muscle={exercise.muscle}
        onSave={handleSaveExercise}
        onClose={() => setShowEdit(false)}
      />

      {/* Edit session sets modal */}
      {editingSession && (
        <EditSessionModal
          visible={true}
          sessionId={editingSession.sessionId}
          exerciseId={id}
          initialSets={editingSession.sets}
          onSave={handleSaveSets}
          onClose={() => setEditingSession(null)}
        />
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* PR Hero */}
        {pr ? (
          <View style={styles.prHero}>
            <View>
              <Text style={styles.prLabel}>⚡ Personal Record</Text>
              <Text style={styles.prValue}>{pr.weight}<Text style={styles.prUnit}> kg</Text></Text>
              <Text style={styles.prDate}>
                {new Date(pr.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </View>
            {delta !== null && (
              <View style={styles.deltaWrap}>
                <Text style={styles.deltaSub}>vs last session</Text>
                <Text style={[styles.deltaValue, { color: delta >= 0 ? ACCENT : '#ff453a' }]}>
                  {delta >= 0 ? '+' : ''}{delta} kg {delta >= 0 ? '↑' : '↓'}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noPrCard}>
            <Text style={styles.noPrText}>Log this exercise to start tracking your PR</Text>
          </View>
        )}

        {/* Progress Chart */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Max Weight Progress</Text>
          <View style={styles.rangeTabs}>
            {RANGES.map((r) => (
              <TouchableOpacity key={r} onPress={() => setRange(r)} activeOpacity={0.7}
                style={[styles.rangeTab, range === r && styles.rangeTabActive]}>
                <Text style={[styles.rangeTabText, range === r && styles.rangeTabTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={[styles.card, { paddingBottom: 28 }]}>
          <ProgressChart points={filteredProgress} />
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Sessions', value: `${exerciseSessions.length}` },
            { label: 'Avg Sets', value: avgSetsPerSession },
            { label: 'Best Vol', value: bestVolSession > 999 ? `${(bestVolSession / 1000).toFixed(1)}k` : `${bestVolSession}` },
          ].map((s, i) => (
            <View key={s.label} style={[styles.statCard, i < 2 && { marginRight: 7 }]}>
              <Text style={styles.statCardLabel}>{s.label}</Text>
              <Text style={styles.statCardValue}>{s.value}</Text>
            </View>
          ))}
        </View>

        {/* Last Session */}
        {lastEntry && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Last Session</Text>
              <Text style={styles.sectionSub}>
                {new Date(lastSession.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </Text>
            </View>
            <View style={[styles.card, { padding: 0 }]}>
              <View style={styles.setHeaderRow}>
                <Text style={[styles.setHeaderText, { width: 30 }]}>SET</Text>
                <Text style={[styles.setHeaderText, { flex: 1, textAlign: 'center' }]}>REPS</Text>
                <Text style={[styles.setHeaderText, { flex: 1, textAlign: 'center' }]}>KG</Text>
                <Text style={[styles.setHeaderText, { flex: 1, textAlign: 'center' }]}>VOL</Text>
              </View>
              {lastEntry.sets.map((s, i) => {
                const isPR = s.weight === pr?.weight
                return (
                  <View key={i} style={[styles.setRow, i < lastEntry.sets.length - 1 && styles.setRowBorder]}>
                    <View style={[styles.setNum, isPR && styles.setNumPR]}>
                      <Text style={[styles.setNumText, isPR && { color: '#000' }]}>{i + 1}</Text>
                    </View>
                    <Text style={[styles.setCell, { flex: 1 }]}>{s.reps}</Text>
                    <View style={[styles.setWeightWrap, { flex: 1 }]}>
                      <Text style={styles.setCell}>{s.weight}</Text>
                      {isPR && <Text style={styles.prDot}>⚡</Text>}
                    </View>
                    <Text style={[styles.setCell, styles.setCellMuted, { flex: 1 }]}>{s.reps * s.weight}</Text>
                  </View>
                )
              })}
            </View>
          </>
        )}

        {/* All Sessions */}
        {exerciseSessions.length > 1 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>All Sessions</Text>
              <Text style={styles.sectionSub}>{exerciseSessions.length} total</Text>
            </View>
            <View style={[styles.card, { padding: 0 }]}>
              {[...exerciseSessions].reverse().map((s, i) => {
                const entry = s.entries.find((e) => e.exerciseId === id)!
                const maxW = Math.max(...entry.sets.map((set) => set.weight))
                const vol = entry.sets.reduce((t, set) => t + set.reps * set.weight, 0)
                const isFirst = i === 0
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.historyRow, i < exerciseSessions.length - 1 && styles.historyRowBorder]}
                    activeOpacity={0.7}
                    onLongPress={() => openSessionMenu(s)}
                  >
                    <View>
                      <Text style={styles.historyDate}>
                        {new Date(s.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </Text>
                      <Text style={styles.historyMeta}>{entry.sets.length} sets · {vol} kg vol</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', flexDirection: 'row', gap: 10 }}>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.historyMax, isFirst && { color: ACCENT }]}>{maxW} kg</Text>
                        {isFirst && <Text style={styles.historyLatest}>latest</Text>}
                      </View>
                      <Ionicons name="ellipsis-horizontal" size={14} color={DIM} />
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>
            <Text style={styles.longPressHint}>Long press a session to edit or delete</Text>
          </>
        )}

        {exerciseSessions.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏋️</Text>
            <Text style={styles.emptyTitle}>No data yet</Text>
            <Text style={styles.emptyText}>Log a session with {exercise.name} to start tracking progress</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  menuBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  headerBadges: { flexDirection: 'row', gap: 6, marginTop: 4 },
  badge: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3,
  },
  badgeText: { fontSize: 11, color: MUTED },

  menuCard: {
    position: 'absolute', top: 80, right: 16,
    backgroundColor: '#1e1e1e', borderWidth: 1, borderColor: BORDER,
    borderRadius: 13, overflow: 'hidden', minWidth: 180,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  menuItemText: { fontSize: 14, fontWeight: '500', color: '#fff' },
  menuDivider: { height: 1, backgroundColor: BORDER },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: BORDER,
    borderRadius: 16, padding: 20, width: width - 48,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 16 },
  modalLabel: { fontSize: 11, color: MUTED, marginBottom: 7, fontWeight: '500' },
  modalInput: {
    backgroundColor: '#111', borderWidth: 1, borderColor: BORDER,
    borderRadius: 11, height: 46, paddingHorizontal: 13,
    fontSize: 15, color: '#fff', marginBottom: 4,
  },
  muscleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 20 },
  muscleChip: {
    paddingVertical: 7, paddingHorizontal: 13,
    borderRadius: 999, borderWidth: 1, borderColor: BORDER, backgroundColor: CARD,
  },
  muscleChipActive: { backgroundColor: 'rgba(200,240,101,0.1)', borderColor: 'rgba(200,240,101,0.3)' },
  muscleChipText: { fontSize: 12, fontWeight: '500', color: MUTED },
  muscleChipTextActive: { color: ACCENT },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalBtnCancel: {
    flex: 1, height: 46, borderRadius: 11,
    borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  modalBtnCancelText: { fontSize: 14, color: MUTED },
  modalBtnSave: {
    flex: 1, height: 46, borderRadius: 11,
    backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center',
  },
  modalBtnSaveText: { fontSize: 14, fontWeight: '700', color: '#000' },

  // Session edit modal
  sessionModalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  sessionModalCard: {
    backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: BORDER,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 40,
  },
  sessionModalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  editSetHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: BORDER,
    marginBottom: 4,
  },
  editSetHeaderText: {
    fontSize: 9, fontWeight: '700', color: DIM,
    textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center',
  },
  editSetRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 6,
  },
  editSetNum: {
    width: 24, height: 24, borderRadius: 6, backgroundColor: '#2a2a2a',
    alignItems: 'center', justifyContent: 'center',
  },
  editSetNumText: { fontSize: 10, fontWeight: '600', color: MUTED },
  editSetInput: {
    backgroundColor: '#111', borderWidth: 1, borderColor: BORDER,
    borderRadius: 9, height: 40, paddingHorizontal: 10,
    fontSize: 15, fontWeight: '600', color: '#fff', textAlign: 'center',
  },
  editSetRemove: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(255,69,58,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  addSetRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: BORDER, marginTop: 4,
  },
  addSetRowText: { fontSize: 13, color: ACCENT, fontWeight: '600' },

  prHero: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 13, margin: 14, padding: 16,
  },
  prLabel: { fontSize: 10, color: MUTED, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  prValue: { fontSize: 52, fontWeight: '800', color: ACCENT, letterSpacing: -2, lineHeight: 56 },
  prUnit: { fontSize: 20, fontWeight: '400', color: MUTED },
  prDate: { fontSize: 12, color: MUTED, marginTop: 4 },
  deltaWrap: { alignItems: 'flex-end' },
  deltaSub: { fontSize: 10, color: DIM, marginBottom: 4 },
  deltaValue: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  noPrCard: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 13, margin: 14, padding: 20, alignItems: 'center',
  },
  noPrText: { fontSize: 13, color: DIM, textAlign: 'center' },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingTop: 8, paddingBottom: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  sectionSub: { fontSize: 12, color: MUTED },

  rangeTabs: { flexDirection: 'row', gap: 3 },
  rangeTab: { paddingVertical: 4, paddingHorizontal: 9, borderRadius: 7 },
  rangeTabActive: { backgroundColor: 'rgba(200,240,101,0.1)' },
  rangeTabText: { fontSize: 11, fontWeight: '600', color: DIM },
  rangeTabTextActive: { color: ACCENT },

  card: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 13, marginHorizontal: 14, marginBottom: 8, padding: 13,
  },

  statsRow: { flexDirection: 'row', paddingHorizontal: 14, marginBottom: 8 },
  statCard: {
    flex: 1, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 13, padding: 13,
  },
  statCardLabel: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, color: MUTED, marginBottom: 6 },
  statCardValue: { fontSize: 22, fontWeight: '700', color: '#fff', letterSpacing: -0.5 },

  setHeaderRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 13, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  setHeaderText: { fontSize: 8, fontWeight: '600', color: DIM, textTransform: 'uppercase', letterSpacing: 0.8 },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, paddingVertical: 11 },
  setRowBorder: { borderBottomWidth: 1, borderBottomColor: BORDER },
  setNum: {
    width: 24, height: 24, borderRadius: 6, backgroundColor: '#2a2a2a',
    alignItems: 'center', justifyContent: 'center', marginRight: 6,
  },
  setNumPR: { backgroundColor: ACCENT },
  setNumText: { fontSize: 10, fontWeight: '600', color: MUTED },
  setCell: { fontSize: 13, fontWeight: '600', color: '#fff', textAlign: 'center' },
  setCellMuted: { color: MUTED },
  setWeightWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 },
  prDot: { fontSize: 10 },

  historyRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 13,
  },
  historyRowBorder: { borderBottomWidth: 1, borderBottomColor: BORDER },
  historyDate: { fontSize: 13, fontWeight: '500', color: '#fff', marginBottom: 3 },
  historyMeta: { fontSize: 11, color: MUTED },
  historyMax: { fontSize: 15, fontWeight: '700', color: '#fff' },
  historyLatest: { fontSize: 9, color: DIM, marginTop: 2 },
  longPressHint: { fontSize: 10, color: DIM, textAlign: 'center', paddingBottom: 8 },

  emptyChart: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#111', borderRadius: 8 },
  emptyChartText: { fontSize: 12, color: DIM, textAlign: 'center', paddingHorizontal: 16 },
  empty: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#fff', marginBottom: 6 },
  emptyText: { fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 18 },
})