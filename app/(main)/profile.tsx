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
import { syncWithSupabase } from '@/lib/sync'
import {
  requestNotificationPermissions,
  scheduleWeeklyReminders,
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

const REMINDER_HOURS = [6, 7, 8, 9, 10, 12, 17, 18, 19, 20]

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const {
    sessions, exercises, isPro,
    activeProgram, weeklySchedule,
    notificationsEnabled, reminderHour,
    setNotificationsEnabled, setReminderHour,
  } = useStore()

  const [weeklySummary, setWeeklySummary] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [showHourPicker, setShowHourPicker] = useState(false)

  const totalVol = sessions.reduce((t, s) => t + getTotalVolume(s.entries), 0)
  const streak = getStreak(sessions)
  const prs = getPRs(sessions, exercises)
  const prCount = Object.keys(prs).length
  const totalSets = sessions.reduce(
    (t, s) => t + s.entries.reduce((tt, e) => tt + e.sets.length, 0), 0
  )

  const handleReminders = async (val: boolean) => {
    const granted = await requestNotificationPermissions()
    if (!granted) {
      Alert.alert('Permission needed', 'Enable notifications in Settings to use this feature.')
      return
    }
    if (val) {
      // Use plan-aware schedule if a plan is active, otherwise basic daily reminder
      if (activeProgram && weeklySchedule) {
        await scheduleWeeklyReminders(weeklySchedule, activeProgram.days, reminderHour)
      } else {
        await scheduleWorkoutReminder(reminderHour)
      }
    } else {
      await cancelWorkoutReminder()
    }
    setNotificationsEnabled(val)
  }

  const handleReminderHour = async (hour: number) => {
    setReminderHour(hour)
    setShowHourPicker(false)
    if (notificationsEnabled) {
      // Reschedule with new hour
      if (activeProgram && weeklySchedule) {
        await scheduleWeeklyReminders(weeklySchedule, activeProgram.days, hour)
      } else {
        await scheduleWorkoutReminder(hour)
      }
    }
  }

  const handleWeeklySummary = async (val: boolean) => {
    const granted = await requestNotificationPermissions()
    if (!granted) {
      Alert.alert('Permission needed', 'Enable notifications in Settings to use this feature.')
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

  const handleSync = async () => {
    if (!isPro) { router.push('/paywall'); return }
    try {
      setSyncing(true)
      await syncWithSupabase()
      Alert.alert('Synced', 'All data is up to date.')
    } catch (e: any) {
      Alert.alert('Sync failed', e.message)
    } finally {
      setSyncing(false)
    }
  }

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
                      const { error } = await supabase.functions.invoke('delete-user')
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

  const hourLabel = (h: number) => {
    const suffix = h >= 12 ? 'PM' : 'AM'
    const display = h % 12 === 0 ? 12 : h % 12
    return `${display}:00 ${suffix}`
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
            label={syncing ? 'Syncing…' : 'Cloud Sync'}
            value={syncing ? '' : 'Sync Now'}
            onPress={syncing ? undefined : handleSync}
          />
        </ProGate>
      </Section>

      <Section title="Notifications">
        <SettingRow
          label="Workout & Rest-Day Reminders"
          subtitle={notificationsEnabled
            ? `Daily at ${hourLabel(reminderHour)} · gym & rest days`
            : 'Remind me on gym and rest days'}
          toggle
          toggleValue={notificationsEnabled}
          onToggle={handleReminders}
        />
        {notificationsEnabled && (
          <>
            <View style={styles.divider} />
            <SettingRow
              label="Reminder Time"
              value={hourLabel(reminderHour)}
              onPress={() => setShowHourPicker(v => !v)}
            />
            {showHourPicker && (
              <View style={styles.hourGrid}>
                {REMINDER_HOURS.map(h => (
                  <TouchableOpacity
                    key={h}
                    style={[styles.hourBtn, reminderHour === h && styles.hourBtnActive]}
                    onPress={() => handleReminderHour(h)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.hourTxt, reminderHour === h && styles.hourTxtActive]}>
                      {hourLabel(h)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
        <View style={styles.divider} />
        <SettingRow
          label="Weekly Summary"
          subtitle="Sunday evening recap"
          toggle
          toggleValue={weeklySummary}
          onToggle={handleWeeklySummary}
        />
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

      <Section title="Account">
        <SettingRow label="Sign Out" onPress={handleSignOut} danger />
        <View style={styles.divider} />
        <SettingRow label="Delete Account" onPress={handleDeleteAccount} danger />
      </Section>

      <Section title="About">
        <SettingRow label="Version" value="1.0.0" />
        <View style={styles.divider} />
        <SettingRow label="Built with" value="Expo + Supabase" />
      </Section>

      <Section title="Danger Zone" danger>
        <SettingRow label="Reset All Data" onPress={confirmReset} danger />
      </Section>

      {__DEV__ && (
        <Section title="Dev Tools">
          <SettingRow
            label={`Force Pro: ${isPro ? 'ON' : 'OFF'}`}
            onPress={() => useStore.setState({ isPro: !isPro })}
          />
        </Section>
      )}

      <Text style={styles.footer}>Repd · Made with 💪</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  divider: { height: 1, backgroundColor: BORDER, marginHorizontal: 14 },
  footer: { textAlign: 'center', fontSize: 11, color: DIM, paddingVertical: 24 },
  proBanner: {
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: ACCENT, borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  proBannerTitle: { fontSize: 15, fontWeight: '700', color: '#000', marginBottom: 2 },
  proBannerSub: { fontSize: 12, color: 'rgba(0,0,0,0.6)' },
  proBannerArrow: { fontSize: 20, fontWeight: '700', color: '#000' },
  proActiveBadge: {
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: 'rgba(200,240,101,0.1)',
    borderWidth: 1, borderColor: 'rgba(200,240,101,0.3)',
    borderRadius: 14, padding: 12, alignItems: 'center',
  },
  proActiveText: { fontSize: 13, fontWeight: '700', color: ACCENT },
  hourGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  hourBtn: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
    borderWidth: 1, borderColor: BORDER,
  },
  hourBtnActive: {
    backgroundColor: 'rgba(200,240,101,0.1)',
    borderColor: 'rgba(200,240,101,0.4)',
  },
  hourTxt: { fontSize: 13, fontWeight: '600', color: DIM },
  hourTxtActive: { color: ACCENT },
})
