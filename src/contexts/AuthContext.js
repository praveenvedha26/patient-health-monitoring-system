import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, firestore } from '../config/firebase';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Register new user
  const register = async (email, password, role, fullName) => {
    setLoading(true);
    setAuthError(null);
    try {
      // Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile with display name
      await updateProfile(user, {
        displayName: fullName
      });

      // Store user data in Firestore with role
      await setDoc(doc(firestore, 'users', user.uid), {
        fullName: fullName,
        email: email,
        role: role,
        createdAt: new Date().toISOString(),
        uid: user.uid
      });

      setCurrentUser(user);
      setUserRole(role);
      setLoading(false);

      console.log('User registered successfully:', { uid: user.uid, role });

      return { user, role };
    } catch (err) {
      setCurrentUser(null);
      setUserRole(null);
      setLoading(false);
      setAuthError(err.message);
      console.error('Registration error:', err);
      throw err;
    }
  };

  // Login existing user
  const login = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      setCurrentUser(user);

      // Fetch user role from Firestore
      const userDoc = await getDoc(doc(firestore, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserRole(userData.role);
        setLoading(false);
        console.log('Login successful:', { uid: user.uid, role: userData.role });
        return { user, role: userData.role };
      } else {
        setUserRole(null);
        setLoading(false);
        setAuthError("No user role found. Please contact support.");
        throw new Error("User document not found in Firestore");
      }
    } catch (err) {
      setCurrentUser(null);
      setUserRole(null);
      setLoading(false);
      setAuthError(err.message);
      console.error('Login error:', err);
      throw err;
    }
  };

  // Logout user
  const logout = async () => {
    try {
      setUserRole(null);
      setCurrentUser(null);
      await signOut(auth);
      console.log('User logged out successfully');
    } catch (err) {
      console.error('Logout error:', err);
      throw err;
    }
  };

  // Get user data from Firestore
  const getUserData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(firestore, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (err) {
      console.error('Error fetching user data:', err);
      return null;
    }
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    try {
      if (currentUser) {
        // Update Firebase Auth profile
        if (updates.displayName || updates.photoURL) {
          await updateProfile(currentUser, updates);
        }

        // Update Firestore document
        await setDoc(doc(firestore, 'users', currentUser.uid), updates, { merge: true });
        
        console.log('Profile updated successfully');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    }
  };

  // Monitor auth state changes
  useEffect(() => {
    setLoading(true);
    setAuthError(null);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        try {
          // Fetch user role from Firestore
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role);
            console.log('Auth state changed - User authenticated:', { uid: user.uid, role: userData.role });
          } else {
            setUserRole(null);
            setAuthError("No user role found. Please check Firestore.");
            console.warn('User document not found in Firestore for uid:', user.uid);
          }
        } catch (err) {
          setUserRole(null);
          setAuthError("Failed to fetch user role: " + err.message);
          console.error('Error fetching user role:', err);
        }
      } else {
        setUserRole(null);
        console.log('Auth state changed - User logged out');
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div style={{
        width: "100%", 
        height: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        fontSize: 24,
        flexDirection: "column",
        gap: "20px"
      }}>
        <div className="spinner" style={{
          border: "4px solid #f3f3f3",
          borderTop: "4px solid #3498db",
          borderRadius: "50%",
          width: "50px",
          height: "50px",
          animation: "spin 1s linear infinite"
        }}></div>
        <p>Loading authentication...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Error state
  if (authError) {
    return (
      <div style={{
        width: "100%", 
        minHeight: "100vh", 
        color: "red", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        fontSize: 20, 
        flexDirection: "column",
        padding: "20px",
        textAlign: "center"
      }}>
        <h2 style={{ marginBottom: "10px" }}>Authentication Error</h2>
        <p>{authError}</p>
        <button 
          onClick={() => window.location.reload()} 
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: "#3498db",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const value = {
    currentUser,
    userRole,
    login,
    logout,
    register,
    getUserData,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
