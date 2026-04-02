import Purchases, { LOG_LEVEL, PurchasesPackage } from 'react-native-purchases'
import { useStore } from '../store'
import { Platform } from 'react-native'

export function initRevenueCat() {
  if (Platform.OS !== 'ios') return
  Purchases.setLogLevel(LOG_LEVEL.WARN)
  Purchases.configure({ apiKey: "appl_WhBTpOynKphXkbILxQAelKgIYpE" })
}

export async function checkProStatus() {
  try {
    const info = await Purchases.getCustomerInfo()
    const isPro = typeof info.entitlements.active['pro'] !== 'undefined'
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
    return offerings.current?.availablePackages ?? []
  } catch (e) {
    console.warn('RevenueCat offerings error', e)
    return []
  }
}

export async function purchasePackage(pkg: PurchasesPackage) {
  const { customerInfo } = await Purchases.purchasePackage(pkg)
  const isPro = typeof customerInfo.entitlements.active['pro'] !== 'undefined'
  useStore.getState().setIsPro(isPro)
  return isPro
}

export async function restorePurchases() {
  const info = await Purchases.restorePurchases()
  const isPro = typeof info.entitlements.active['pro'] !== 'undefined'
  useStore.getState().setIsPro(isPro)
  return isPro
}