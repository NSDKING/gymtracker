import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Switch
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Header from '../../components/Header'
import { useStore, getTotalVolume, getStreak, getPRs } from '../../store/index'

const ACCENT = '#C8F065'
const CARD = '#1a1a1a'
const BORDER = '#2a2a2a'
const MUTED = '#8e8e93'
const DIM = '#3a3a3c'
const RED = '#ff453a'

// ─── SETTING ROW ─────────────────────────────────────────────────────────────

function SettingRow({
  label,
  value,
  toggle,
  toggleValue,
  onToggle,
  onPress,
  danger,
}: {
  label: string
  value?: string
  toggle?: boolean
  toggleValue?: boolean
  onToggle?: (v: boolean) => void
  onPress?: () => void
  danger?: boolean
}) {
  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress && !toggle}
    >
      <Text style={[styles.settingLabel, danger && { color: RED }]}>{label}</Text>
      <View style={styles.settingRight}>
        {value && <Text style={styles.settingValue}>{value}</Text>}
        {toggle && (
          <Switch
            value={toggleValue}
            onValueChange={onToggle}
            trackColor={{ false: BORDER, true: ACCENT }}
            thumbColor="#fff"
            ios_backgroundColor={BORDER}
          />
        )}
        {onPress && !toggle && (
          <Text style={[styles.settingArrow, danger && { color: RED }]}>›</Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

// ─── SECTION ─────────────────────────────────────────────────────────────────

function Section({ title, children, danger }: {
  title: string
  children: React.ReactNode
  danger?: boolean
}) {
  return (
    <View style={{ marginBottom: 6 }}>
      <Text style={[styles.sectionLabel, danger && { color: RED }]}>{title}</Text>
      <View style={[styles.card, { padding: 0 }]}>
        {children}
      </View>
    </View>
  )
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const { sessions, exercises } = useStore()

  // Preferences state
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg')
  const [reminders, setReminders] = useState(true)
  const [prAlerts, setPrAlerts] = useState(true)
  const [weeklySummary, setWeeklySummary] = useState(false)

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalVol = sessions.reduce((t, s) => t + getTotalVolume(s.entries), 0)
  const streak = getStreak(sessions)
  const prs = getPRs(sessions, exercises)
  const prCount = Object.keys(prs).length
  const totalSets = sessions.reduce(
    (t, s) => t + s.entries.reduce((tt, e) => tt + e.sets.length, 0), 0
  )

  // ── First session date ─────────────────────────────────────────────────────
  const firstSession = sessions.length
    ? [...sessions].sort((a, b) => a.date.localeCompare(b.date))[0]
    : null
  const memberSince = firstSession
    ? new Date(firstSession.date).toLocaleDateString('en-GB', {
        month: 'long', year: 'numeric',
      })
    : 'No sessions yet'

  // ── Reset ──────────────────────────────────────────────────────────────────
  const { sessions: _, exercises: __, ...store } = useStore()

  const confirmReset = () => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete all your sessions and exercises. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
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

      {/* ── AVATAR ── */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>💪</Text>
        </View>
        <Text style={styles.avatarName}>Athlete</Text>
        <Text style={styles.avatarSub}>Lifting since {memberSince}</Text>

        {/* All time strip */}
        <View style={styles.statStrip}>
          {[
            { label: 'Sessions', value: `${sessions.length}` },
            { label: 'Volume', value: totalVol > 999 ? `${(totalVol / 1000).toFixed(0)}k` : `${totalVol}` },
            { label: 'Sets', value: `${totalSets}` },
            { label: 'PRs', value: `${prCount}` },
          ].map((s, i) => (
            <View
              key={s.label}
              style={[
                styles.statStripItem,
                i < 3 && styles.statStripBorder,
              ]}
            >
              <Text style={styles.statStripValue}>{s.value}</Text>
              <Text style={styles.statStripLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── STREAK ── */}
      {streak > 0 && (
        <View style={styles.streakBanner}>
          <Text style={styles.streakText}>🔥 {streak}-day streak — keep it going!</Text>
        </View>
      )}

      {/* ── PREFERENCES ── */}
      <Section title="Preferences">
        <SettingRow
          label="Weight Unit"
          value={weightUnit}
          onPress={() => setWeightUnit(weightUnit === 'kg' ? 'lbs' : 'kg')}
        />
        <View style={styles.rowDivider} />
        <SettingRow
          label="Exercises in Library"
          value={`${exercises.length}`}
        />
      </Section>

      {/* ── NOTIFICATIONS ── */}
      <Section title="Notifications">
        <SettingRow
          label="Workout Reminders"
          toggle
          toggleValue={reminders}
          onToggle={setReminders}
        />
        <View style={styles.rowDivider} />
        <SettingRow
          label="PR Alerts"
          toggle
          toggleValue={prAlerts}
          onToggle={setPrAlerts}
        />
        <View style={styles.rowDivider} />
        <SettingRow
          label="Weekly Summary"
          toggle
          toggleValue={weeklySummary}
          onToggle={setWeeklySummary}
        />
      </Section>

      {/* ── DATA ── */}
      <Section title="Data">
        <SettingRow
          label="Total Sessions"
          value={`${sessions.length}`}
        />
        <View style={styles.rowDivider} />
        <SettingRow
          label="Total Volume Lifted"
          value={
            totalVol > 999
              ? `${(totalVol / 1000).toFixed(1)}k kg`
              : `${totalVol} kg`
          }
        />
        <View style={styles.rowDivider} />
        <SettingRow
          label="Personal Records"
          value={`${prCount}`}
        />
      </Section>

      {/* ── ABOUT ── */}
      <Section title="About">
        <SettingRow label="Version" value="1.0.0" />
        <View style={styles.rowDivider} />
        <SettingRow label="Built with" value="Expo + Zustand" />
      </Section>

      {/* ── DANGER ZONE ── */}
      <Section title="Danger Zone" danger>
        <SettingRow
          label="Reset All Data"
          onPress={confirmReset}
          danger
        />
      </Section>

      <Text style={styles.footer}>GymTracker · Made with 💪</Text>
    </ScrollView>
  )
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(200,240,101,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(200,240,101,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: { fontSize: 32 },
  avatarName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  avatarSub: { fontSize: 12, color: MUTED, marginBottom: 16 },

  // Stat strip
  statStrip: {
    flexDirection: 'row',
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 13,
    overflow: 'hidden',
    width: '100%',
  },
  statStripItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statStripBorder: {
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  statStripValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  statStripLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 3,
  },

  // Streak banner
  streakBanner: {
    backgroundColor: 'rgba(200,240,101,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(200,240,101,0.2)',
    borderRadius: 11,
    marginHorizontal: 14,
    marginBottom: 14,
    padding: 12,
    alignItems: 'center',
  },
  streakText: {
    fontSize: 13,
    fontWeight: '600',
    color: ACCENT,
  },

  // Section
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 6,
  },
  card: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 13,
    marginHorizontal: 14,
  },

  // Setting row
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  settingLabel: {
    fontSize: 14,
    color: '#fff',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 13,
    color: MUTED,
    fontVariant: ['tabular-nums'],
  },
  settingArrow: {
    fontSize: 18,
    color: DIM,
    lineHeight: 20,
  },
  rowDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginHorizontal: 14,
  },

  // Footer
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: DIM,
    paddingVertical: 24,
  },
})