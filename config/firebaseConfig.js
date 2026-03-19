import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCI5lhkbUGi8lEmLWe7jF-dGWxCO_2SlVQ",
  authDomain: "english-commerce.firebaseapp.com",
  databaseURL: "https://english-commerce-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "english-commerce",
  storageBucket: "english-commerce.firebasestorage.app",
  messagingSenderId: "107603930084",
  appId: "1:107603930084:web:403f0dd16e2b8b71f235f1"
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);




