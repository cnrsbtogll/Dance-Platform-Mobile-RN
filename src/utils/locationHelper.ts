export const safeReverseGeocode = async (latitude: number, longitude: number) => {
  try {
    const Location = require('expo-location');
    const geoCoded = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (geoCoded && geoCoded.length > 0) {
      const { customCity, customCountry } = normalizeCity(geoCoded[0]);
      return { city: customCity, country: customCountry };
    }
    return null;
  } catch (error) {
    console.warn('Geocoding error:', error);
    return null;
  }
};

const normalizeCity = (geoItem: any) => {
  let customCity = geoItem.region || geoItem.city || geoItem.subregion;
  let customCountry = geoItem.country || 'Türkiye';
  
  if (customCity && typeof customCity === 'string') {
    customCity = customCity.replace(/ Province/i, '').trim();
    customCity = customCity.replace(/ İli/i, '').trim();
  }
  
  // Quick normalizations for Turkey specific names
  if (customCity?.includes('Istanbul') || customCity?.includes('İstanbul')) {
    customCity = 'İstanbul';
  } else if (customCity?.includes('Izmir') || customCity?.includes('İzmir')) {
    customCity = 'İzmir';
  } else if (customCity?.includes('Ankara')) {
    customCity = 'Ankara';
  }
  
  return { customCity, customCountry };
};
