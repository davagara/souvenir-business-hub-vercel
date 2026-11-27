import { doc, onSnapshot } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DEFAULT_STOREFRONT_SETTINGS } from '../constants/catalogDefaults';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';
import type { StorefrontSettings } from '../types/models';

interface StorefrontContextValue {
  settings: StorefrontSettings;
  loading: boolean;
}

const StorefrontContext = createContext<StorefrontContextValue | undefined>(undefined);

export function StorefrontProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StorefrontSettings>(DEFAULT_STOREFRONT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const path = 'business_settings/storefront';
    const ref = doc(db, 'business_settings', 'storefront');
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Partial<StorefrontSettings>;
          setSettings({
            ...DEFAULT_STOREFRONT_SETTINGS,
            ...data,
            businessName: data.businessName || DEFAULT_STOREFRONT_SETTINGS.businessName,
            logoUrl: data.logoUrl || DEFAULT_STOREFRONT_SETTINGS.logoUrl,
          });
        } else {
          setSettings(DEFAULT_STOREFRONT_SETTINGS);
        }
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
    return () => unsubscribe();
  }, []);

  return (
    <StorefrontContext.Provider value={{ settings, loading }}>
      {children}
    </StorefrontContext.Provider>
  );
}

export function useStorefront(): StorefrontContextValue {
  const ctx = useContext(StorefrontContext);
  if (!ctx) {
    throw new Error('useStorefront must be used within StorefrontProvider');
  }
  return ctx;
}
