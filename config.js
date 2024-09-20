import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';  // Import the storage module

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBldUXYH-SuRZFRf9uoXCasuYo4aRHXOz4",
  authDomain: "booking-c6c69.firebaseapp.com",
  projectId: "booking-c6c69",
  storageBucket: "booking-c6c69.appspot.com",
  messagingSenderId: "1083395806543",
  appId: "1:1083395806543:web:7bf7cab6d3ea6a8d54213a",
  measurementId: "G-Z0CQHEKFDM"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const firestore = firebase.firestore();
const storage = firebase.storage();  // Initialize the storage service

export { firebase, firestore, storage };
