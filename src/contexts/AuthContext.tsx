import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  BOOTSTRAPPED_PRIMARY_OWNER_EMAIL,
  BOOTSTRAPPED_SECONDARY_OWNER_EMAIL,
} from '../constants/catalogDefaults';
import { auth, db, googleProvider } from '../lib/firebase';
import { syncOwnerUserProfile } from '../services/firestoreService';

interface AuthContextValue {
  user: User | null;
  isAuthorizedOwner: boolean;
  authLoading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function checkIsAuthorizedOwner(firebaseUser: User): Promise<boolean> {
  if (!firebaseUser.email || !firebaseUser.emailVerified) {
    return false;
  }

  const emailLower = firebaseUser.email.toLowerCase();
  if (
    emailLower === BOOTSTRAPPED_PRIMARY_OWNER_EMAIL.toLowerCase() ||
    emailLower === BOOTSTRAPPED_SECONDARY_OWNER_EMAIL.toLowerCase()
  ) {
    return true;
  }

  try {
    const opsSnap = await getDoc(doc(db, 'business_settings', 'operations'));
    if (opsSnap.exists()) {
      const data = opsSnap.data();
      const primary = typeof data.primaryOwnerEmail === 'string' ? data.primaryOwnerEmail.toLowerCase() : '';
      const secondary =
        typeof data.secondaryOwnerEmail === 'string' ? data.secondaryOwnerEmail.toLowerCase() : '';
      if (emailLower === primary || (secondary && emailLower === secondary)) {
        return true;
      }
    }
  } catch {
    // Non-owners receive permission-denied on operations doc; return false cleanly
    return false;
  }

  return false;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthorizedOwner, setIsAuthorizedOwner] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthLoading(true);
      setAuthError(null);

      if (!firebaseUser) {
        setUser(null);
        setIsAuthorizedOwner(false);
        setAuthLoading(false);
        return;
      }

      setUser(firebaseUser);
      const authorized = await checkIsAuthorizedOwner(firebaseUser);
      setIsAuthorizedOwner(authorized);

      if (authorized && firebaseUser.email) {
        try {
          await syncOwnerUserProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          });
          // Verify token with backend session check (non-blocking)
          const idToken = await firebaseUser.getIdToken();
          await fetch('/api/admin/verify', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          });
        } catch (err) {
          console.warn('Owner profile sync warning:', err);
        }
      } else {
        setAuthError(
          'Akun Google ini tidak terdaftar sebagai pemilik bisnis yang berwenang. Hanya 2 akun pemilik resmi yang diizinkan mengakses dasbor admin.'
        );
      }

      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal masuk dengan Google.';
      if (!message.includes('popup-closed-by-user')) {
        setAuthError('Proses login Google gagal. Pastikan pop-up diizinkan dan coba lagi.');
      }
    }
  };

  const logout = async () => {
    setAuthError(null);
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthorizedOwner,
        authLoading,
        authError,
        signInWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
