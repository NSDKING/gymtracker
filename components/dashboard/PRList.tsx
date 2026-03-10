import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { ACCENT, CARD, BORDER, MUTED, DIM } from '../../constants/theme'

type PR = {
  exercise: { id: string; name: string } | undefined
  weight: number
  date: string
}

export default function PRList({ prs }: { prs: PR[] }) {
  return (
    <View style={[styles.card, { padding: 0 }]}>
      {prs.length === 0 ? (
        <View style={{ padding: 16 }}>
          <Text style={styles.empty}>Log sessions to see your PRs here</Text>
        </View>
      ) : (
        prs.map((pr, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.row, i < prs.length - 1 && styles.rowBorder]}
            activeOpacity={0.7}
            onPress={() => pr.exercise && router.push(`/exercise/${pr.exercise.id}`)}
          >
            <View>
              <Text style={styles.name}>{pr.exercise?.name}</Text>
              <Text style={styles.date}>
                {new Date(pr.date).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short',
                })}
              </Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>⚡ {pr.weight} kg</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 13, marginHorizontal: 14, marginBottom: 10,
    minHeight: 85,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 14,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: BORDER },
  name: { fontSize: 20, fontWeight: '500', color: '#fff' },
  date: { fontSize: 14, color: DIM, marginTop: 2 },
  badge: {
    backgroundColor: 'rgba(200,240,101,0.08)',
    borderWidth: 1, borderColor: 'rgba(200,240,101,0.22)',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4,
  },
  badgeText: { fontSize: 14, fontWeight: '600', color: ACCENT },
  empty: { fontSize: 13, color: DIM, textAlign: 'center' },
})