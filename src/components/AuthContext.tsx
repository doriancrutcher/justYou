import React, { createContext, useContext, useEffect, useState } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';
import { Analytics } from '../mixpanel';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      // Track user authentication state changes
      if (user) {
        // Identify user in Mixpanel
        Analytics.identify(user.uid, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          lastSignInTime: user.metadata.lastSignInTime,
          creationTime: user.metadata.creationTime
        });
        
        // Track successful sign in
        Analytics.trackEvent('User Signed In', {
          method: 'Google',
          userId: user.uid,
          email: user.email
        });
      } else {
        // Track sign out
        Analytics.trackEvent('User Signed Out');
        Analytics.reset();
      }
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      
      // Track sign in attempt
      Analytics.trackEvent('Sign In Attempt', {
        method: 'Google'
      });
    } catch (error) {
      // Track sign in error
      Analytics.trackError('Sign In Error', {
        method: 'Google',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      
      // Track sign out attempt
      Analytics.trackEvent('Sign Out Attempt');
      
      window.location.reload();
    } catch (error) {
      // Track sign out error
      Analytics.trackError('Sign Out Error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}; 