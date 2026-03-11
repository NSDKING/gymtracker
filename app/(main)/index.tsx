import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useStore } from '@/store/index'
import { exportToCSV } from '@/lib/export'
import { supabase } from '@/lib/supabase'
import { ACCENT, CARD, BORDER, MUTED, DIM } from '@/constants/theme'

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const { sessions, exercises, isPro, isLoggedIn, syncEnabled } = useStore()
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    if (!isPro) {
      router.push('/paywall')
      return
    }
    try {
      setExporting(true)
      await exportToCSV(sessions)
    } catch (e: any) {
      Alert.alert('Export failed', e.message)
    } finally {
      setExporting(false)
    }
  }

  const handleSignOut = async () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out', style: 'destructive', onPress: async () => {
          await supabase.auth.signOut()
          useStore.getState().setIsLoggedIn(false)
          useStore.getState().setSyncEnabled(false)
        }
      }
    ])
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Profile</Text>
      </View>

      {/* Stats summary */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{sessions.length}</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{exercises.length}</Text>
          <Text style={styles.statLabel}>Exercises</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {sessions.reduce((t, s) => t + s.entries.reduce((e, en) => e + en.sets.length, 0), 0)}
          </Text>
          <Text style={styles.statLabel}>Total sets</Text>
        </View>
      </View>

      {/* Pro status */}
      <Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.section}>
        {isPro ? (
          <View style={styles.row}>
            <Text style={styles.rowIcon}>⚡</Text>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Repd Pro</Text>
              <Text style={styles.rowSub}>All features unlocked</Text>
            </View>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeTxt}>PRO</Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.row} onPress={() => router.push('/paywall')}>
            <Text style={styles.rowIcon}>🔒</Text>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Upgrade to Pro</Text>
              <Text style={styles.rowSub}>Sync, AI coach, CSV export</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}

        {isPro && (
          <View style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowIcon}>{syncEnabled ? '☁️' : '📴'}</Text>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Cloud sync</Text>
              <Text style={styles.rowSub}>{syncEnabled ? 'Active — data synced to Supabase' : 'Sign in to enable'}</Text>
            </View>
          </View>
        )}

        {isLoggedIn && (
          <TouchableOpacity style={[styles.row, styles.rowBorder]} onPress={handleSignOut}>
            <Text style={styles.rowIcon}>👤</Text>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Sign out</Text>
              <Text style={styles.rowSub}>Data stays on this device</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}

        {!isLoggedIn && isPro && (
          <TouchableOpacity style={[styles.row, styles.rowBorder]} onPress={() => router.push('/auth')}>
            <Text style={styles.rowIcon}>☁️</Text>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Sign in to sync</Text>
              <Text style={styles.rowSub}>Enable cross-device sync</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Data */}
      <Text style={styles.sectionTitle}>Data</Text>
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.row}
          onPress={handleExport}
          disabled={exporting}
        >
          <Text style={styles.rowIcon}>📤</Text>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Export to CSV</Text>
            <Text style={styles.rowSub}>
              {isPro ? `${sessions.length} sessions · all your data` : 'Pro feature'}
            </Text>
          </View>
          {exporting
            ? <ActivityIndicator color={ACCENT} />
            : isPro
              ? <Text style={styles.chevron}>›</Text>
              : <View style={styles.lockBadge}><Text style={styles.lockBadgeTxt}>PRO</Text></View>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.row, styles.rowBorder]}
          onPress={() => router.push('/ai-workout')}
        >
          <Text style={styles.rowIcon}>✨</Text>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>AI Workout Generator</Text>
            <Text style={styles.rowSub}>{isPro ? 'Generate a plan with Claude' : 'Pro feature'}</Text>
          </View>
          {isPro
            ? <Text style={styles.chevron}>›</Text>
            : <View style={styles.lockBadge}><Text style={styles.lockBadgeTxt}>PRO</Text></View>
          }
        </TouchableOpacity>
      </View>

      {/* App info */}
      <Text style={styles.version}>Repd · Built with 🏋️</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000', paddingTop: 40 },
  header: { paddingHorizontal: 16, paddingBottom: 10 },
  title: { fontSize: 40, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 13, padding: 14, alignItems: 'center' },
  statValue: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  statLabel: { fontSize: 11, color: MUTED, marginTop: 3 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: MUTED, textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 16, marginBottom: 8 },
  section: { marginHorizontal: 16, marginBottom: 24, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 13, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  rowBorder: { borderTopWidth: 1, borderTopColor: BORDER },
  rowIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#fff' },
  rowSub: { fontSize: 12, color: MUTED, marginTop: 2 },
  chevron: { fontSize: 20, color: DIM },
  proBadge: { backgroundColor: 'rgba(200,240,101,0.1)', borderWidth: 1, borderColor: 'rgba(200,240,101,0.25)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  proBadgeTxt: { fontSize: 11, fontWeight: '800', color: ACCENT, letterSpacing: 1 },
  lockBadge: { backgroundColor: 'rgba(200,240,101,0.1)', borderWidth: 1, borderColor: 'rgba(200,240,101,0.25)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  lockBadgeTxt: { fontSize: 11, fontWeight: '800', color: ACCENT, letterSpacing: 1 },
  version: { textAlign: 'center', fontSize: 12, color: DIM, marginTop: 8 },
})