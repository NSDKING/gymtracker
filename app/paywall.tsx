import React, { useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PurchasesPackage } from 'react-native-purchases'
import { fetchOfferings, purchasePackage, restorePurchases } from '../lib/revenue-cat'
import { ACCENT, CARD, BORDER, MUTED, DIM } from '../constants/theme'
import { supabase } from '@/lib/supabase'
import { pushLocalToSupabase } from '@/lib/sync'
import { useStore } from '@/store'

const FEATURES = [
  { icon: '☁️', title: 'Cross-device sync', desc: 'Your data everywhere via Supabase' },
  { icon: '🤖', title: 'AI recommendations', desc: 'Claude analyzes your history and tells you what to train' },
  { icon: '💪', title: 'AI workout generator', desc: 'Get full workout plans built around your goals' },
  { icon: '📤', title: 'Export to CSV', desc: 'Download all your data anytime' },
]

export default function PaywallScreen() {
  const insets = useSafeAreaInsets()
  const [packages, setPackages] = useState<PurchasesPackage[]>([])
  const [selected, setSelected] = useState<PurchasesPackage | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)

  useEffect(() => {
    fetchOfferings().then(pkgs => {
      setPackages(pkgs)
      setSelected(pkgs[0] ?? null)
      setLoading(false)
    })
  }, [])

  const handlePurchase = async () => {
    if (!selected) return
    try {
      setPurchasing(true)
      const isPro = await purchasePackage(selected)
      if (isPro){
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            await pushLocalToSupabase()
            useStore.getState().setSyncEnabled(true)
        } else {
            router.replace('/auth') // login first, sync happens after
        } 
      }
    } catch (e: any) {
      if (!e.userCancelled) Alert.alert('Purchase failed', e.message)
    } finally {
      setPurchasing(false)
    }
  }

  const handleRestore = async () => {
    try {
      setPurchasing(true)
      const isPro = await restorePurchases()
      if (isPro) { router.back() }
      else { Alert.alert('No purchases found', 'No active Pro subscription found.') }
    } catch (e: any) {
      Alert.alert('Restore failed', e.message)
    } finally {
      setPurchasing(false)
    }
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeTxt}>✕</Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>REPD PRO</Text>
        <Text style={styles.headline}>Lift smarter.{'\n'}Sync everywhere.</Text>

        <View style={styles.features}>
          {FEATURES.map(f => (
            <View key={f.title} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {loading ? <ActivityIndicator color={ACCENT} style={{ marginVertical: 24 }} /> : (
          <View style={styles.packages}>
            {packages.map(pkg => (
              <TouchableOpacity
                key={pkg.identifier}
                style={[styles.pkg, selected?.identifier === pkg.identifier && styles.pkgSelected]}
                onPress={() => setSelected(pkg)}
              >
                <Text style={styles.pkgTitle}>{pkg.product.title}</Text>
                <Text style={styles.pkgPrice}>{pkg.product.priceString} / {pkg.packageType.toLowerCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.ctaBtn, purchasing && { opacity: 0.6 }]}
          onPress={handlePurchase}
          disabled={purchasing || !selected}
        >
          {purchasing
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.ctaTxt}>Start Pro</Text>
          }
        </TouchableOpacity>
        <TouchableOpacity onPress={handleRestore} disabled={purchasing}>
          <Text style={styles.restoreTxt}>Restore purchases</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  scroll: { padding: 24, paddingBottom: 8 },
  closeBtn: { alignSelf: 'flex-end', width: 32, height: 32, borderRadius: 16, backgroundColor: CARD, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  closeTxt: { color: MUTED, fontSize: 14 },
  eyebrow: { fontSize: 12, fontWeight: '700', color: ACCENT, letterSpacing: 3, marginBottom: 10 },
  headline: { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: -1, lineHeight: 42, marginBottom: 32 },
  features: { gap: 16, marginBottom: 32 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  featureIcon: { fontSize: 26, width: 36 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 2 },
  featureDesc: { fontSize: 13, color: MUTED, lineHeight: 18 },
  packages: { gap: 10, marginBottom: 8 },
  pkg: { borderWidth: 1, borderColor: BORDER, borderRadius: 13, padding: 16, backgroundColor: CARD },
  pkgSelected: { borderColor: ACCENT, backgroundColor: 'rgba(200,240,101,0.06)' },
  pkgTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 3 },
  pkgPrice: { fontSize: 13, color: MUTED },
  bottom: { paddingHorizontal: 24, gap: 12 },
  ctaBtn: { backgroundColor: ACCENT, borderRadius: 13, height: 52, alignItems: 'center', justifyContent: 'center' },
  ctaTxt: { fontSize: 16, fontWeight: '800', color: '#000' },
  restoreTxt: { fontSize: 13, color: DIM, textAlign: 'center' },
})