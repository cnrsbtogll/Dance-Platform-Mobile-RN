import { useState, useEffect } from 'react';
import { FirestoreService } from '../services/firebase/firestore';
import { DANCE_STYLES } from '../utils/constants';

/**
 * Fetches dance styles from the Firestore `danceStyles` collection.
 * Falls back to the local DANCE_STYLES constant if the collection is
 * empty or unreachable (offline / first-load).
 */
export const useDanceStyles = () => {
  const [danceStyles, setDanceStyles] = useState<string[]>([...DANCE_STYLES]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    FirestoreService.getDanceStyles()
      .then((styles) => {
        if (!cancelled) {
          setDanceStyles(styles.length > 0 ? styles : [...DANCE_STYLES]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { danceStyles, loading };
};
