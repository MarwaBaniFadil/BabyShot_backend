const { initializeApp } = require("firebase/app");
const { getDatabase, ref, set, get } = require("firebase/database");

// إعداد Firebase باستخدام بيانات المشروع الخاص بك
const firebaseConfig = {
    apiKey: "AIzaSyCk-WdwA8qEs60VPGy6Et5xBeTVmxYdKis",
    authDomain: "chat-between-dr-mom.firebaseapp.com",
    databaseURL: "https://chat-between-dr-mom-default-rtdb.firebaseio.com",
    projectId: "chat-between-dr-mom",
    storageBucket: "chat-between-dr-mom.firebasestorage.app",
    messagingSenderId: "996919611862",
    appId: "1:996919611862:web:f3afa070b2d3ed9e3dd477",
    measurementId: "G-T8KQMXQTHX"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);

// الحصول على مرجع قاعدة البيانات
const db = getDatabase(app);

module.exports = { db, ref, set, get  };
