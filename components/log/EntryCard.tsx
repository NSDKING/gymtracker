import React from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ACCENT, CARD, BORDER, MUTED, DIM } from '../../constants/theme'

export type DraftSet = { sets: string; reps: string; weight: string }
export type DraftEntry = { exercise: { id: string; name: string; muscle: string }; sets: DraftSet[] }

type Props = {
  entry: DraftEntry
  index: number
  onAddSet: (i: number) => void
  onRemoveSet: (ei: number, si: number) => void
  onUpdateSet: (ei: number, si: number, field: 'sets' | 'reps' | 'weight', val: string) => void
  onRemoveEntry: (i: number) => void
}

function SetRow({
  set, setIndex, entryIndex, onUpdate, onRemove, canRemove
}: {
  set: DraftSet
  setIndex: number
  entryIndex: number
  onUpdate: (ei: number, si: number, field: 'sets' | 'reps' | 'weight', val: string) => void
  onRemove: (ei: number, si: number) => void
  canRemove: boolean
}) {
  const adjust = (field: 'sets' | 'reps' | 'weight', delta: number) => {
    const current = field === 'weight'
      ? parseFloat(set.weight) || 0
      : parseInt(field === 'sets' ? set.sets : set.reps) || 0
    const step = field === 'weight' ? 2.5 : 1
    const min = field === 'sets' ? 1 : 0
    const next = Math.max(min, current + delta * step)
    onUpdate(entryIndex, setIndex, field, next.toString())
  }

  return (
    <View style={styles.setRow}>
      <View style={styles.setNum}>
        <Text style={styles.setNumText}>{setIndex + 1}</Text>
      </View>

      {/* Sets */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>SETS</Text>
        <View style={styles.stepper}>
          <TouchableOpacity onPress={() => adjust('sets', -1)} style={styles.stepBtn} activeOpacity={0.7}>
            <Text style={styles.stepBtnText}>−</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.stepInput}
            value={set.sets}
            onChangeText={(v) => onUpdate(entryIndex, setIndex, 'sets', v)}
            keyboardType="numeric"
            placeholder="1"
            placeholderTextColor={DIM}
            maxLength={2}
          />
          <TouchableOpacity onPress={() => adjust('sets', 1)} style={styles.stepBtn} activeOpacity={0.7}>
            <Text style={styles.stepBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Reps */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>REPS</Text>
        <View style={styles.stepper}>
          <TouchableOpacity onPress={() => adjust('reps', -1)} style={styles.stepBtn} activeOpacity={0.7}>
            <Text style={styles.stepBtnText}>−</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.stepInput}
            value={set.reps}
            onChangeText={(v) => onUpdate(entryIndex, setIndex, 'reps', v)}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={DIM}
            maxLength={3}
          />
          <TouchableOpacity onPress={() => adjust('reps', 1)} style={styles.stepBtn} activeOpacity={0.7}>
            <Text style={styles.stepBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Weight */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>KG</Text>
        <View style={styles.stepper}>
          <TouchableOpacity onPress={() => adjust('weight', -1)} style={styles.stepBtn} activeOpacity={0.7}>
            <Text style={styles.stepBtnText}>−</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.stepInput}
            value={set.weight}
            onChangeText={(v) => onUpdate(entryIndex, setIndex, 'weight', v)}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={DIM}
            maxLength={6}
          />
          <TouchableOpacity onPress={() => adjust('weight', 1)} style={styles.stepBtn} activeOpacity={0.7}>
            <Text style={styles.stepBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {canRemove && (
        <TouchableOpacity
          onPress={() => onRemove(entryIndex, setIndex)}
          activeOpacity={0.7}
          style={styles.removeSetBtn}
        >
          <Ionicons name="close" size={12} color="#ff453a" />
        </TouchableOpacity>
      )}
    </View>
  )
}

export default function EntryCard({
  entry, index, onAddSet, onRemoveSet, onUpdateSet, onRemoveEntry
}: Props) {
  return (
    <View style={styles.wrap}>
      {/* Exercise header */}
      <View style={styles.exHeader}>
        <View>
          <Text style={styles.exName}>{entry.exercise.name}</Text>
          <Text style={styles.exMuscle}>{entry.exercise.muscle}</Text>
        </View>
        <View style={styles.exHeaderRight}>
          <View style={styles.prBadge}>
            <Text style={styles.prBadgeText}>PR track</Text>
          </View>
          <TouchableOpacity
            onPress={() => onRemoveEntry(index)}
            style={styles.removeEntryBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={14} color="#ff453a" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sets card */}
      <View style={styles.card}>
        <View style={styles.colHeaders}>
          <View style={{ width: 28 }} />
          <Text style={[styles.colHeader, { flex: 1 }]}>SETS</Text>
          <Text style={[styles.colHeader, { flex: 1 }]}>REPS</Text>
          <Text style={[styles.colHeader, { flex: 1 }]}>KG</Text>
          <View style={{ width: 20 }} />
        </View>

        {entry.sets.map((set, si) => (
          <SetRow
            key={si}
            set={set}
            setIndex={si}
            entryIndex={index}
            onUpdate={onUpdateSet}
            onRemove={onRemoveSet}
            canRemove={entry.sets.length > 1}
          />
        ))}

        <TouchableOpacity
          onPress={() => onAddSet(index)}
          style={styles.addSetBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={14} color={ACCENT} />
          <Text style={styles.addSetBtnText}>Add different weight</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 20 },

  exHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 10, paddingHorizontal: 2,
  },
  exName: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  exMuscle: { fontSize: 12, color: MUTED, marginTop: 2 },
  exHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  prBadge: {
    backgroundColor: 'rgba(200,240,101,0.1)',
    borderWidth: 1, borderColor: 'rgba(200,240,101,0.3)',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  prBadgeText: { fontSize: 11, fontWeight: '600', color: ACCENT },
  removeEntryBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,69,58,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,69,58,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },

  card: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 13, overflow: 'hidden',
  },
  colHeaders: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 13, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  colHeader: {
    fontSize: 9, fontWeight: '700', color: DIM,
    textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center',
  },

  setRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, paddingHorizontal: 13, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  setNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#2a2a2a',
    alignItems: 'center', justifyContent: 'center',
  },
  setNumText: { fontSize: 10, fontWeight: '600', color: MUTED },

  inputGroup: { flex: 1, alignItems: 'center', gap: 3 },
  inputLabel: {
    fontSize: 8, fontWeight: '600', color: DIM,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  stepper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111', borderWidth: 1, borderColor: BORDER,
    borderRadius: 8, overflow: 'hidden', height: 34, width: '100%',
  },
  stepBtn: {
    width: 24, height: '100%', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1a1a1a',
  },
  stepBtnText: { fontSize: 14, color: MUTED, lineHeight: 18 },
  stepInput: {
    flex: 1, height: '100%', textAlign: 'center',
    fontSize: 13, fontWeight: '700', color: '#fff',
  },

  removeSetBtn: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(255,69,58,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },

  addSetBtn: {
    padding: 13, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: 4,
  },
  addSetBtnText: { fontSize: 13, color: ACCENT, fontWeight: '600' },
})