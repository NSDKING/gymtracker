import Purchases, { LOG_LEVEL, PurchasesPackage } from 'react-native-purchases'
import { useStore } from '../store'
import { Platform } from 'react-native'

const API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_KEY!
const OFFERING_ID = 'pro'
const ENTITLEMENT_ID = 'pro'

export function initRevenueCat() {
  if (Platform.OS !== 'ios') return
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN)
  Purchases.configure({ apiKey: API_KEY_IOS })
}

export async function checkProStatus() {
  try {
    const info = await Purchases.getCustomerInfo()
    const isPro = typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined'
    useStore.getState().setIsPro(isPro)
    return isPro
  } catch (e) {
    console.warn('RevenueCat error', e)
    return false
  }
}

export async function fetchOfferings() {
  try {
    const offerings = await Purchases.getOfferings()
    const offering = offerings.all[OFFERING_ID] ?? offerings.current
    return offering?.availablePackages ?? []
  } catch (e) {
    console.warn('RevenueCat offerings error', e)
    return []
  }
}

export async function getOffering() {
  try {
    const offerings = await Purchases.getOfferings()
    return offerings.all[OFFERING_ID] ?? offerings.current ?? null
  } catch (e) {
    console.warn('RevenueCat offerings error', e)
    return null
  }
}

export async function purchasePackage(pkg: PurchasesPackage) {
  const { customerInfo } = await Purchases.purchasePackage(pkg)
  const isPro = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined'
  useStore.getState().setIsPro(isPro)
  return isPro
}

export async function restorePurchases() {
  const info = await Purchases.restorePurchases()
  const isPro = typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined'
  useStore.getState().setIsPro(isPro)
  return isPro
}
