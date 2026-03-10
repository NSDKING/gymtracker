import React, { useState } from 'react'
import { View, ScrollView, Alert, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Header from '../../components/Header'
import AvatarSection from '../../components/profile/AvatarSection'
import StreakBanner from '../../components/profile/StreakBanner'
import Section from '../../components/profile/Section'
import SettingRow from '../../components/profile/SettingRow'
import { useStore, getTotalVolume, getStreak, getPRs } from '../../store/index'
import { BORDER } from '../../constants/theme'
import { Text } from 'react-native'
import { DIM } from '../../constants/theme'

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const { sessions, exercises } = useStore()

  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg')
  const [reminders, setReminders] = useState(true)
  const [prAlerts, setPrAlerts] = useState(true)
  const [weeklySummary, setWeeklySummary] = useState(false)

  const totalVol = sessions.reduce((t, s) => t + getTotalVolume(s.entries), 0)
  const streak = getStreak(sessions)
  const prs = getPRs(sessions, exercises)
  const prCount = Object.keys(prs).length
  const totalSets = sessions.reduce(
    (t, s) => t + s.entries.reduce((tt, e) => tt + e.sets.length, 0), 0
  )

  const firstSession = sessions.length
    ? [...sessions].sort((a, b) => a.date.localeCompare(b.date))[0]
    : null
  const memberSince = firstSession
    ? new Date(firstSession.date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : 'No sessions yet'

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

      <Section title="Preferences">
        <SettingRow
          label="Weight Unit"
          value={weightUnit}
          onPress={() => setWeightUnit(weightUnit === 'kg' ? 'lbs' : 'kg')}
        />
        <View style={styles.divider} />
        <SettingRow label="Exercises in Library" value={`${exercises.length}`} />
      </Section>

      <Section title="Notifications">
        <SettingRow label="Workout Reminders" toggle toggleValue={reminders} onToggle={setReminders} />
        <View style={styles.divider} />
        <SettingRow label="PR Alerts" toggle toggleValue={prAlerts} onToggle={setPrAlerts} />
        <View style={styles.divider} />
        <SettingRow label="Weekly Summary" toggle toggleValue={weeklySummary} onToggle={setWeeklySummary} />
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

      <Section title="About">
        <SettingRow label="Version" value="1.0.0" />
        <View style={styles.divider} />
        <SettingRow label="Built with" value="Expo + Zustand" />
      </Section>

      <Section title="Danger Zone" danger>
        <SettingRow label="Reset All Data" onPress={confirmReset} danger />
      </Section>

      <Text style={styles.footer}>GymTracker · Made with 💪</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  divider: { height: 1, backgroundColor: BORDER, marginHorizontal: 14 },
  footer: { textAlign: 'center', fontSize: 11, color: DIM, paddingVertical: 24 },
})