import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db, PRIMARY_ADMIN_UID, ADMIN_EMAILS } from '../lib/firebase';
import { UserProfile } from '../types';
import { generateMemberId } from '../lib/utils';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<{ user: FirebaseUser; isNewOrIncomplete: boolean }>;
  completeProfile: (name: string, whatsapp: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  register: (name: string, email: string, pass: string, whatsapp: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Derived admin verification
  const isUserAdmin = (user: FirebaseUser | null, prof?: UserProfile | null) => {
    if (!user) return false;
    if (user.uid === PRIMARY_ADMIN_UID) return true;
    if (user.email && ADMIN_EMAILS.map(e => e.toLowerCase()).includes(user.email.toLowerCase())) return true;
    if (prof?.role === 'admin') return true;
    return false;
  };

  const isAdmin = Boolean(isUserAdmin(currentUser, profile));

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const isMaster = user.uid === PRIMARY_ADMIN_UID || (user.email && ADMIN_EMAILS.map(e => e.toLowerCase()).includes(user.email.toLowerCase()));

        // Listen for real-time changes to profile (e.g. points update by admin, etc.)
        unsubscribeDoc = onSnapshot(
          userRef,
          async (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data();
              // Auto-grant admin role in memory if UID or email matches admin
              const effectiveRole = isMaster ? 'admin' : (data.role || 'customer');
              setProfile({
                id: user.uid,
                name: data.name || user.displayName || 'Member CDC',
                email: user.email || data.email || '',
                whatsapp: data.whatsapp || '',
                memberId: data.memberId || 'CDC-000000',
                role: effectiveRole,
                points: Number(data.points) || 0,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : (data.updatedAt || new Date().toISOString()),
              });
            } else {
              // Document doesn't exist yet (e.g. primary admin logging in first time or special flow)
              const newProfile: UserProfile = {
                id: user.uid,
                name: user.displayName || (isMaster ? 'Admin CDC Gatsu' : 'Pelanggan CDC'),
                email: user.email || '',
                whatsapp: isMaster ? '082379474173' : '',
                memberId: generateMemberId(),
                role: isMaster ? 'admin' : 'customer',
                points: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };

              try {
                await setDoc(userRef, {
                  ...newProfile,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                });
                setProfile(newProfile);
              } catch (err) {
                console.warn('Could not auto-create profile doc:', err);
                setProfile(newProfile);
              }
            }
            setLoading(false);
          },
          (err) => {
            console.warn('Profile snapshot listener note:', err.message);
            setLoading(false);
          }
        );
      } else {
        if (unsubscribeDoc) {
          unsubscribeDoc();
          unsubscribeDoc = null;
        }
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);

      let isNewOrIncomplete = false;
      const isMaster = user.uid === PRIMARY_ADMIN_UID || (user.email && ADMIN_EMAILS.map(e => e.toLowerCase()).includes(user.email.toLowerCase()));

      if (!snap.exists()) {
        isNewOrIncomplete = !isMaster;
        const newProfile: UserProfile = {
          id: user.uid,
          name: user.displayName || (isMaster ? 'Admin CDC Gatsu' : 'Member CDC'),
          email: user.email || '',
          whatsapp: isMaster ? '082379474173' : '',
          memberId: generateMemberId(),
          role: isMaster ? 'admin' : 'customer',
          points: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userRef, {
          ...newProfile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setProfile(newProfile);
      } else {
        const data = snap.data();
        if (!isMaster && (!data.whatsapp || !data.whatsapp.trim())) {
          isNewOrIncomplete = true;
        }
      }
      return { user, isNewOrIncomplete };
    } finally {
      setLoading(false);
    }
  };

  const completeProfile = async (name: string, whatsapp: string) => {
    if (!auth.currentUser) throw new Error('Pengguna belum masuk');
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userRef, {
      name: name.trim(),
      whatsapp: whatsapp.trim(),
      updatedAt: serverTimestamp(),
    });
    await refreshProfile();
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const register = async (name: string, email: string, pass: string, whatsapp: string) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      const uid = cred.user.uid;
      const isMaster = uid === PRIMARY_ADMIN_UID || (email && ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email.trim().toLowerCase()));
      const memberId = generateMemberId();

      const newUserData: UserProfile = {
        id: uid,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        whatsapp: whatsapp.trim(),
        memberId,
        role: isMaster ? 'admin' : 'customer',
        points: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, {
        ...newUserData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setProfile(newUserData);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
    setCurrentUser(null);
  };

  const refreshProfile = async () => {
    if (!currentUser) return;
    try {
      const snap = await getDoc(doc(db, 'users', currentUser.uid));
      if (snap.exists()) {
        const data = snap.data();
        const isMaster = currentUser.uid === PRIMARY_ADMIN_UID || (currentUser.email && ADMIN_EMAILS.map(e => e.toLowerCase()).includes(currentUser.email.toLowerCase()));
        setProfile({
          id: currentUser.uid,
          name: data.name,
          email: data.email,
          whatsapp: data.whatsapp,
          memberId: data.memberId,
          role: isMaster ? 'admin' : (data.role || 'customer'),
          points: Number(data.points) || 0,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        });
      }
    } catch (e) {
      console.error('Error refreshing profile:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        profile,
        loading,
        isAdmin,
        login,
        loginWithGoogle,
        completeProfile,
        resetPassword,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
