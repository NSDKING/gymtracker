import React, { useState } from 'react'
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import ExercisePickerTab from './ExercisePickerTab'
import CreateExerciseTab from './CreateExerciseTab'
import IconBtn from './IconBtn'
import type { Exercise } from '../../store/index'
import { CARD, BORDER, MUTED } from '../../constants/theme'

type Props = {
  exercises: Exercise[]
  onPick: (ex: Exercise) => void
  onClose: () => void
}

export default function ExercisePickerSheet({ exercises, onPick, onClose }: Props) {
  const [tab, setTab] = useState<'pick' | 'create'>('pick')
  const insets = useSafeAreaInsets()

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.sheet, { paddingBottom: insets.bottom }]}
    >
      <View style={styles.handle} />

      <View style={styles.header}>
        <Text style={styles.title}>Add Exercise</Text>
        <IconBtn onPress={onClose} label="✕" variant="danger" />
      </View>

      <View style={styles.tabRow}>
        {(['pick', 'create'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            activeOpacity={0.7}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
          >
            <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>
              {t === 'pick' ? 'My Exercises' : '✦  Create New'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        {tab === 'pick'
          ? <ExercisePickerTab exercises={exercises} onPick={onPick} />
          : <CreateExerciseTab onCreated={onPick} />
        }
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: CARD,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderTopWidth: 1, borderColor: BORDER,
    maxHeight: '85%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: BORDER,
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 14,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#fff' },
  tabRow: {
    flexDirection: 'row', backgroundColor: '#111',
    borderRadius: 10, padding: 3, marginHorizontal: 14, marginBottom: 12,
  },
  tabBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: BORDER },
  tabBtnText: { fontSize: 13, fontWeight: '500', color: MUTED },
  tabBtnTextActive: { color: '#fff' },
})