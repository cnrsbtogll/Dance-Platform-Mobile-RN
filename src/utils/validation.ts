/**
 * Validates a phone number based on a standard format.
 * - Allows an optional leading '+'
 * - Allows spaces and parentheses (which are stripped before length check)
 * - Requires between 10 and 15 digits
 * 
 * @param phone The phone number string to validate
 * @returns boolean true if valid, false otherwise
 */
export const isValidPhoneNumber = (phoneNumber: string): boolean => {
  // Allow leading plus and digits only
  const phoneRegex = /^\+?[0-9()\-\s]{10,20}$/;
  
  if (!phoneRegex.test(phoneNumber)) {
    return false;
  }

  // Remove whitespace and special chars for length check
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // Phone strings should have between 10 and 15 digits
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
};

export const getPhoneMask = (countryCode: string | undefined): any[] => {
  switch (countryCode) {
    case 'TR':
      return ['+', '9', '0', ' ', /\d/, /\d/, /\d/, ' ', /\d/, /\d/, /\d/, ' ', /\d/, /\d/, ' ', /\d/, /\d/];
    case 'DE':
      return ['+', '4', '9', ' ', /\d/, /\d/, /\d/, ' ', /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/];
    case 'US':
    case 'CA':
      return ['+', '1', ' ', '(', /\d/, /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/];
    case 'GB':
      return ['+', '4', '4', ' ', /\d/, /\d/, /\d/, /\d/, ' ', /\d/, /\d/, /\d/, /\d/, /\d/, /\d/];
    case 'FR':
      return ['+', '3', '3', ' ', /\d/, ' ', /\d/, /\d/, ' ', /\d/, /\d/, ' ', /\d/, /\d/, ' ', /\d/, /\d/];
    case 'IT':
      return ['+', '3', '9', ' ', /\d/, /\d/, /\d/, ' ', /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/];
    case 'ES':
      return ['+', '3', '4', ' ', /\d/, /\d/, /\d/, ' ', /\d/, /\d/, /\d/, ' ', /\d/, /\d/, /\d/];
    case 'NL':
      return ['+', '3', '1', ' ', /\d/, /\d/, ' ', /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/, /\d/];
    case 'JP':
      return ['+', '8', '1', ' ', /\d/, /\d/, ' ', /\d/, /\d/, /\d/, /\d/, ' ', /\d/, /\d/, /\d/, /\d/];
    case 'AU':
      return ['+', '6', '1', ' ', /\d/, ' ', /\d/, /\d/, /\d/, /\d/, ' ', /\d/, /\d/, /\d/, /\d/];
    default:
       // Generic mask for up to 15 digits
       const genericMask = ['+'];
       for (let i = 0; i < 15; i++) {
          genericMask.push(/\d/ as any);
       }
       return genericMask as any[];
  }
};
