import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  householdId: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, householdName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function getOrCreateHousehold(user: User): Promise<string> {
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (userDoc.exists()) {
    const data = userDoc.data();
    return data.householdId as string;
  }

  const householdId = doc(db, 'households', 'placeholder').id;
  const householdRef = doc(db, 'households', householdId);
  await setDoc(householdRef, {
    name: 'My Household',
    members: [user.uid],
    inviteCode: generateInviteCode(),
    createdAt: serverTimestamp(),
    createdBy: user.uid,
  });

  await setDoc(doc(db, 'users', user.uid), {
    householdId,
    email: user.email,
    displayName: user.displayName,
    createdAt: serverTimestamp(),
  });

  return householdId;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const hid = await getOrCreateHousehold(firebaseUser);
          setHouseholdId(hid);
        } catch (err) {
          console.error('Failed to get/create household:', err);
        }
      } else {
        setHouseholdId(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, householdName?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    const householdId = doc(db, 'households', 'placeholder').id;
    const householdRef = doc(db, 'households', householdId);
    await setDoc(householdRef, {
      name: householdName || 'My Household',
      members: [cred.user.uid],
      inviteCode: generateInviteCode(),
      createdAt: serverTimestamp(),
      createdBy: cred.user.uid,
    });

    await setDoc(doc(db, 'users', cred.user.uid), {
      householdId,
      email: cred.user.email,
      displayName: cred.user.displayName,
      createdAt: serverTimestamp(),
    });

    setHouseholdId(householdId);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const hid = await getOrCreateHousehold(cred.user);
    setHouseholdId(hid);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setHouseholdId(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, householdId, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
