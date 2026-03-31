// ============= نظام الإشعارات =============

// طلب إذن الإشعارات
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('هذا المتصفح لا يدعم الإشعارات');
        return false;
    }
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
}

// إرسال إشعار
function sendNotification(title, body, icon = '🎴') {
    if (Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: icon,
            vibrate: [200, 100, 200]
        });
    }
}

// إشعار عند الدور
function notifyTurn(playerName, gameId) {
    sendNotification(
        '🎯 دورك الآن!',
        `حان دورك في لعبة ${gameId}`,
        '🃏'
    );
}

// إشعار عند انضمام لاعب
function notifyPlayerJoined(gameId, playerName) {
    sendNotification(
        '👋 لاعب جديد',
        `${playerName} انضم إلى لعبتك`,
        '🎮'
    );
}

// إشعار عند الفوز
function notifyWin(playerName) {
    sendNotification(
        '🏆 فوز!',
        `مبروك! لقد فزت على ${playerName}`,
        '🏆'
    );
}

// إشعار عند دعوة للعب
function notifyInvite(fromPlayer, gameId) {
    sendNotification(
        '📩 دعوة للعب',
        `${fromPlayer} يدعوك للعب معه!`,
        '🎴'
    );
}

// الاستماع للإشعارات في اللعبة
function listenForNotifications(gameId) {
    const gameRef = database.ref(`games/${gameId}`);
    
    gameRef.on('child_changed', (snapshot) => {
        if (snapshot.key === 'currentTurn') {
            const newTurn = snapshot.val();
            if (newTurn === currentUser?.uid) {
                notifyTurn(currentUser.displayName, gameId);
                playSound('notification');
            }
        }
    });
    
    gameRef.child('players').on('child_added', (snapshot) => {
        const player = snapshot.val();
        if (player.id !== currentUser?.uid) {
            notifyPlayerJoined(gameId, player.name);
        }
    });
}

// طلب الإذن عند تحميل الصفحة
if ('Notification' in window && Notification.permission === 'default') {
    requestNotificationPermission();
}
