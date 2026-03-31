// ============================================
// إعدادات Firebase الخاصة بمشروعك
// Project: goker-idleb
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyD-W-YXdIkNwJ3S2myifrdphHaxkmG0mw",
    authDomain: "goker-idleb.firebaseapp.com",
    databaseURL: "https://goker-idleb-default-rtdb.firebaseio.com",
    projectId: "goker-idleb",
    storageBucket: "goker-idleb.firebasestorage.app",
    messagingSenderId: "803496116662",
    appId: "1:803496116662:web:8becc21797bc6c2d208117",
    measurementId: "G-96G1G4NLPB"
};

// ============================================
// تهيئة Firebase Services
// ============================================

// تهيئة التطبيق
firebase.initializeApp(firebaseConfig);

// تهيئة الخدمات
const database = firebase.database();
const auth = firebase.auth();
const storage = firebase.storage();

// ============================================
// إعدادات اللعبة العامة
// ============================================

const GAME_CONFIG = {
    // إعدادات اللاعبين
    MAX_PLAYERS: 4,
    MIN_PLAYERS: 2,
    
    // إعدادات الوقت
    TURN_TIMEOUT: 30000,        // 30 ثانية للموبايل
    TURN_WARNING: 10000,        // تحذير قبل 10 ثواني
    
    // إعدادات الذكاء الاصطناعي
    AI_DIFFICULTY: ['easy', 'medium', 'hard'],
    AI_THINK_TIME: 1000,        // وقت تفكير AI بالمللي ثانية
    
    // إعدادات التصميم
    THEMES: ['light', 'dark', 'gold', 'blue', 'purple'],
    CARD_SKINS: ['classic', 'golden', 'neon', 'wood', 'crystal'],
    
    // إعدادات اللغة
    LANGUAGES: ['ar', 'en', 'tr'],
    DEFAULT_LANGUAGE: 'ar',
    
    // إعدادات النقاط
    XP_PER_WIN: 50,
    XP_PER_LOSS: 10,
    COINS_PER_WIN: 20,
    COINS_PER_LOSS: 5,
    
    // إعدادات المستويات
    XP_PER_LEVEL: 100,
    
    // إعدادات البطولات
    TOURNAMENT_DURATION: 7,     // أيام
    TOURNAMENT_PRIZE: 500       // عملات
};

// ============================================
// بيانات المستخدم الافتراضية
// ============================================

let userData = {
    xp: 0,
    level: 1,
    coins: 100,
    wins: 0,
    losses: 0,
    gamesPlayed: 0,
    currentSkin: 'classic',
    currentTheme: 'dark',
    ownedSkins: ['classic'],
    friends: [],
    achievements: [],
    language: 'ar'
};

// ============================================
// وظائف مساعدة
// ============================================

// حفظ إعدادات المستخدم في localStorage
function saveUserSettings() {
    localStorage.setItem('userSettings', JSON.stringify({
        soundEnabled: soundEnabled,
        musicEnabled: musicEnabled,
        theme: userData.currentTheme,
        skin: userData.currentSkin,
        language: userData.language
    }));
}

// تحميل إعدادات المستخدم
function loadUserSettings() {
    const saved = localStorage.getItem('userSettings');
    if (saved) {
        const settings = JSON.parse(saved);
        if (settings.theme) applyTheme(settings.theme);
        if (settings.skin) applySkin(settings.skin);
        if (settings.language) setLanguage(settings.language);
    }
}

// تطبيق الثيم
function applyTheme(theme) {
    document.body.className = `theme-${theme}`;
    userData.currentTheme = theme;
    saveUserSettings();
}

// تطبيق سكن البطاقات
function applySkin(skin) {
    userData.currentSkin = skin;
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.className = card.className.replace(/card-skin-\w+/, '');
        if (skin !== 'classic') {
            card.classList.add(`card-skin-${skin}`);
        }
    });
    saveUserSettings();
}

// تغيير اللغة
function setLanguage(lang) {
    userData.language = lang;
    document.documentElement.lang = lang;
    document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
    saveUserSettings();
    // هنا يمكن إضافة ترجمة النصوص
}

// ============================================
// قواعد Realtime Database (للنسخ في Firebase Console)
// ============================================

/*
ضع هذه القواعد في Firebase Console -> Realtime Database -> Rules

{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid == $uid"
      }
    },
    "games": {
      "$gameId": {
        ".read": "auth != null",
        ".write": "auth != null",
        "chat": {
          ".read": "auth != null",
          ".write": "auth != null"
        }
      }
    },
    "leaderboard": {
      ".read": true,
      ".write": "auth != null"
    },
    "tournaments": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
*/

// ============================================
// تصدير المتغيرات (للاستخدام في الملفات الأخرى)
// ============================================

// هذه المتغيرات متاحة عالمياً في جميع الملفات
window.database = database;
window.auth = auth;
window.storage = storage;
window.GAME_CONFIG = GAME_CONFIG;
window.userData = userData;
window.applyTheme = applyTheme;
window.applySkin = applySkin;
window.setLanguage = setLanguage;
