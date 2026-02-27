// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDodHhD9WddUJx6FPmuYjfnuJ2d04ovLBM",
  authDomain: "printmypage-app.firebaseapp.com",
  projectId: "printmypage-app",
  storageBucket: "printmypage-app.firebasestorage.app",
  messagingSenderId: "1000645577686",
  appId: "1:1000645577686:web:f5e50747f85f5ecade7277"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app)
