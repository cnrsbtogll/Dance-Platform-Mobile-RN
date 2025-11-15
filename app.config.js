/**
 * Expo App Configuration
 * Dynamic configuration based on APP_BRAND environment variable
 * 
 * Usage:
 * - Codecanyon: APP_BRAND=codecanyon expo start
 * - Feriha: APP_BRAND=feriha expo start
 * 
 * Default: codecanyon (for codecanyon-template branch)
 */

const APP_BRAND = process.env.APP_BRAND || process.env.EXPO_PUBLIC_APP_BRAND || 'codecanyon';

// Brand-specific configurations
const brands = {
  codecanyon: {
    name: 'Dancer Community',
    slug: 'dancer-community',
    icon: './assets/icon.png',
    bundleIdentifier: 'com.dancercommunity.app',
    package: 'com.dancercommunity.app',
    adaptiveIcon: './assets/adaptive-icon.png',
    splash: './assets/splash.png',
    favicon: './assets/favicon.png',
  },
  feriha: {
    name: 'Feriha Dance Platform',
    slug: 'feriha-dance-platform',
    icon: './assets/icon-feriha.png',
    bundleIdentifier: 'com.feriha.danceplatform',
    package: 'com.feriha.danceplatform',
    adaptiveIcon: './assets/adaptive-icon-feriha.png',
    splash: './assets/splash-feriha.png',
    favicon: './assets/favicon-feriha.png',
  },
};

const currentBrand = brands[APP_BRAND] || brands.codecanyon;

// Log in development
if (process.env.NODE_ENV !== 'production') {
  console.log('[App Config] Using brand:', APP_BRAND);
  console.log('[App Config] App name:', currentBrand.name);
}

module.exports = {
  expo: {
    name: currentBrand.name,
    slug: currentBrand.slug,
    version: '1.0.0',
    orientation: 'portrait',
    icon: currentBrand.icon,
    userInterfaceStyle: 'light',
    splash: {
      image: currentBrand.splash,
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: currentBrand.bundleIdentifier,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: currentBrand.adaptiveIcon,
        backgroundColor: '#ffffff',
      },
      package: currentBrand.package,
    },
    web: {
      favicon: currentBrand.favicon,
    },
  },
};

