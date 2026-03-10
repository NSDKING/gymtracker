import React from 'react'
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { usePathname, router } from 'expo-router'

const ACCENT = '#C8F065'
const CARD = '#1a1a1a'
const BORDER = '#2a2a2a'
const MUTED = '#8e8e93'

const PAGES = [
  { name: 'index', label: 'Home', route: '/(main)/' },
  { name: 'history', label: 'History', route: '/(main)/history' },
  { name: 'stats', label: 'Stats', route: '/(main)/stats' },
  { name: 'profile', label: 'Profile', route: '/(main)/profile' },
]

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
    paddingVertical: 14, paddingHorizontal: 22,
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