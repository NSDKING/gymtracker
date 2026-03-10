import React from 'react'
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { usePathname, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { CARD, BORDER, MUTED, ACCENT } from '../../constants/theme'
 

const PAGES = [
  { name: 'index', label: 'Home', icon: 'home-outline', route: '/(main)/' },
  { name: 'history', label: 'History', icon: 'time-outline', route: '/(main)/history' },
  { name: 'stats', label: 'Stats', icon: 'bar-chart-outline', route: '/(main)/stats' },
  { name: 'profile', label: 'Profile', icon: 'person-outline', route: '/(main)/profile' },
] as const

export default function PillNav() {
  const pathname = usePathname()

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {PAGES.map((page) => {
        const active = page.name === 'index'
          ? pathname === '/' || pathname.endsWith('/(main)') || pathname.endsWith('/index')
          : pathname.includes(page.name)
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
  )
}

const styles = StyleSheet.create({
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