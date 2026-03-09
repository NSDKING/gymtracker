import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { usePathname, router } from 'expo-router'

type Props = {
  title: string
  subtitle?: string
  right?: React.ReactNode
}

const pages = [
  { name: 'index', label: 'Home', route: '/(main)/' },
  { name: 'history', label: 'History', route: '/(main)/history' },
  { name: 'stats', label: 'Stats', route: '/(main)/stats' },
  { name: 'profile', label: 'Profile', route: '/(main)/profile' },
]

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
        {pages.map((page) => {
          const active = isActive(page.name)
          return (
            <TouchableOpacity
              key={page.name}
              onPress={() => router.push(page.route as any)}
              activeOpacity={0.7}
              style={[styles.pill, active && styles.pillActive]}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
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
    paddingTop: 52,
    paddingHorizontal: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 12,
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
  pill: {
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    backgroundColor: '#1a1a1a',
  },
  pillActive: {
    backgroundColor: 'rgba(200,240,101,0.1)',
    borderColor: 'rgba(200,240,101,0.3)',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8e8e93',
  },
  pillTextActive: {
    color: '#C8F065',
  },
})