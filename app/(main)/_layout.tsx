import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { router, usePathname, Slot } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type Page = {
  name: string
  label: string
  route: string
  icon: (active: boolean) => React.ReactNode
}

const pages: Page[] = [
  {
    name: 'index',
    label: 'Home',
    route: '/(main)/',
    icon: (active) => (
      <Text style={{ fontSize: 11, color: active ? '#C8F065' : '#8e8e93' }}>⊞</Text>
    ),
  },
  {
    name: 'history',
    label: 'History',
    route: '/(main)/history',
    icon: (active) => (
      <Text style={{ fontSize: 11, color: active ? '#C8F065' : '#8e8e93' }}>◷</Text>
    ),
  },
  {
    name: 'stats',
    label: 'Stats',
    route: '/(main)/stats',
    icon: (active) => (
      <Text style={{ fontSize: 11, color: active ? '#C8F065' : '#8e8e93' }}>↑</Text>
    ),
  },
  {
    name: 'profile',
    label: 'Profile',
    route: '/(main)/profile',
    icon: (active) => (
      <Text style={{ fontSize: 11, color: active ? '#C8F065' : '#8e8e93' }}>◉</Text>
    ),
  },
]

function FAB({ bottomInset }: { bottomInset: number }) {
  return (
    <TouchableOpacity
      style={[styles.fab, { bottom: bottomInset + 20 }]}
      onPress={() => router.push('/log')}
      activeOpacity={0.85}
    >
      <View style={styles.fabIcon}>
        <Text style={{ fontSize: 22, color: '#000', fontWeight: '300', lineHeight: 24 }}>+</Text>
      </View>
      <Text style={styles.fabLabel}>Log Session</Text>
    </TouchableOpacity>
  )
}

export default function MainLayout() {
  const pathname = usePathname()
  const insets = useSafeAreaInsets()

  // Hide FAB on log screen and any focused flow
  const hideFAB = pathname.includes('/log')

  return (
    <View style={styles.container}>
      <Slot />
      {!hideFAB && <FAB bottomInset={insets.bottom} />}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fab: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C8F065',
    borderRadius: 999,
    height: 50,
    paddingRight: 18,
    paddingLeft: 5,
    shadowColor: '#C8F065',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 14,
    elevation: 8,
  },
  fabIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  fabLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
})