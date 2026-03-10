import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

const ACCENT = '#C8F065'
const CARD = '#1a1a1a'
const BORDER = '#2a2a2a'
const MUTED = '#8e8e93'
const DIM = '#3a3a3c'

type PR = {
  exercise: { name: string } | undefined
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
          <View key={i} style={[styles.row, i < prs.length - 1 && styles.rowBorder]}>
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
          </View>
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