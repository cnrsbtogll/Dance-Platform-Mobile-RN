/**
 * Maps Firebase Auth error codes to translation keys
 * @param errorCode - The Firebase error code (e.g., 'auth/invalid-email')
 * @returns The translation key for the error message
 */
export const getFirebaseErrorKey = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'auth.errors.invalidEmail';
    case 'auth/user-disabled':
      return 'auth.errors.userDisabled';
    case 'auth/user-not-found':
      return 'auth.errors.userNotFound';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'auth.errors.wrongPassword';
    case 'auth/email-already-in-use':
      return 'auth.errors.emailInUse';
    case 'auth/operation-not-allowed':
      return 'auth.errors.operationNotAllowed';
    case 'auth/weak-password':
      return 'auth.errors.weakPassword';
    case 'auth/too-many-requests':
      return 'auth.errors.tooManyRequests';
    case 'auth/network-request-failed':
      return 'auth.errors.networkRequestFailed';
    case 'auth/requires-recent-login':
      return 'auth.errors.requiresRecentLogin';
    default:
      return 'auth.errors.unknown';
  }
};
