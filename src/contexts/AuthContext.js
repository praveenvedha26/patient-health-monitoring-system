import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, firestore } from '../config/firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const login = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      setCurrentUser(user);
      const userDoc = await getDoc(doc(firestore, 'users', user.uid));
      if (userDoc.exists()) {
        setUserRole(userDoc.data().role);
      } else {
        setUserRole(null);
        setAuthError("No user role found. Please check Firestore.");
      }
      setLoading(false);
      return { user, role: userDoc?.data().role || null };
    } catch (err) {
      setCurrentUser(null);
      setUserRole(null);
      setLoading(false);
      setAuthError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    setUserRole(null);
    setCurrentUser(null);
    await signOut(auth);
  };

  useEffect(() => {
    setLoading(true);
    setAuthError(null);
    const unsubscribe = onAuthStateChanged(auth, async user => {
      setCurrentUser(user);

      if (user) {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          } else {
            setUserRole(null);
            setAuthError("No user role found. Please check Firestore.");
          }
        } catch (err) {
          setUserRole(null);
          setAuthError("Failed to fetch user role: " + err.message);
        }
      } else {
        setUserRole(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{width: "100%", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24}}>
        Loading authentication...
      </div>
    );
  }
  if (authError) {
    return (
      <div style={{width: "100%", minHeight: "100vh", color: "red", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexDirection: "column"}}>
        Authentication Error:<br/>{authError}
      </div>
    );
  }

  const value = {
    currentUser,
    userRole,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
