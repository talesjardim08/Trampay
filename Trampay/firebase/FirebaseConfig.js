// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCN0QTjnEhOAQ90a-8NWavUM-lk6mrEeII",
  authDomain: "trampay-b5373.firebaseapp.com",
  projectId: "trampay-b5373",
  storageBucket: "trampay-b5373.firebasestorage.app",
  messagingSenderId: "377009490121",
  appId: "1:377009490121:web:b95b93b284fe9508ce2518",
  measurementId: "G-QS6DS1Q9J4"
};

// Initialize Firebase
 export const app = initializeApp(firebaseConfig);
 export const analytics = getAnalytics(app);