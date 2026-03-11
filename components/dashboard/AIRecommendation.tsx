import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useStore } from '../../store'
import { getAIRecommendation } from '../../lib/ai'
import { ACCENT, CARD, BORDER, MUTED, DIM } from '../../constants/theme'

type Recommendation = {
  recommendation: string
  focus: string
  suggestedExercises: string[]
  restWarning: string | null
}

export default function AIRecommendation() {
  const isPro = useStore(s => s.isPro)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Recommendation | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFetch = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getAIRecommendation()
      setData(result)
    } catch (e: any) {
      setError('Could not get recommendation')
    } finally {
      setLoading(false)
    }
  }

  // Locked state for free users
  if (!isPro) {
    return (
      <TouchableOpacity style={styles.card} onPress={() => router.push('/paywall')}>
        <View style={styles.lockedRow}>
          <Text style={styles.lockedIcon}>🤖</Text>
          <View style={styles.lockedText}>
            <Text style={styles.lockedTitle}>AI Recommendations</Text>
            <Text style={styles.lockedSub}>Upgrade to Pro to unlock</Text>
          </View>
          <View style={styles.proBadge}><Text style={styles.proBadgeTxt}>PRO</Text></View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.icon}>🤖</Text>
          <Text style={styles.title}>AI Coach</Text>
        </View>
        <TouchableOpacity
          style={[styles.askBtn, loading && { opacity: 0.5 }]}
          onPress={handleFetch}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#000" size="small" />
            : <Text style={styles.askBtnTxt}>{data ? 'Refresh' : 'Analyse'}</Text>
          }
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {!data && !loading && (
        <Text style={styles.empty}>Tap Analyse to get a recommendation based on your training history.</Text>
      )}

      {data && (
        <View style={styles.result}>
          {data.restWarning && (
            <View style={styles.warning}>
              <Text style={styles.warningTxt}>⚠️ {data.restWarning}</Text>
            </View>
          )}

          <Text style={styles.recommendation}>{data.recommendation}</Text>

          <View style={styles.focusRow}>
            <Text style={styles.focusLabel}>Focus today</Text>
            <View style={styles.focusBadge}>
              <Text style={styles.focusBadgeTxt}>{data.focus}</Text>
            </View>
          </View>

          <Text style={styles.suggestedLabel}>Suggested exercises</Text>
          <View style={styles.chips}>
            {data.suggestedExercises.map(ex => (
              <View key={ex} style={styles.chip}>
                <Text style={styles.chipTxt}>{ex}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 12, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 14, padding: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { fontSize: 18 },
  title: { fontSize: 15, fontWeight: '700', color: '#fff' },
  askBtn: { backgroundColor: ACCENT, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6, minWidth: 72, alignItems: 'center' },
  askBtnTxt: { fontSize: 13, fontWeight: '700', color: '#000' },
  empty: { fontSize: 13, color: MUTED, lineHeight: 18 },
  error: { fontSize: 13, color: '#ff453a' },
  result: { gap: 12 },
  warning: { backgroundColor: 'rgba(255,159,10,0.1)', borderWidth: 1, borderColor: 'rgba(255,159,10,0.25)', borderRadius: 8, padding: 10 },
  warningTxt: { fontSize: 13, color: '#ff9f0a', lineHeight: 18 },
  recommendation: { fontSize: 14, color: '#fff', lineHeight: 20 },
  focusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  focusLabel: { fontSize: 12, color: MUTED },
  focusBadge: { backgroundColor: 'rgba(200,240,101,0.1)', borderWidth: 1, borderColor: 'rgba(200,240,101,0.25)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 },
  focusBadgeTxt: { fontSize: 12, fontWeight: '700', color: ACCENT },
  suggestedLabel: { fontSize: 12, color: MUTED },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: '#111', borderWidth: 1, borderColor: BORDER, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  chipTxt: { fontSize: 12, color: '#fff' },
  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lockedIcon: { fontSize: 24 },
  lockedText: { flex: 1 },
  lockedTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  lockedSub: { fontSize: 12, color: MUTED, marginTop: 2 },
  proBadge: { backgroundColor: 'rgba(200,240,101,0.1)', borderWidth: 1, borderColor: 'rgba(200,240,101,0.25)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  proBadgeTxt: { fontSize: 11, fontWeight: '800', color: ACCENT, letterSpacing: 1 },
})