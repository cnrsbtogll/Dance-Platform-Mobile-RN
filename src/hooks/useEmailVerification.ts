import { useState, useEffect, useCallback } from 'react';
import { auth } from '../services/firebase/config';
import { onAuthStateChanged, reload } from 'firebase/auth';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Determines whether the email verification banner should be shown.
 *
 * Rules:
 * - User must be authenticated (have an account)
 * - Authentication provider must be email/password (not Google/social)
 * - email must NOT be verified yet
 *
 * Returns:
 * - shouldShowBanner: boolean - whether to render the banner
 * - recheckVerification: () => void - call after user taps "I verified" or on app foreground
 */
export const useEmailVerification = () => {
  const { user } = useAuthStore();
  const [isEmailVerified, setIsEmailVerified] = useState<boolean | null>(null);
  const [isEmailPasswordUser, setIsEmailPasswordUser] = useState(false);

  const recheckVerification = useCallback(async () => {
    if (!auth?.currentUser) return;
    try {
      await reload(auth.currentUser);
      setIsEmailVerified(auth.currentUser.emailVerified);
    } catch {
      // Silently ignore reload errors (offline etc.)
    }
  }, []);

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setIsEmailVerified(null);
        setIsEmailPasswordUser(false);
        return;
      }

      // Check if logged in via email/password (not social)
      const providers = firebaseUser.providerData.map((p) => p.providerId);
      const isEmailProvider = providers.includes('password');
      setIsEmailPasswordUser(isEmailProvider);

      if (isEmailProvider) {
        // Reload to get fresh emailVerified state from Firebase
        try {
          await reload(firebaseUser);
        } catch {
          // Ignore
        }
        setIsEmailVerified(auth.currentUser?.emailVerified ?? false);
      } else {
        // Social login users are always considered "verified"
        setIsEmailVerified(true);
      }
    });

    return unsubscribe;
  }, []);

  // Also re-check when user object changes (e.g. after profile refresh)
  useEffect(() => {
    if (user && isEmailPasswordUser) {
      recheckVerification();
    }
  }, [user?.id]);

  const shouldShowBanner =
    !!user &&
    isEmailPasswordUser &&
    isEmailVerified === false;

  return { shouldShowBanner, recheckVerification, isEmailVerified };
};
