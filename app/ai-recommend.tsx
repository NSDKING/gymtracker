import React, { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Image
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { getAIRecommendation } from '../lib/ai'
import type { AIRecommendation } from '../lib/ai'
import { ACCENT, CARD, BORDER, MUTED } from '../constants/theme'

export default function AIRecommendScreen() {
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AIRecommendation | null>(null)
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [photoBase64, setPhotoBase64] = useState<string | null>(null)

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access so Claude can analyze your physique.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.5,
      base64: true,
    })
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri)
      setPhotoBase64(result.assets[0].base64 ?? null)
    }
  }

  const removePhoto = () => {
    setPhotoUri(null)
    setPhotoBase64(null)
  }

  const fetchRecommendation = async () => {
    try {
      setLoading(true)
      const result = await getAIRecommendation(photoBase64 ?? undefined)
      setData(result)
    } catch (e: any) {
      const body = await e?.context?.json?.().catch(() => null)
      console.error('[ai-recommend] error:', e, body)
      Alert.alert('Error', body?.error ?? e?.message ?? 'Could not get recommendation. Try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRecommendation() }, [])

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backTxt}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>AI Coach</Text>
        <TouchableOpacity onPress={fetchRecommendation} style={styles.refreshBtn} disabled={loading}>
          <Text style={[styles.refreshTxt, loading && { opacity: 0.4 }]}>↻</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      >
        {/* Photo section */}
        <View style={styles.photoCard}>
          <View style={styles.photoCardHeader}>
            <Text style={styles.photoCardTitle}>Physique Analysis</Text>
            <Text style={styles.photoCardBadge}>Optional</Text>
          </View>
          <Text style={styles.photoCardSub}>
            Add a photo so Claude can assess your physique, flag imbalances, and tailor your program.
          </Text>

          {photoUri ? (
            <View style={styles.photoPreviewWrap}>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              <TouchableOpacity style={styles.removePhotoBtn} onPress={removePhoto}>
                <Text style={styles.removePhotoBtnTxt}>✕ Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addPhotoBtn} onPress={pickPhoto}>
              <Text style={styles.addPhotoBtnIcon}>📷</Text>
              <Text style={styles.addPhotoBtnTxt}>Add Photo</Text>
            </TouchableOpacity>
          )}

          {photoUri && (
            <TouchableOpacity
              style={[styles.analyzeBtn, loading && { opacity: 0.5 }]}
              onPress={fetchRecommendation}
              disabled={loading}
            >
              <Text style={styles.analyzeBtnTxt}>
                {loading ? 'Analyzing…' : '✨ Re-analyze with Photo'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={ACCENT} size="large" />
            <Text style={styles.loadingTxt}>
              {photoUri
                ? 'Claude is analyzing your training and physique…'
                : 'Claude is analyzing your training…'}
            </Text>
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

            {data.imbalances && data.imbalances.length > 0 && (
              <View style={styles.imbalanceCard}>
                <Text style={styles.cardLabel}>IMBALANCES DETECTED</Text>
                {data.imbalances.map((item, i) => (
                  <View key={i} style={[styles.listRow, i < data.imbalances.length - 1 && styles.exRowBorder]}>
                    <Text style={styles.imbalanceBullet}>!</Text>
                    <Text style={styles.imbalanceTxt}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {data.emphasis && data.emphasis.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>TRAINING EMPHASIS</Text>
                {data.emphasis.map((item, i) => (
                  <View key={i} style={[styles.listRow, i < data.emphasis.length - 1 && styles.exRowBorder]}>
                    <Text style={styles.exBullet}>→</Text>
                    <Text style={styles.exName}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

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

  photoCard: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 13, padding: 16, gap: 10,
  },
  photoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  photoCardTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  photoCardBadge: {
    fontSize: 10, fontWeight: '700', color: MUTED,
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 5,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  photoCardSub: { fontSize: 12, color: MUTED, lineHeight: 18 },
  addPhotoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderWidth: 1, borderColor: BORDER, borderStyle: 'dashed',
    borderRadius: 10, paddingVertical: 14,
  },
  addPhotoBtnIcon: { fontSize: 18 },
  addPhotoBtnTxt: { fontSize: 14, fontWeight: '600', color: MUTED },
  photoPreviewWrap: { alignItems: 'center', gap: 8 },
  photoPreview: { width: '100%', height: 200, borderRadius: 10, resizeMode: 'cover' },
  removePhotoBtn: { alignSelf: 'flex-end' },
  removePhotoBtnTxt: { fontSize: 12, color: '#ff453a' },
  analyzeBtn: {
    backgroundColor: ACCENT, borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  analyzeBtnTxt: { fontSize: 14, fontWeight: '700', color: '#000' },

  loadingWrap: { alignItems: 'center', paddingTop: 40, gap: 16 },
  loadingTxt: { fontSize: 14, color: MUTED, textAlign: 'center', lineHeight: 20 },
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
  imbalanceCard: {
    backgroundColor: 'rgba(255,159,10,0.05)', borderWidth: 1,
    borderColor: 'rgba(255,159,10,0.2)', borderRadius: 13, padding: 16, gap: 8,
  },
  cardLabel: {
    fontSize: 10, fontWeight: '700', color: MUTED,
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  focusTxt: { fontSize: 24, fontWeight: '800', color: ACCENT, letterSpacing: -0.5 },
  recommendationTxt: { fontSize: 14, color: '#fff', lineHeight: 22 },
  exRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10 },
  exRowBorder: { borderBottomWidth: 1, borderBottomColor: BORDER },
  exBullet: { fontSize: 14, color: ACCENT, fontWeight: '700' },
  imbalanceBullet: { fontSize: 14, color: '#ff9f0a', fontWeight: '800', width: 14, textAlign: 'center' },
  exName: { flex: 1, fontSize: 14, color: '#fff', fontWeight: '500' },
  imbalanceTxt: { flex: 1, fontSize: 13, color: '#ff9f0a', lineHeight: 19 },
  workoutBtn: {
    backgroundColor: ACCENT, borderRadius: 13, height: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  workoutBtnTxt: { fontSize: 15, fontWeight: '800', color: '#000' },
})
