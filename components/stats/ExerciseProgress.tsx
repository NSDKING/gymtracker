import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import LineChart from './LineChart'
import { ACCENT, CARD, BORDER, MUTED, DIM } from '../../constants/theme'

type Exercise = { id: string; name: string; muscle: string }
type Props = {
  exercises: Exercise[]
  selectedId: string
  onSelect: (id: string) => void
  progressWeights: number[]
  firstDate: string
  lastWeight: number
}

export default function ExerciseProgress({
  exercises, selectedId, onSelect, progressWeights, firstDate, lastWeight
}: Props) {
  return (
    <View style={styles.card}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 6, marginBottom: 14 }}
      >
        {exercises.map((ex) => (
          <TouchableOpacity
            key={ex.id}
            onPress={() => onSelect(ex.id)}
            activeOpacity={0.7}
            style={[styles.chip, selectedId === ex.id && styles.chipActive]}
          >
            <Text style={[styles.chipText, selectedId === ex.id && styles.chipTextActive]}>
              {ex.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>Max Weight (kg)</Text>
      {progressWeights.length < 2 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Log this exercise at least twice to see progress</Text>
        </View>
      ) : (
        <>
          <LineChart points={progressWeights} height={90} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={{ fontSize: 10, color: DIM }}>{firstDate}</Text>
            <Text style={{ fontSize: 10, color: ACCENT, fontWeight: '600' }}>
              {lastWeight} kg →
            </Text>
          </View>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 13, marginHorizontal: 14, marginBottom: 10, padding: 13,
  },
  label: {
    fontSize: 9, fontWeight: '600', textTransform: 'uppercase',
    letterSpacing: 1.2, color: MUTED, marginBottom: 10,
  },
  chip: {
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 999, borderWidth: 1, borderColor: BORDER, backgroundColor: '#111',
  },
  chipActive: {
    backgroundColor: 'rgba(200,240,101,0.1)',
    borderColor: 'rgba(200,240,101,0.3)',
  },
  chipText: { fontSize: 12, fontWeight: '500', color: MUTED },
  chipTextActive: { color: ACCENT },
  empty: { height: 80, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111', borderRadius: 8 },
  emptyText: { fontSize: 12, color: DIM, textAlign: 'center' },
})