// config/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuração copiada do console do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCN0QTjnEhOAQ90a-8NWavUM-lk6mrEeII",
    authDomain: "trampay-b5373.firebaseapp.com",
    projectId: "trampay-b5373",
    storageBucket: "trampay-b5373.firebasestorage.app",
    messagingSenderId: "377009490121",
    appId: "1:377009490121:web:b95b93b284fe9508ce2518",
    measurementId: "G-QS6DS1Q9J4"
  };

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa os serviços que você vai usar
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
