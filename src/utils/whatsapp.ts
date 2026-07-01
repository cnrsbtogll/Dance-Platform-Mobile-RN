import { Linking, Platform } from 'react-native';

const cleanPhone = (phone: string): string => {
  let numericPhone = phone.replace(/\D/g, '');
  
  // If Turkey code is used (+90) and the user has a leading zero in the mobile part (e.g. +90 0555...):
  // numericPhone starts with 9005... -> clean to 905...
  if (numericPhone.startsWith('9005')) {
    numericPhone = '905' + numericPhone.substring(4);
  } else if (numericPhone.startsWith('05')) {
    numericPhone = '905' + numericPhone.substring(2);
  } else if (numericPhone.startsWith('5')) {
    numericPhone = '90' + numericPhone;
  }
  return numericPhone;
};

const safeEncode = (text: string): string => {
  return encodeURIComponent(text)
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
};

export const openWhatsApp = async (phone: string, message: string) => {
  const numericPhone = cleanPhone(phone);
  const encoded = safeEncode(message);
  const universal = `https://wa.me/${numericPhone}?text=${encoded}`;
  const scheme = `whatsapp://send?phone=${numericPhone}&text=${encoded}`;

  if (Platform.OS === 'ios') {
    // iOS: Open the universal link directly.
    // If WhatsApp or WhatsApp Business is installed, iOS will open it directly.
    // This avoids using a custom URL scheme check which requires LSApplicationQueriesSchemes.
    // (A native Plist change cannot be deployed via OTA updates).
    try {
      await Linking.openURL(universal);
    } catch (error) {
      console.error("Failed to open WhatsApp via Universal Link on iOS:", error);
    }
  } else {
    // Android: Use custom scheme if supported, fallback to universal
    try {
      const canOpen = await Linking.canOpenURL(scheme);
      if (canOpen) {
        await Linking.openURL(scheme);
      } else {
        await Linking.openURL(universal);
      }
    } catch (error) {
      try {
        await Linking.openURL(universal);
      } catch (innerError) {
        console.error("Failed to open WhatsApp on Android:", innerError);
      }
    }
  }
};