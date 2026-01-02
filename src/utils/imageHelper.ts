import { Image } from 'react-native';
import { AVATARS } from './avatars';

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
  
  // Mappings for Firebase paths
  'kurs1.jpg': require('../../assets/lessons/salsa/salsa-1.jpeg'),
  'kurs3.jpg': require('../../assets/lessons/bachata/bachata-3.jpeg'),
  'kurs5.jpg': require('../../assets/lessons/kizomba/kizomba-1.jpeg'),
  'kurs6.jpg': require('../../assets/lessons/bachata/bachata-2.jpeg'),
  'kurs7.jpg': require('../../assets/lessons/salsa/salsa-3.jpeg'),
  'kurs8.jpg': require('../../assets/lessons/salsa/salsa-4.jpeg'),
  'kurs9.jpg': require('../../assets/lessons/tango/tango-1.jpeg'),
  
  // Full paths mapping for Firebase
  '/assets/images/dance/kurs1.jpg': require('../../assets/lessons/salsa/salsa-1.jpeg'),
  '/assets/images/dance/kurs3.jpg': require('../../assets/lessons/bachata/bachata-3.jpeg'),
  '/assets/images/dance/kurs5.jpg': require('../../assets/lessons/kizomba/kizomba-1.jpeg'),
  '/assets/images/dance/kurs6.jpg': require('../../assets/lessons/bachata/bachata-2.jpeg'),
  '/assets/images/dance/kurs7.jpg': require('../../assets/lessons/salsa/salsa-3.jpeg'),
  '/assets/images/dance/kurs8.jpg': require('../../assets/lessons/salsa/salsa-4.jpeg'),
  '/assets/images/dance/kurs9.jpg': require('../../assets/lessons/tango/tango-1.jpeg'),
  '/assets/placeholders/default-course-image.png': require('../../assets/lessons/salsa/salsa-1.jpeg'),
};

/**
 * Get image source for lesson images
 * Supports both local assets (by filename) and URLs
 * Falls back to category-based default image if specific image not found
 */
export const getLessonImageSource = (imageUrl: string, category: string = 'salsa') => {
  // If it's a URL (starts with http), return as URI
  if (imageUrl && imageUrl.startsWith('http')) {
    return { uri: imageUrl };
  }
  
  // Clean up input
  const cleanUrl = imageUrl ? imageUrl.trim() : '';
  
  // Check exact map first
  if (LESSON_IMAGES_MAP[cleanUrl]) {
    return LESSON_IMAGES_MAP[cleanUrl];
  }

  // Handle Firebase paths like /assets/images/dance/filename.jpg
  if (cleanUrl.includes('/')) {
    const filename = cleanUrl.split('/').pop();
    if (filename && LESSON_IMAGES_MAP[filename]) {
      return LESSON_IMAGES_MAP[filename];
    }
  }
  
  // Fallback by category
  const lowerCategory = (category || '').toLowerCase();
  if (lowerCategory.includes('bachata')) {
    return LESSON_IMAGES_MAP['bachata-1.jpeg'];
  } else if (lowerCategory.includes('tango')) {
    return LESSON_IMAGES_MAP['tango-1.jpeg'];
  } else if (lowerCategory.includes('kizomba')) {
    return LESSON_IMAGES_MAP['kizomba-1.jpeg'];
  } else if (lowerCategory.includes('modern')) {
    return LESSON_IMAGES_MAP['moderndance-1.jpeg'];
  } else if (lowerCategory.includes('vals')) {
    return LESSON_IMAGES_MAP['moderndance-2.jpeg']; // Vals için modern dans görseli
  }
  
  // Default fallback (Salsa)
  return LESSON_IMAGES_MAP['salsa-1.jpeg'];
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

/**
 * Get avatar source with default fallback
 * If avatar is empty or null, returns the first avatar from AVATARS array
 */
export const getAvatarSource = (avatar?: string | null, seed?: string): { uri: string } => {
  if (avatar && avatar.trim() !== '' && !avatar.startsWith('/')) {
    return { uri: avatar };
  }
  
  // Return the first avatar from AVATARS array as default
  return { 
    uri: AVATARS[0] || 'https://api.dicebear.com/7.x/adventurer/png?seed=default'
  };
};

