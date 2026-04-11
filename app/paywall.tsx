import React from 'react'
import { View, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import RevenueCatUI from 'react-native-purchases-ui'
import { CustomerInfo } from 'react-native-purchases'
import { useStore } from '@/store'
import { supabase } from '@/lib/supabase'
import { pushLocalToSupabase } from '@/lib/sync'

export default function PaywallScreen() {
  const handlePurchaseCompleted = async ({ customerInfo }: { customerInfo: CustomerInfo }) => {
    const isPro = typeof customerInfo.entitlements.active['pro'] !== 'undefined'
    if (isPro) {
      useStore.getState().setIsPro(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await pushLocalToSupabase()
        useStore.getState().setSyncEnabled(true)
      }
    }
    router.back()
  }

  return (
    <View style={styles.container}>
      <RevenueCatUI.Paywall
        onPurchaseCompleted={handlePurchaseCompleted}
        onRestoreCompleted={({ customerInfo }) => handlePurchaseCompleted({ customerInfo })}
        onDismiss={() => router.back()}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
})
