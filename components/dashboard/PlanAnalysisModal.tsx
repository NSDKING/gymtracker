import React, { useState, useEffect } from 'react'
import {
  Modal, View, Text, TouchableOpacity,
  ScrollView, ActivityIndicator, StyleSheet,
} from 'react-native'
import { getAIRecommendation } from '../../lib/ai'
import type { AIRecommendation } from '../../lib/ai'
import { ACCENT, CARD, BORDER, MUTED } from '../../constants/theme'

interface Props {
  visible: boolean
  onClose: () => void
}

export default function PlanAnalysisModal({ visible, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AIRecommendation | null>(null)
  const [error, setError] = useState<string | null>(null)

  const analyse = async () => {
    setLoading(true)
    setError(null)
    try {
      setResult(await getAIRecommendation())
    } catch (e: any) {
      setError(e?.message ?? 'Could not get analysis. Try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (visible && !result && !loading) analyse()
  }, [visible])

  const handleClose = () => {
    setResult(null)
    setError(null)
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Coach Analysis</Text>
          <TouchableOpacity onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.done}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

          {loading && (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={ACCENT} />
              <Text style={styles.loadingTxt}>Analysing your training…</Text>
            </View>
          )}

          {!!error && !loading && (
            <View style={styles.centered}>
              <Text style={styles.errorTxt}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={analyse}>
                <Text style={styles.retryTxt}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {!!result && !loading && (
            <View style={styles.result}>

              {!!result.restWarning && (
                <View style={styles.warningCard}>
                  <Text style={styles.warningLabel}>OVERTRAINING WARNING</Text>
                  <Text style={styles.warningBody}>{result.restWarning}</Text>
                </View>
              )}

              <View style={styles.section}>
                <Text style={styles.label}>FOCUS THIS WEEK</Text>
                <Text style={styles.focusTxt}>{result.focus}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>COACH NOTE</Text>
                <Text style={styles.bodyTxt}>{result.recommendation}</Text>
              </View>

              {result.imbalances.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.label}>IMBALANCES DETECTED</Text>
                  {result.imbalances.map((item, i) => (
                    <View key={i} style={styles.listRow}>
                      <Text style={styles.bullet}>·</Text>
                      <Text style={styles.listTxt}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}

              {result.emphasis.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.label}>WHAT TO EMPHASISE</Text>
                  {result.emphasis.map((item, i) => (
                    <View key={i} style={styles.listRow}>
                      <Text style={[styles.bullet, { color: ACCENT }]}>→</Text>
                      <Text style={styles.listTxt}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}

              {result.suggestedExercises.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.label}>SUGGESTED EXERCISES</Text>
                  <View style={styles.pills}>
                    {result.suggestedExercises.map((ex, i) => (
                      <View key={i} style={styles.pill}>
                        <Text style={styles.pillTxt}>{ex}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <TouchableOpacity style={styles.refreshBtn} onPress={analyse}>
                <Text style={styles.refreshTxt}>↻  Refresh analysis</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  title: { fontSize: 18, fontWeight: '800', color: '#fff' },
  done: { fontSize: 16, color: ACCENT, fontWeight: '600' },
  body: { padding: 16, paddingBottom: 60, gap: 20 },

  centered: { alignItems: 'center', paddingTop: 80, gap: 16 },
  loadingTxt: { fontSize: 14, color: MUTED },
  errorTxt: { fontSize: 14, color: MUTED, textAlign: 'center', paddingHorizontal: 24 },
  retryBtn: {
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1, borderColor: BORDER,
  },
  retryTxt: { fontSize: 14, fontWeight: '600', color: MUTED },

  result: { gap: 20 },

  warningCard: {
    backgroundColor: 'rgba(255,69,58,0.08)', borderWidth: 1,
    borderColor: 'rgba(255,69,58,0.3)', borderRadius: 12,
    padding: 14, gap: 6,
  },
  warningLabel: { fontSize: 10, fontWeight: '800', color: '#ff453a', letterSpacing: 1.2 },
  warningBody: { fontSize: 14, color: '#fff', lineHeight: 20 },

  section: { gap: 8 },
  label: { fontSize: 10, fontWeight: '800', color: MUTED, letterSpacing: 1.2 },
  focusTxt: { fontSize: 22, fontWeight: '800', color: ACCENT, letterSpacing: -0.3 },
  bodyTxt: { fontSize: 14, color: '#fff', lineHeight: 22 },

  listRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  bullet: { fontSize: 14, color: MUTED, lineHeight: 22 },
  listTxt: { flex: 1, fontSize: 14, color: '#fff', lineHeight: 22 },

  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6,
  },
  pillTxt: { fontSize: 12, fontWeight: '600', color: '#fff' },

  refreshBtn: {
    alignSelf: 'center', marginTop: 4,
    borderWidth: 1, borderColor: BORDER,
    borderRadius: 999, paddingHorizontal: 18, paddingVertical: 9,
  },
  refreshTxt: { fontSize: 13, fontWeight: '600', color: MUTED },
})
