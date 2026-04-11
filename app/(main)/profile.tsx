import React, { useState } from 'react'
import { View, ScrollView, Alert, StyleSheet, Text, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import Header from '@/components/Header'
import AvatarSection from '@/components/profile/AvatarSection'
import StreakBanner from '@/components/profile/StreakBanner'
import Section from '@/components/profile/Section'
import SettingRow from '@/components/profile/SettingRow'
import { useStore, getTotalVolume, getStreak, getPRs } from '@/store/index'
import { BORDER, DIM, ACCENT } from '@/constants/theme'
import { supabase } from '@/lib/supabase'
import { exportToCSV } from '@/lib/export'

import {
  requestNotificationPermissions,
  scheduleWorkoutReminder,
  cancelWorkoutReminder,
  scheduleWeeklySummary,
} from '@/lib/notifications'

function ProGate({ children, isPro }: { children: React.ReactNode; isPro: boolean }) {
  if (isPro) return <>{children}</>
  return (
    <TouchableOpacity onPress={() => router.push('/paywall')} activeOpacity={0.8}>
      <View style={{ opacity: 0.5 }} pointerEvents="none">
        {children}
      </View>
      <View style={proGateStyles.badge}>
        <Text style={proGateStyles.badgeText}>PRO</Text>
      </View>
    </TouchableOpacity>
  )
}
const proGateStyles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: 14,
    top: '50%',
    backgroundColor: ACCENT,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    transform: [{ translateY: -10 }],
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#000' },
})


export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const { sessions, exercises, isPro, isLoggedIn } = useStore()

  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg')
  const [reminders, setReminders] = useState(true)
  const [prAlerts, setPrAlerts] = useState(true)
  const [weeklySummary, setWeeklySummary] = useState(false)
  const [exporting, setExporting] = useState(false)

  const totalVol = sessions.reduce((t, s) => t + getTotalVolume(s.entries), 0)
  const streak = getStreak(sessions)
  const prs = getPRs(sessions, exercises)
  const prCount = Object.keys(prs).length
  const totalSets = sessions.reduce(
    (t, s) => t + s.entries.reduce((tt, e) => tt + e.sets.length, 0), 0
  )

  const handleReminders = async (val: boolean) => {
  if (!isPro) { router.push('/paywall'); return }
  const granted = await requestNotificationPermissions()
  if (!granted) {
    Alert.alert('Permission needed', 'Enable notifications in your iPhone Settings to use this feature.')
    return
  }
  if (val) await scheduleWorkoutReminder(9)
  else await cancelWorkoutReminder()
  setReminders(val)
}

const handleWeeklySummary = async (val: boolean) => {
  if (!isPro) { router.push('/paywall'); return }
  const granted = await requestNotificationPermissions()
  if (!granted) {
    Alert.alert('Permission needed', 'Enable notifications in your iPhone Settings to use this feature.')
    return
  }
  if (val) await scheduleWeeklySummary()
  setWeeklySummary(val)
}

  const firstSession = sessions.length
    ? [...sessions].sort((a, b) => a.date.localeCompare(b.date))[0]
    : null
  const memberSince = firstSession
    ? new Date(firstSession.date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : 'No sessions yet'

  const handleExport = async () => {
    if (!isPro) { router.push('/paywall'); return }
    try {
      setExporting(true)
      await exportToCSV(sessions, exercises)
    } catch (e: any) {
      Alert.alert('Export failed', e.message)
    } finally {
      setExporting(false)
    }
  }

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut()
          useStore.getState().setIsLoggedIn(false)
          useStore.getState().setSyncEnabled(false)
        },
      },
    ])
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account', style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'Your account, sessions, and all data will be permanently deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete', style: 'destructive',
                  onPress: async () => {
                    try {
                      const { error } = await supabase.rpc('delete_user')
                      if (error) throw error
                      await supabase.auth.signOut()
                      useStore.setState({ sessions: [], exercises: [], isLoggedIn: false, syncEnabled: false, isPro: false })
                    } catch (e: any) {
                      Alert.alert('Error', 'Could not delete account. Please contact support at support@repd.app')
                    }
                  },
                },
              ]
            )
          },
        },
      ]
    )
  }

  const confirmReset = () => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete all your sessions and exercises. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset', style: 'destructive',
          onPress: () => {
            useStore.setState({ sessions: [], exercises: [] })
            Alert.alert('Done', 'All data has been cleared.')
          },
        },
      ]
    )
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <Header title="Profile" />

      <AvatarSection
        memberSince={memberSince}
        sessions={sessions.length}
        totalVol={totalVol}
        totalSets={totalSets}
        prCount={prCount}
      />

      <StreakBanner streak={streak} />

      {/* Pro Banner or Active Badge */}
      {!isPro ? (
        <TouchableOpacity
          style={styles.proBanner}
          onPress={() => router.push('/paywall')}
          activeOpacity={0.85}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.proBannerTitle}>Upgrade to Pro 🚀</Text>
            <Text style={styles.proBannerSub}>AI coach · Cloud sync · CSV export · Smart notifications</Text>
          </View>
          <Text style={styles.proBannerArrow}>→</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.proActiveBadge}>
          <Text style={styles.proActiveText}>✦ Pro Active</Text>
        </View>
      )}

      <Section title="Preferences">
        <SettingRow
          label="Workout Reminders"
          toggle
          toggleValue={reminders}
          onToggle={handleReminders}
        />
        <View style={styles.divider} />
        <SettingRow
          label="Weekly Summary"
          toggle
          toggleValue={weeklySummary}
          onToggle={handleWeeklySummary}
        />
      </Section>

      {/* Pro Features Section */}
      <Section title="Pro Features">
        <ProGate isPro={isPro}>
          <SettingRow
            label={exporting ? 'Exporting...' : 'Export to CSV'}
            value="↓"
            onPress={exporting ? undefined : handleExport}
          />
        </ProGate>
        <View style={styles.divider} />
        <ProGate isPro={isPro}>
          <SettingRow
            label="AI Coach"
            value="→"
            onPress={() => router.push('/ai-recommend')}
          />
        </ProGate>
        <View style={styles.divider} />
        <ProGate isPro={isPro}>
          <SettingRow
            label="AI Workout Generator"
            value="→"
            onPress={() => router.push('/ai-workout')}
          />
        </ProGate>
        <View style={styles.divider} />
        <ProGate isPro={isPro}>
          <SettingRow
            label="Cloud Sync"
            value={isPro ? 'On' : 'Off'}
          />
        </ProGate>
      </Section>

      <Section title="Notifications">
        <ProGate isPro={isPro}>
          <SettingRow
            label="Workout Reminders"
            toggle
            toggleValue={reminders}
            onToggle={isPro ? setReminders : () => router.push('/paywall')}
          />
        </ProGate>
        <View style={styles.divider} />
        <ProGate isPro={isPro}>
          <SettingRow
            label="PR Alerts"
            toggle
            toggleValue={prAlerts}
            onToggle={isPro ? setPrAlerts : () => router.push('/paywall')}
          />
        </ProGate>
        <View style={styles.divider} />
        <ProGate isPro={isPro}>
          <SettingRow
            label="Weekly Summary"
            toggle
            toggleValue={weeklySummary}
            onToggle={isPro ? setWeeklySummary : () => router.push('/paywall')}
          />
        </ProGate>
      </Section>

      <Section title="Data">
        <SettingRow label="Total Sessions" value={`${sessions.length}`} />
        <View style={styles.divider} />
        <SettingRow
          label="Total Volume Lifted"
          value={totalVol > 999 ? `${(totalVol / 1000).toFixed(1)}k kg` : `${totalVol} kg`}
        />
        <View style={styles.divider} />
        <SettingRow label="Personal Records" value={`${prCount}`} />
      </Section>

      {isLoggedIn && (
        <Section title="Account">
          <SettingRow label="Sign Out" onPress={handleSignOut} danger />
          <View style={styles.divider} />
          <SettingRow label="Delete Account" onPress={handleDeleteAccount} danger />
        </Section>
      )}

      <Section title="About">
        <SettingRow label="Version" value="1.0.0" />
        <View style={styles.divider} />
        <SettingRow label="Built with" value="Expo + Supabase" />
      </Section>

      <Section title="Danger Zone" danger>
        <SettingRow label="Reset All Data" onPress={confirmReset} danger />
      </Section>

      <Text style={styles.footer}>Repd · Made with 💪</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  divider: { height: 1, backgroundColor: BORDER, marginHorizontal: 14 },
  footer: { textAlign: 'center', fontSize: 11, color: DIM, paddingVertical: 24 },
  proBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: ACCENT,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  proBannerTitle: { fontSize: 15, fontWeight: '700', color: '#000', marginBottom: 2 },
  proBannerSub: { fontSize: 12, color: 'rgba(0,0,0,0.6)' },
  proBannerArrow: { fontSize: 20, fontWeight: '700', color: '#000' },
  proActiveBadge: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(200,240,101,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(200,240,101,0.3)',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  proActiveText: { fontSize: 13, fontWeight: '700', color: ACCENT },
})