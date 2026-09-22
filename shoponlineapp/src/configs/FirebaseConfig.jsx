import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
const firebaseConfig = {
  apiKey: "AIzaSyBqXli5_BTbvjVCQFwl1hHUMmV_nA1rbzc",
  authDomain: "shop-online-chat.firebaseapp.com",
  databaseURL: "https://shop-online-chat-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "shop-online-chat",
  storageBucket: "shop-online-chat.firebasestorage.app",
  messagingSenderId: "121731962309",
  appId: "1:121731962309:web:14cb689133166e5639e7ac"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getDatabase(app);