/**
 * Expo App Configuration
 * Dynamic configuration based on APP_BRAND environment variable
 * 
 * Usage:
 * - Codecanyon: APP_BRAND=codecanyon expo start
 * - Feriha: APP_BRAND=feriha expo start
 * 
 * Default: feriha (for feriha-production branch)
 */

require('dotenv').config();

const APP_BRAND = process.env.APP_BRAND || process.env.EXPO_PUBLIC_APP_BRAND || 'feriha';

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
    name: 'Feriha',
    slug: 'feriha-dance-platform',
    icon: './assets/icon-feriha.png',
    bundleIdentifier: 'com.feriha.danceplatform',
    package: 'com.feriha.danceplatform',
    adaptiveIcon: './assets/adaptive-icon-feriha.png',
    splash: './assets/splash-feriha.png',
    favicon: './assets/favicon-feriha.png',
  },
};

const currentBrand = brands[APP_BRAND] || brands.feriha;

// Log in development
if (process.env.NODE_ENV !== 'production') {
  console.log('[App Config] Using brand:', APP_BRAND);
  console.log('[App Config] App name:', currentBrand.name);
}

module.exports = {
  expo: {
    name: currentBrand.name,
    slug: currentBrand.slug,
    version: "1.0.2",
    runtimeVersion: "1.0.2",
    orientation: 'portrait',
    icon: currentBrand.icon,
    userInterfaceStyle: 'light',
    splash: {
      image: currentBrand.splash,
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    updates: {
      url: "https://u.expo.dev/4cd51a3f-fc74-4cfb-b923-8ce29df8b37d"
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: currentBrand.bundleIdentifier,
      config: {
        usesNonExemptEncryption: false
      },
      buildNumber: "1",
      googleServicesFile: "./GoogleService-Info.plist",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: currentBrand.adaptiveIcon,
        backgroundColor: '#ffffff',
      },
      package: currentBrand.package,
      versionCode: 1,
      googleServicesFile: "./google-services.json",
    },
    web: {
      favicon: currentBrand.favicon,
    },
    extra: {
      eas: {
        projectId: "4cd51a3f-fc74-4cfb-b923-8ce29df8b37d"
      }
    },
    plugins: [
      "@react-native-community/datetimepicker",
      "expo-apple-authentication",
      "@react-native-google-signin/google-signin",
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static"
          }
        }
      ],
      [
        "@stripe/stripe-react-native",
        {
          "merchantIdentifier": `merchant.${currentBrand.bundleIdentifier}`,
          "enableGooglePay": true
        }
      ],
      [
        "expo-notifications",
        {
          "icon": currentBrand.icon,
          "color": "#ffffff"
        }
      ]
    ],
  },
};

