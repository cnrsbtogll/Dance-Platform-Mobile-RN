import { Linking, Platform } from 'react-native';

export const openWhatsApp = async (phone: string, message: string) => {
  const numericPhone = phone.replace(/\D/g, '');
  const encoded = encodeURIComponent(message);
  const universal = `https://wa.me/${numericPhone}?text=${encoded}`;
  const scheme = `whatsapp://send?phone=${numericPhone}&text=${encoded}`;

  const url = Platform.OS === 'ios' ? scheme : universal;

  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  } else {
    await Linking.openURL(universal);
  }
};