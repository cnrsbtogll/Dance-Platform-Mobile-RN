/**
 * Application Configuration
 * Controls feature flags and integrations based on brand
 * 
 * Brand Types:
 * - 'codecanyon': Template version with all features, no backend integrations
 * - 'feriha': Production version with selected features, Firebase and Stripe integrated
 */

export type Brand = 'codecanyon' | 'feriha';

export interface AppConfig {
  brand: Brand;
  features: {
    chat: boolean;
    notifications: boolean;
  };
  integrations: {
    firebase: boolean;
    stripe: boolean;
  };
  appName: string;
  appNameShort: string;
}

// Get brand from environment variable or default to 'codecanyon'
const getBrand = (): Brand => {
  const envBrand = process.env.APP_BRAND || process.env.EXPO_PUBLIC_APP_BRAND;
  if (envBrand === 'feriha' || envBrand === 'codecanyon') {
    return envBrand;
  }
  return 'codecanyon'; // Default for codecanyon-template branch
};

const brand = getBrand();

// Brand-specific configurations
const brandConfigs: Record<Brand, AppConfig> = {
  codecanyon: {
    brand: 'codecanyon',
    features: {
      chat: true,
      notifications: true,
    },
    integrations: {
      firebase: false,
      stripe: false,
    },
    appName: 'Dancer Community',
    appNameShort: 'Dancer',
  },
  feriha: {
    brand: 'feriha',
    features: {
      chat: false,
      notifications: false,
    },
    integrations: {
      firebase: true,
      stripe: true,
    },
    appName: 'Feriha Dance Platform',
    appNameShort: 'Feriha',
  },
};

// Export current app configuration
export const appConfig: AppConfig = brandConfigs[brand];

// Helper functions
export const isFeatureEnabled = (feature: keyof AppConfig['features']): boolean => {
  return appConfig.features[feature];
};

export const isIntegrationEnabled = (integration: keyof AppConfig['integrations']): boolean => {
  return appConfig.integrations[integration];
};

export const isBrand = (checkBrand: Brand): boolean => {
  return appConfig.brand === checkBrand;
};

// Log configuration in development
if (__DEV__) {
  console.log('[AppConfig] Current brand:', appConfig.brand);
  console.log('[AppConfig] Features:', appConfig.features);
  console.log('[AppConfig] Integrations:', appConfig.integrations);
}

