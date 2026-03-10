import React from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import IconBtn from './IconBtn'
import { ACCENT, CARD, BORDER, MUTED, DIM } from '../../constants/theme'

type DraftSet = { reps: string; weight: string }
type DraftEntry = { exercise: { id: string; name: string; muscle: string }; sets: DraftSet[] }

type Props = {
  entry: DraftEntry
  index: number
  onAddSet: (i: number) => void
  onRemoveSet: (ei: number, si: number) => void
  onUpdateSet: (ei: number, si: number, field: 'reps' | 'weight', val: string) => void
  onRemoveEntry: (i: number) => void
}

export default function EntryCard({
  entry, index, onAddSet, onRemoveSet, onUpdateSet, onRemoveEntry
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.name}>{entry.exercise.name}</Text>
          <Text style={styles.muscle}>{entry.exercise.muscle}</Text>
        </View>
        <IconBtn onPress={() => onRemoveEntry(index)} label="✕" variant="danger" />
      </View>

      <View style={styles.setHeaders}>
        <View style={{ width: 28 }} />
        <Text style={[styles.setHeaderText, { flex: 1, textAlign: 'center' }]}>REPS</Text>
        <Text style={[styles.setHeaderText, { flex: 1, textAlign: 'center' }]}>KG</Text>
        <View style={{ width: 28 }} />
      </View>

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
              style={styles.removeBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.removeBtnText}>−</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 28 }} />
          )}
        </View>
      ))}

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

const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 13, marginBottom: 10, overflow: 'hidden',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 13, borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  name: { fontSize: 15, fontWeight: '700', color: '#fff' },
  muscle: { fontSize: 10, color: MUTED, marginTop: 2 },
  setHeaders: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, paddingHorizontal: 13, paddingVertical: 6,
  },
  setHeaderText: {
    fontSize: 8, fontWeight: '600', color: DIM,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
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
  removeBtn: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#2a2a2a',
    alignItems: 'center', justifyContent: 'center',
  },
  removeBtnText: { fontSize: 16, color: MUTED, lineHeight: 20 },
  addSetBtn: {
    padding: 12, alignItems: 'center',
    borderTopWidth: 1, borderTopColor: BORDER,
  },
  addSetBtnText: { fontSize: 13, color: ACCENT, fontWeight: '600' },
})