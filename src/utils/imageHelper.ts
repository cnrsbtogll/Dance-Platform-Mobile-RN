import { Image } from 'react-native';

// Map of image filenames to local assets
const LESSON_IMAGES_MAP: { [key: string]: any } = {
  // Salsa images
  'salsa-1.jpeg': require('../../assets/lessons/salsa/salsa-1.jpeg'),
  'salsa-2.jpeg': require('../../assets/lessons/salsa/salsa-2.jpeg'),
  'salsa-3.jpeg': require('../../assets/lessons/salsa/salsa-3.jpeg'),
  'salsa-4.jpeg': require('../../assets/lessons/salsa/salsa-4.jpeg'),
  // Bachata images
  'bachata-1.jpeg': require('../../assets/lessons/bachata/bachata-1.jpeg'),
  'bachata-2.jpeg': require('../../assets/lessons/bachata/bachata-2.jpeg'),
  'bachata-3.jpeg': require('../../assets/lessons/bachata/bachata-3.jpeg'),
  'bachata-4.jpeg': require('../../assets/lessons/bachata/bachata-4.jpeg'),
  // Kizomba images
  'kizomba-1.jpeg': require('../../assets/lessons/kizomba/kizomba-1.jpeg'),
  'kizomba-2.jpeg': require('../../assets/lessons/kizomba/kizomba-2.jpeg'),
  'kizomba-3.jpeg': require('../../assets/lessons/kizomba/kizomba-3.jpeg'),
  'kizomba-4.jpeg': require('../../assets/lessons/kizomba/kizomba-4.jpeg'),
  // Tango images
  'tango-1.jpeg': require('../../assets/lessons/tango/tango-1.jpeg'),
  'tango-2.jpeg': require('../../assets/lessons/tango/tango-2.jpeg'),
  'tango-3.jpeg': require('../../assets/lessons/tango/tango-3.jpeg'),
  'tango-4.jpeg': require('../../assets/lessons/tango/tango-4.jpeg'),
  // Modern Dance images
  'moderndance-1.jpeg': require('../../assets/lessons/moderndance/moderndance-1.jpeg'),
  'moderndance-2.jpeg': require('../../assets/lessons/moderndance/moderndance-2.jpeg'),
  'moderndance-3.jpeg': require('../../assets/lessons/moderndance/moderndance-3.jpeg'),
  'moderndance-4.jpeg': require('../../assets/lessons/moderndance/moderndance-4.jpeg'),
};

/**
 * Get image source for lesson images
 * Supports both local assets (by filename) and URLs
 */
export const getLessonImageSource = (imageUrl: string) => {
  // If it's a URL (starts with http), return as URI
  if (imageUrl.startsWith('http')) {
    return { uri: imageUrl };
  }
  
  // If it's a local asset filename, get from map
  const image = LESSON_IMAGES_MAP[imageUrl];
  if (image) {
    return image;
  }
  
  // Fallback: return as URI (for backward compatibility)
  return { uri: imageUrl };
};

/**
 * Get image source for any image (supports both local assets and URLs)
 */
export const getImageSource = (image: any) => {
  if (typeof image === 'string') {
    // Check if it's a URL
    if (image.startsWith('http')) {
      return { uri: image };
    }
    // Check if it's a local asset filename
    const localImage = LESSON_IMAGES_MAP[image];
    if (localImage) {
      return localImage;
    }
    // Fallback: return as URI
    return { uri: image };
  }
  // If it's already a require() result, return as is
  return image;
};

