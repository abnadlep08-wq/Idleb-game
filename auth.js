// ============= إدارة المستخدمين =============
let currentUser = null;
let isGuest = false;

// مراقبة حالة تسجيل الدخول
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        isGuest = false;
        await loadUserData(user.uid);
        updateUIAfterLogin();
    } else {
        currentUser = null;
        showLoginScreen();
    }
});

// تسجيل الدخول بجوجل
function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    auth.signInWithPopup(provider)
        .then(async (result) => {
            await saveUserToDatabase(result.user);
            playSound('login');
            showToast(`مرحباً ${result.user.displayName}! 🎉`);
        })
        .catch(error => showError(error.message));
}

// تسجيل الدخول كضيف
function loginAsGuest() {
    const guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    currentUser = {
        uid: guestId,
        displayName: 'ضيف_' + Math.floor(Math.random() * 1000),
        photoURL: null,
        email: null,
        isGuest: true
    };
    isGuest = true;
    localStorage.setItem('guestUser', JSON.stringify(currentUser));
    updateUIAfterLogin();
    playSound('login');
}

// حفظ بيانات المستخدم
async function saveUserToDatabase(user) {
    const userRef = database.ref(`users/${user.uid}`);
    const snapshot = await userRef.once('value');
    
    if (!snapshot.exists()) {
        await userRef.set({
            uid: user.uid,
            name: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            createdAt: Date.now(),
            xp: 0,
            level: 1,
            coins: 100,
            wins: 0,
            losses: 0,
            gamesPlayed: 0,
            currentSkin: 'classic',
            currentTheme: 'dark',
            friends: [],
            achievements: []
        });
    }
    await loadUserData(user.uid);
}

// تحميل بيانات المستخدم
async function loadUserData(uid) {
    const snapshot = await database.ref(`users/${uid}`).once('value');
    if (snapshot.exists()) {
        userData = { ...userData, ...snapshot.val() };
        applyTheme(userData.currentTheme);
    }
}

// تحديث إحصائيات بعد المباراة
async function updateStats(uid, isWinner) {
    const updates = {
        gamesPlayed: firebase.database.ServerValue.increment(1)
    };
    
    if (isWinner) {
        updates.wins = firebase.database.ServerValue.increment(1);
        updates.xp = firebase.database.ServerValue.increment(50);
        updates.coins = firebase.database.ServerValue.increment(20);
    } else {
        updates.losses = firebase.database.ServerValue.increment(1);
        updates.xp = firebase.database.ServerValue.increment(10);
        updates.coins = firebase.database.ServerValue.increment(5);
    }
    
    await database.ref(`users/${uid}`).update(updates);
    await checkLevelUp(uid);
}

// التحقق من رفع المستوى
async function checkLevelUp(uid) {
    const snapshot = await database.ref(`users/${uid}`).once('value');
    const user = snapshot.val();
    const newLevel = Math.floor(user.xp / 100) + 1;
    
    if (newLevel > user.level) {
        await database.ref(`users/${uid}`).update({ level: newLevel });
        showToast(`🎉 مبروك! وصلت للمستوى ${newLevel}! 🎉`);
        playSound('levelup');
    }
          }
