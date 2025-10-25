import React, { useEffect } from 'react';
import { auth, database, firestore } from './config/firebase';
import { ref, set } from 'firebase/database';

const TestFirebase = () => {
  useEffect(() => {
    // Test Realtime Database
    const testRef = ref(database, 'test/connection');
    set(testRef, {
      message: 'Firebase is connected!',
      timestamp: Date.now()
    })
    .then(() => {
      console.log('✅ Firebase Realtime Database connected successfully!');
    })
    .catch((error) => {
      console.error('❌ Firebase connection error:', error);
    });
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Firebase Connection Test</h1>
      <p>Check the browser console for connection status</p>
      <p>Auth Status: {auth ? '✅ Connected' : '❌ Not Connected'}</p>
      <p>Database Status: {database ? '✅ Connected' : '❌ Not Connected'}</p>
      <p>Firestore Status: {firestore ? '✅ Connected' : '❌ Not Connected'}</p>
    </div>
  );
};

export default TestFirebase;
