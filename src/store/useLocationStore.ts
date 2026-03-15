import { create } from 'zustand';
import { FirestoreService, LocationData } from '../services/firebase/firestore';

interface LocationState {
  locations: LocationData[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  fetchLocations: () => Promise<void>;
  getCitiesForCountry: (countryCodeOrName: string) => string[];
  getAllCountryNames: () => string[];
}

export const useLocationStore = create<LocationState>((set, get) => ({
  locations: [],
  isLoading: false,
  isLoaded: false,
  error: null,

  fetchLocations: async () => {
    // Prevent refetch if already loaded
    if (get().isLoaded || get().isLoading) return;

    set({ isLoading: true, error: null });
    try {
      const data = await FirestoreService.getLocations();
      
      // Active filters only
      const activeLocations = data.filter(loc => loc.isActive !== false);

      set({ locations: activeLocations, isLoaded: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  getCitiesForCountry: (countryCodeOrName: string) => {
    const locs = get().locations;
    const country = locs.find(c => c.name === countryCodeOrName || c.code === countryCodeOrName);
    return country?.cities || [];
  },

  getAllCountryNames: () => {
    return get().locations.map(c => c.name);
  }
}));
