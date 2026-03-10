import React from 'react'
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native'
import { usePathname, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { CARD, BORDER, MUTED, ACCENT } from '@/constants/theme'
 
type Props = {
  title: string
  subtitle?: string
  right?: React.ReactNode
}

const PAGES = [
  { name: 'index', label: 'Home', icon: 'home-outline', route: '/(main)/' },
  { name: 'history', label: 'History', icon: 'time-outline', route: '/(main)/history' },
  { name: 'stats', label: 'Stats', icon: 'bar-chart-outline', route: '/(main)/stats' },
  { name: 'profile', label: 'Profile', icon: 'person-outline', route: '/(main)/profile' },
] as const

export default function Header({ title, subtitle, right }: Props) {
  const pathname = usePathname()

  const isActive = (name: string) =>
    name === 'index'
      ? pathname === '/' || pathname === '/(main)' || pathname.endsWith('/index')
      : pathname.includes(name)

  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {right && <View style={styles.right}>{right}</View>}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillRow}
      >
        {PAGES.map((page) => {
          const active = isActive(page.name)
          return (
            <TouchableOpacity
              key={page.name}
              onPress={() => router.push(page.route as any)}
              activeOpacity={0.7}
              style={[styles.pill, active && styles.pillActive]}
            >
            <Ionicons
              name={page.icon}
              size={18}
              color={active ? ACCENT : MUTED}
            />
            <Text style={[styles.text, active && styles.textActive]}>
                {page.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 100,
    paddingHorizontal: 16,
   },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.6,
    lineHeight: 44,
  },
  subtitle: {
    fontSize: 14,
    color: '#8e8e93',
    marginTop: 4,
  },
  right: {
    marginTop: 4,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row', gap: 6,
    paddingHorizontal: 16, paddingBottom: 12,
  },
  pill: {
    flexDirection: "row", alignItems: 'center', gap: 6,
    paddingVertical: 11, paddingHorizontal: 22,
    borderRadius: 999, borderWidth: 1,
    borderColor: BORDER, backgroundColor: CARD,
  },
  pillActive: {
    backgroundColor: 'rgba(200,240,101,0.1)',
    borderColor: 'rgba(200,240,101,0.3)',
  },
  text: { fontSize: 16, fontWeight: '500', color: MUTED },
  textActive: { color: ACCENT },
})