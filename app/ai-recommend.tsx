import React, { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getAIRecommendation } from '../lib/ai'
import { ACCENT, CARD, BORDER, MUTED, DIM } from '../constants/theme'

type Recommendation = {
  recommendation: string
  focus: string
  suggestedExercises: string[]
  restWarning: string | null
}

export default function AIRecommendScreen() {
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<Recommendation | null>(null)

  const fetch = async () => {
    try {
      setLoading(true)
      const result = await getAIRecommendation()
      setData(result)
    } catch (e: any) {
      Alert.alert('Error', 'Could not get recommendation. Try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backTxt}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>AI Coach</Text>
        <TouchableOpacity onPress={fetch} style={styles.refreshBtn} disabled={loading}>
          <Text style={[styles.refreshTxt, loading && { opacity: 0.4 }]}>↻</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={ACCENT} size="large" />
            <Text style={styles.loadingTxt}>Claude is analyzing your training…</Text>
          </View>
        ) : data ? (
          <>
            {data.restWarning && (
              <View style={styles.warningCard}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text style={styles.warningTxt}>{data.restWarning}</Text>
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.cardLabel}>TODAY'S FOCUS</Text>
              <Text style={styles.focusTxt}>{data.focus}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>RECOMMENDATION</Text>
              <Text style={styles.recommendationTxt}>{data.recommendation}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>SUGGESTED EXERCISES</Text>
              {data.suggestedExercises.map((ex, i) => (
                <View key={i} style={[styles.exRow, i < data.suggestedExercises.length - 1 && styles.exRowBorder]}>
                  <Text style={styles.exBullet}>→</Text>
                  <Text style={styles.exName}>{ex}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.workoutBtn}
              onPress={() => router.push('/ai-workout')}
            >
              <Text style={styles.workoutBtnTxt}>✨ Generate Full Workout Plan</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: { width: 60 },
  backTxt: { fontSize: 17, color: ACCENT },
  navTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  refreshBtn: { width: 60, alignItems: 'flex-end' },
  refreshTxt: { fontSize: 22, color: ACCENT },
  content: { padding: 16, gap: 12 },
  loadingWrap: { alignItems: 'center', paddingTop: 80, gap: 16 },
  loadingTxt: { fontSize: 14, color: MUTED, textAlign: 'center' },
  warningCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: 'rgba(255,159,10,0.1)', borderWidth: 1,
    borderColor: 'rgba(255,159,10,0.3)', borderRadius: 13, padding: 14,
  },
  warningIcon: { fontSize: 16 },
  warningTxt: { flex: 1, fontSize: 13, color: '#ff9f0a', lineHeight: 18 },
  card: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 13, padding: 16, gap: 8,
  },
  cardLabel: {
    fontSize: 10, fontWeight: '700', color: MUTED,
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  focusTxt: { fontSize: 24, fontWeight: '800', color: ACCENT, letterSpacing: -0.5 },
  recommendationTxt: { fontSize: 14, color: '#fff', lineHeight: 22 },
  exRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  exRowBorder: { borderBottomWidth: 1, borderBottomColor: BORDER },
  exBullet: { fontSize: 14, color: ACCENT, fontWeight: '700' },
  exName: { fontSize: 14, color: '#fff', fontWeight: '500' },
  workoutBtn: {
    backgroundColor: ACCENT, borderRadius: 13, height: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  workoutBtnTxt: { fontSize: 15, fontWeight: '800', color: '#000' },
})
