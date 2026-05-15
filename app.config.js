const IS_DEV = process.env.APP_VARIANT === 'development'

export default {
  expo: {
    name: IS_DEV ? 'Repd (Dev)' : 'Repd',
    slug: 'repd',
    version: '1.5.0',
    orientation: 'portrait',
    scheme: IS_DEV ? 'gymtracker' : 'repd',
    icon: './assets/images/iconV1.png',
    splash: {
      image: './assets/images/splashV1.png',
      resizeMode: 'contain',
      backgroundColor: '#000000',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: IS_DEV ? 'com.yourname.repd.dev' : 'com.yourname.repd',
      usesAppleSignIn: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },      
    android: {
      package: IS_DEV ? 'com.yourname.repd.dev' : 'com.yourname.repd',
    },
    owner: 'dimis',
    extra: {
      eas: {
        projectId: '93bab97e-1442-460d-a1ef-4cd08a6a04a9',
      },
    },
  },
}
