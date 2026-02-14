// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAPsjXna5ImDznfcOyqtC6h_GT09qNSxbU",
  authDomain: "nuerorhythm-app.firebaseapp.com",
  projectId: "nuerorhythm-app",
  storageBucket: "nuerorhythm-app.firebasestorage.app",
  messagingSenderId: "28101636727",
  appId: "1:28101636727:web:98e063a2e040981fc08c72",
  measurementId: "G-XXYVEBPFY7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);