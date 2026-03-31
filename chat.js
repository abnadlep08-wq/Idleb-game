// ============= نظام الدردشة =============
let currentChatRoom = null;

// إرسال رسالة
function sendChatMessage(message, gameId) {
    if (!message.trim()) return;
    
    const chatRef = database.ref(`games/${gameId}/chat`);
    chatRef.push({
        userId: currentUser.uid,
        userName: currentUser.displayName || 'ضيف',
        message: message,
        timestamp: Date.now(),
        userPhoto: currentUser.photoURL || null
    });
    
    playSound('click');
}

// الاستماع للرسائل
function listenToChat(gameId) {
    const chatRef = database.ref(`games/${gameId}/chat`);
    chatRef.limitToLast(50).on('child_added', (snapshot) => {
        const msg = snapshot.val();
        addChatMessageToUI(msg);
    });
}

// عرض الرسالة في الواجهة
function addChatMessageToUI(msg) {
    const chatContainer = document.getElementById('chatMessages');
    if (!chatContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${msg.userId === currentUser.uid ? 'my-message' : 'other-message'}`;
    
    const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
        <div class="chat-avatar">
            ${msg.userPhoto ? `<img src="${msg.userPhoto}" class="chat-photo">` : '<div class="chat-initial">' + msg.userName.charAt(0) + '</div>'}
        </div>
        <div class="chat-content">
            <div class="chat-name">${msg.userName}</div>
            <div class="chat-text">${escapeHtml(msg.message)}</div>
            <div class="chat-time">${time}</div>
        </div>
    `;
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// إيموجي سريع
function sendEmoji(emoji, gameId) {
    sendChatMessage(emoji, gameId);
}

// escape HTML لمنع XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
