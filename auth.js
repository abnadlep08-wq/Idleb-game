// ============= auth.js - نسخة معدلة بالكامل =============

let currentUser = null;
let isGuest = false;

// التحقق من Firebase
console.log('Firebase initialized:', typeof firebase !== 'undefined');
console.log('Auth available:', typeof auth !== 'undefined');

// مراقبة حالة تسجيل الدخول
if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged((user) => {
        console.log('Auth state changed:', user);
        
        if (user) {
            currentUser = user;
            isGuest = false;
            
            // حفظ بيانات المستخدم
            saveUserToDatabase(user);
            
            // تحديث الواجهة
            if (document.getElementById('loggedIn')) {
                document.getElementById('notLoggedIn').style.display = 'none';
                document.getElementById('loggedIn').style.display = 'block';
                document.getElementById('userName').innerText = user.displayName || 'لاعب';
                if (user.photoURL) {
                    document.getElementById('userPhoto').src = user.photoURL;
                }
            }
            
            if (document.getElementById('gameSection')) {
                document.getElementById('gameSection').style.display = 'block';
            }
            
            // تشغيل صوت
            if (typeof playSound === 'function') playSound('login');
            
            // عرض رسالة ترحيب
            showToast(`مرحباً ${user.displayName || 'لاعب'}! 🎉`);
            
        } else {
            // التحقق من وجود ضيف
            const guestData = localStorage.getItem('guestUser');
            if (guestData) {
                try {
                    currentUser = JSON.parse(guestData);
                    isGuest = true;
                    
                    if (document.getElementById('loggedIn')) {
                        document.getElementById('notLoggedIn').style.display = 'none';
                        document.getElementById('loggedIn').style.display = 'block';
                        document.getElementById('userName').innerText = currentUser.displayName;
                    }
                    
                    if (document.getElementById('gameSection')) {
                        document.getElementById('gameSection').style.display = 'block';
                    }
                } catch (e) {
                    console.error('Error parsing guest data:', e);
                    showLoginScreen();
                }
            } else {
                showLoginScreen();
            }
        }
    });
} else {
    console.error('Firebase Auth not initialized!');
}

// عرض شاشة تسجيل الدخول
function showLoginScreen() {
    if (document.getElementById('notLoggedIn')) {
        document.getElementById('notLoggedIn').style.display = 'block';
    }
    if (document.getElementById('loggedIn')) {
        document.getElementById('loggedIn').style.display = 'none';
    }
    if (document.getElementById('gameSection')) {
        document.getElementById('gameSection').style.display = 'none';
    }
}

// تسجيل الدخول بجوجل
function loginWithGoogle() {
    console.log('loginWithGoogle called');
    
    if (typeof auth === 'undefined') {
        console.error('Auth not available');
        showToast('حدث خطأ في الاتصال، حاول مرة أخرى');
        return;
    }
    
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({
        prompt: 'select_account'
    });
    
    // استخدام signInWithPopup (أسهل)
    auth.signInWithPopup(provider)
        .then((result) => {
            console.log('Login success:', result.user);
            const user = result.user;
            currentUser = user;
            isGuest = false;
            
            // حفظ في localStorage للمساعدة
            localStorage.removeItem('guestUser');
            
            // حفظ في قاعدة البيانات
            saveUserToDatabase(user);
            
            // تحديث الواجهة
            if (document.getElementById('loggedIn')) {
                document.getElementById('notLoggedIn').style.display = 'none';
                document.getElementById('loggedIn').style.display = 'block';
                document.getElementById('userName').innerText = user.displayName;
                if (user.photoURL) {
                    document.getElementById('userPhoto').src = user.photoURL;
                }
            }
            
            if (document.getElementById('gameSection')) {
                document.getElementById('gameSection').style.display = 'block';
            }
            
            if (typeof playSound === 'function') playSound('login');
            showToast(`مرحباً ${user.displayName}! 🎉`);
            
        })
        .catch((error) => {
            console.error('Login error:', error);
            
            // عرض رسالة خطأ واضحة
            let errorMessage = 'فشل تسجيل الدخول';
            if (error.code === 'auth/popup-blocked') {
                errorMessage = 'الرجاء السماح للنوافذ المنبثقة';
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'فحص الاتصال بالإنترنت';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            showToast(errorMessage);
        });
}

// اللعب كضيف
function loginAsGuest() {
    console.log('loginAsGuest called');
    
    const guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const guestName = 'ضيف_' + Math.floor(Math.random() * 1000);
    
    currentUser = {
        uid: guestId,
        displayName: guestName,
        photoURL: null,
        email: null,
        isGuest: true
    };
    
    isGuest = true;
    
    // حفظ في localStorage
    localStorage.setItem('guestUser', JSON.stringify(currentUser));
    
    // تحديث الواجهة
    if (document.getElementById('loggedIn')) {
        document.getElementById('notLoggedIn').style.display = 'none';
        document.getElementById('loggedIn').style.display = 'block';
        document.getElementById('userName').innerText = guestName;
        document.getElementById('userPhoto').style.display = 'none';
    }
    
    if (document.getElementById('gameSection')) {
        document.getElementById('gameSection').style.display = 'block';
    }
    
    if (typeof playSound === 'function') playSound('login');
    showToast(`مرحباً ${guestName}! تلعب كضيف 🎮`);
}

// حفظ المستخدم في قاعدة البيانات
async function saveUserToDatabase(user) {
    if (!database) {
        console.error('Database not available');
        return;
    }
    
    try {
        const userRef = database.ref(`users/${user.uid}`);
        const snapshot = await userRef.once('value');
        
        if (!snapshot.exists()) {
            await userRef.set({
                uid: user.uid,
                name: user.displayName,
                email: user.email || '',
                photoURL: user.photoURL || '',
                createdAt: Date.now(),
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
                achievements: []
            });
            console.log('User saved to database');
        }
        
        // تحميل بيانات المستخدم
        const userSnapshot = await userRef.once('value');
        const userData = userSnapshot.val();
        
        // تحديث واجهة العملات والمستوى
        if (document.getElementById('userLevel')) {
            document.getElementById('userLevel').innerHTML = `⭐ المستوى ${userData.level || 1}`;
        }
        if (document.getElementById('userCoins')) {
            document.getElementById('userCoins').innerHTML = `💰 ${userData.coins || 0} عملة`;
        }
        
        // تطبيق الثيم المحفوظ
        if (userData.currentTheme && typeof applyTheme === 'function') {
            applyTheme(userData.currentTheme);
        }
        
    } catch (error) {
        console.error('Error saving user:', error);
    }
}

// تسجيل الخروج
function logout() {
    if (isGuest) {
        localStorage.removeItem('guestUser');
        currentUser = null;
        isGuest = false;
        showLoginScreen();
        showToast('تم تسجيل الخروج');
    } else {
        auth.signOut().then(() => {
            showLoginScreen();
            showToast('تم تسجيل الخروج');
        }).catch((error) => {
            console.error('Logout error:', error);
            showToast('حدث خطأ أثناء تسجيل الخروج');
        });
    }
}

// عرض رسالة منبثقة
function showToast(message) {
    console.log('Toast:', message);
    
    // إزالة أي toast موجود
    const existingToast = document.querySelector('.custom-toast');
    if (existingToast) existingToast.remove();
    
    // إنشاء toast جديد
    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    toast.innerHTML = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #6366f1, #4f46e5);
        color: white;
        padding: 12px 24px;
        border-radius: 60px;
        font-weight: bold;
        z-index: 10000;
        animation: fadeInUp 0.3s ease;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// تحديث إحصائيات بعد المباراة
async function updateStats(uid, isWinner) {
    if (!database || uid.startsWith('guest')) return;
    
    try {
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
        
        // التحقق من رفع المستوى
        const snapshot = await database.ref(`users/${uid}`).once('value');
        const user = snapshot.val();
        const newLevel = Math.floor(user.xp / 100) + 1;
        
        if (newLevel > user.level) {
            await database.ref(`users/${uid}`).update({ level: newLevel });
            showToast(`🎉 مبروك! وصلت للمستوى ${newLevel}! 🎉`);
            if (typeof playSound === 'function') playSound('levelup');
        }
        
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// دالة مساعدة لتطبيق الثيم
window.applyTheme = function(theme) {
    document.body.className = `theme-${theme}`;
    localStorage.setItem('theme', theme);
};

// تحميل الثيم المحفوظ
const savedTheme = localStorage.getItem('theme');
if (savedTheme && typeof applyTheme === 'function') {
    applyTheme(savedTheme);
}
