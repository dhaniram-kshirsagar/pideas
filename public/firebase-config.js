// Firebase Configuration
// Replace these values with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
  
  // Initialize Firebase services
  const auth = firebase.auth();
  const firestore = firebase.firestore();
  const functions = firebase.functions();
  
  console.log('Firebase initialized successfully');
} else {
  console.error('Firebase SDK not loaded');
}
