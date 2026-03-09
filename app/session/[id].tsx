import React from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useStore, getTotalVolume, getPRs } from '../../store/index'

const ACCENT = '#C8F065'
const CARD = '#1a1a1a'
const BORDER = '#2a2a2a'
const MUTED = '#8e8e93'
const DIM = '#3a3a3c'

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────

function ProgressBar({ pct, highlight }: { pct: number; highlight?: boolean }) {
  return (
    <View style={styles.pbTrack}>
      <View
        style={[
          styles.pbFill,
          { width: `${Math.min(pct * 100, 100)}%` },
          !highlight && { opacity: 0.4 },
        ]}
      />
    </View>
  )
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function SessionSummaryScreen() {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { sessions, exercises } = useStore()

  const session = sessions.find((s) => s.id === id)

  if (!session) {
    return (
      <View style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: MUTED }}>Session not found</Text>
        <TouchableOpacity onPress={() => router.replace('/(main)/')} style={{ marginTop: 16 }}>
          <Text style={{ color: ACCENT }}>Go Home</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalVol = getTotalVolume(session.entries)
  const totalSets = session.entries.reduce((t, e) => t + e.sets.length, 0)
  const prs = getPRs(sessions, exercises)

  // Check which exercises hit a PR in this session
  const sessionPRs = new Set(
    session.entries
      .filter((e) => {
        const pr = prs[e.exerciseId]
        if (!pr) return false
        const sessionMax = Math.max(...e.sets.map((s) => s.weight))
        return sessionMax >= pr.weight && pr.date === session.date
      })
      .map((e) => e.exerciseId)
  )

  // ── Exercise breakdown ────────────────────────────────────────────────────
  const exerciseBreakdown = session.entries.map((e) => {
    const ex = exercises.find((x) => x.id === e.exerciseId)
    const vol = e.sets.reduce((t, s) => t + s.reps * s.weight, 0)
    const maxWeight = Math.max(...e.sets.map((s) => s.weight))
    const isPR = sessionPRs.has(e.exerciseId)
    return { ex, vol, sets: e.sets.length, maxWeight, isPR, sets_data: e.sets }
  })

  const maxVol = Math.max(...exerciseBreakdown.map((e) => e.vol), 1)

  const dateLabel = new Date(session.date).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* ── HERO ── */}
        <View style={styles.hero}>
          <View style={styles.heroBg} />
          <Text style={styles.heroEmoji}>🏆</Text>
          <Text style={styles.heroTitle}>Session Complete</Text>
          <Text style={styles.heroDate}>{dateLabel}</Text>
          <View style={styles.heroBadges}>
            {sessionPRs.size > 0 && (
              <View style={styles.badgeGreen}>
                <Text style={styles.badgeGreenText}>
                  ⚡ {sessionPRs.size} PR{sessionPRs.size > 1 ? 's' : ''}
                </Text>
              </View>
            )}
            <View style={styles.badgeMuted}>
              <Text style={styles.badgeMutedText}>{exerciseBreakdown.length} exercises</Text>
            </View>
          </View>
        </View>

        {/* ── BIG NUMBERS ── */}
        <View style={styles.bigNumbers}>
          {[
            {
              label: 'Volume',
              value: totalVol > 999 ? `${(totalVol / 1000).toFixed(1)}k` : `${totalVol}`,
              unit: 'kg',
            },
            { label: 'Sets', value: `${totalSets}`, unit: '' },
            { label: 'Exercises', value: `${session.entries.length}`, unit: '' },
          ].map((s, i) => (
            <View
              key={s.label}
              style={[styles.bigNumberItem, i < 2 && styles.bigNumberBorder]}
            >
              <Text style={styles.bigNumberLabel}>{s.label}</Text>
              <Text style={styles.bigNumberValue}>
                {s.value}
                {s.unit && <Text style={styles.bigNumberUnit}>{s.unit}</Text>}
              </Text>
            </View>
          ))}
        </View>

        {/* ── EXERCISES ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Exercises</Text>
        </View>

        <View style={[styles.card, { padding: 0 }]}>
          {exerciseBreakdown.map((item, i) => (
            <View
              key={i}
              style={[
                styles.exRow,
                i < exerciseBreakdown.length - 1 && styles.exRowBorder,
              ]}
            >
              {/* Name + PR badge */}
              <View style={styles.exRowHeader}>
                <View style={styles.exRowLeft}>
                  <View
                    style={[
                      styles.exDot,
                      item.isPR && { backgroundColor: ACCENT },
                    ]}
                  />
                  <Text style={styles.exName}>{item.ex?.name ?? 'Unknown'}</Text>
                </View>
                {item.isPR && (
                  <View style={styles.prBadge}>
                    <Text style={styles.prBadgeText}>⚡ PR</Text>
                  </View>
                )}
              </View>

              {/* Meta */}
              <View style={styles.exRowMeta}>
                <Text style={styles.exMetaText}>{item.sets} sets</Text>
                <Text style={styles.exMetaDot}>·</Text>
                <Text style={styles.exMetaText}>{item.maxWeight} kg max</Text>
                <Text style={styles.exMetaDot}>·</Text>
                <Text style={styles.exMetaText}>
                  {item.vol > 999
                    ? `${(item.vol / 1000).toFixed(1)}k`
                    : item.vol}{' '}
                  kg vol
                </Text>
              </View>

              {/* Volume bar */}
              <View style={{ marginTop: 8 }}>
                <ProgressBar pct={item.vol / maxVol} highlight={item.isPR} />
              </View>

              {/* Sets breakdown */}
              <View style={styles.setsGrid}>
                {item.sets_data.map((s, si) => (
                  <View key={si} style={styles.setChip}>
                    <Text style={styles.setChipNum}>{si + 1}</Text>
                    <Text style={styles.setChipVal}>
                      {s.reps} × {s.weight}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* ── NOTE ── */}
        {session.note ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Note</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.noteText}>📝 {session.note}</Text>
            </View>
          </>
        ) : null}

        {/* ── CTAs ── */}
        <View style={styles.ctas}>
          <TouchableOpacity
            style={styles.ctaPrimary}
            onPress={() => router.replace('/(main)/')}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaPrimaryText}>Back to Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ctaSecondary}
            onPress={() => router.replace('/log')}
            activeOpacity={0.7}
          >
            <Text style={styles.ctaSecondaryText}>Log Another Session</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },

  // Hero
  hero: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    overflow: 'hidden',
    position: 'relative',
  },
  heroBg: {
    position: 'absolute',
    top: -60,
    left: '50%',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(200,240,101,0.06)',
    transform: [{ translateX: -140 }],
  },
  heroEmoji: { fontSize: 52, marginBottom: 10 },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroDate: { fontSize: 13, color: MUTED, marginBottom: 14 },
  heroBadges: { flexDirection: 'row', gap: 8 },
  badgeGreen: {
    backgroundColor: 'rgba(200,240,101,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(200,240,101,0.25)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeGreenText: { fontSize: 12, fontWeight: '600', color: ACCENT },
  badgeMuted: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeMutedText: { fontSize: 12, color: MUTED },

  // Big numbers
  bigNumbers: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  bigNumberItem: {
    flex: 1,
    paddingVertical: 20,
    alignItems: 'center',
  },
  bigNumberBorder: {
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  bigNumberLabel: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: MUTED,
    marginBottom: 6,
  },
  bigNumberValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  bigNumberUnit: {
    fontSize: 13,
    fontWeight: '400',
    color: MUTED,
  },

  // Section
  sectionHeader: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.3,
  },

  // Card
  card: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 13,
    marginHorizontal: 14,
    marginBottom: 8,
    padding: 13,
  },

  // Exercise rows
  exRow: { padding: 13 },
  exRowBorder: { borderBottomWidth: 1, borderBottomColor: BORDER },
  exRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  exRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  exDot: {
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: BORDER,
  },
  exName: { fontSize: 14, fontWeight: '600', color: '#fff' },
  prBadge: {
    backgroundColor: 'rgba(200,240,101,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(200,240,101,0.22)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  prBadgeText: { fontSize: 10, fontWeight: '600', color: ACCENT },
  exRowMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  exMetaText: { fontSize: 11, color: MUTED, fontVariant: ['tabular-nums'] },
  exMetaDot: { fontSize: 10, color: DIM },

  // Progress bar
  pbTrack: {
    height: 4, backgroundColor: BORDER,
    borderRadius: 999, overflow: 'hidden',
  },
  pbFill: {
    height: '100%', backgroundColor: ACCENT, borderRadius: 999,
  },

  // Sets grid
  setsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 8,
  },
  setChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  setChipNum: {
    fontSize: 9,
    fontWeight: '600',
    color: DIM,
  },
  setChipVal: {
    fontSize: 11,
    color: MUTED,
    fontVariant: ['tabular-nums'],
  },

  // Note
  noteText: { fontSize: 13, color: MUTED, lineHeight: 18 },

  // CTAs
  ctas: { padding: 14, gap: 10 },
  ctaPrimary: {
    backgroundColor: ACCENT,
    borderRadius: 13,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPrimaryText: { fontSize: 15, fontWeight: '700', color: '#000' },
  ctaSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 13,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaSecondaryText: { fontSize: 15, fontWeight: '500', color: '#fff' },
})