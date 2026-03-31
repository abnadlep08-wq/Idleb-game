// ============= منطق اللعبة الكامل =============
let currentGame = null;
let gameInterval = null;
let turnTimer = null;
let selectedCard = null;

// بدء اللعبة
async function createGame(gameMode = 'online') {
    if (!currentUser) {
        showToast('الرجاء تسجيل الدخول أولاً');
        return;
    }
    
    const gameId = generateGameCode();
    const deck = createDeck();
    
    const game = {
        gameId: gameId,
        mode: gameMode,
        players: {
            [currentUser.uid]: {
                id: currentUser.uid,
                name: currentUser.displayName || 'لاعب',
                photo: currentUser.photoURL,
                hand: [],
                order: 0,
                isAI: false,
                cardsLeft: 0
            }
        },
        deck: deck,
        playedCards: [],
        currentTurn: null,
        currentSuit: null,
        gameStarted: false,
        gameEnded: false,
        winner: null,
        playersOrder: [currentUser.uid],
        chat: [],
        createdAt: Date.now(),
        turnStartTime: null
    };
    
    if (gameMode === 'vsAI') {
        // إضافة لاعب AI
        const aiId = 'ai_' + Date.now();
        game.players[aiId] = {
            id: aiId,
            name: '🤖 AI ' + (aiDifficulty === 'easy' ? 'سهل' : aiDifficulty === 'medium' ? 'متوسط' : 'صعب'),
            photo: null,
            hand: [],
            order: 1,
            isAI: true,
            aiDifficulty: aiDifficulty,
            cardsLeft: 0
        };
        game.playersOrder.push(aiId);
    }
    
    await database.ref(`games/${gameId}`).set(game);
    
    if (gameMode === 'vsAI') {
        await startGame(gameId);
    } else {
        window.location.href = `lobby.html?gameId=${gameId}`;
    }
}

// إنشاء مجموعة البطاقات
function createDeck() {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck = [];
    
    for (let suit of suits) {
        for (let rank of ranks) {
            deck.push({ rank, suit, id: `${rank}_${suit}` });
        }
    }
    deck.push({ rank: 'JOKER', suit: 'joker', id: 'JOKER' });
    
    return shuffle(deck);
}

// خلط البطاقات
function shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// بدء اللعبة
async function startGame(gameId) {
    const snapshot = await database.ref(`games/${gameId}`).once('value');
    const game = snapshot.val();
    const players = Object.values(game.players);
    const deck = game.deck;
    
    // توزيع الأوراق
    const cardsPerPlayer = Math.floor(deck.length / players.length);
    let remainingCards = [...deck];
    
    players.forEach((player, index) => {
        const playerCards = remainingCards.splice(0, cardsPerPlayer);
        game.players[player.id].hand = playerCards;
        game.players[player.id].cardsLeft = playerCards.length;
    });
    
    game.deck = remainingCards;
    game.gameStarted = true;
    
    // تحديد اللاعب البادئ
    let firstPlayer = findPlayerWithAceSpades(game);
    game.currentTurn = firstPlayer || players[0].id;
    game.turnStartTime = Date.now();
    
    // وضع أول بطاقة
    if (game.playedCards.length === 0 && game.deck.length > 0) {
        const firstCard = game.deck.pop();
        game.playedCards.push(firstCard);
        game.currentSuit = firstCard.suit;
    }
    
    await database.ref(`games/${gameId}`).update(game);
    startTurnTimer(gameId);
}

// إيجاد صاحب Ace of Spades
function findPlayerWithAceSpades(game) {
    for (let playerId in game.players) {
        const player = game.players[playerId];
        const hasAceSpades = player.hand.some(card => card.rank === 'A' && card.suit === 'spades');
        if (hasAceSpades) return playerId;
    }
    return null;
}

// بدء مؤقت الدور
function startTurnTimer(gameId) {
    if (turnTimer) clearInterval(turnTimer);
    
    turnTimer = setInterval(async () => {
        const snapshot = await database.ref(`games/${gameId}`).once('value');
        const game = snapshot.val();
        
        if (!game || game.gameEnded) {
            clearInterval(turnTimer);
            return;
        }
        
        const elapsed = Date.now() - game.turnStartTime;
        const remaining = Math.max(0, GAME_CONFIG.TURN_TIMEOUT - elapsed);
        
        updateTimerDisplay(remaining);
        
        if (remaining <= 0 && game.currentTurn === currentUser?.uid) {
            // انتهى الوقت، يمرر تلقائياً
            clearInterval(turnTimer);
            await autoPass(gameId);
        } else if (remaining <= 5000 && game.currentTurn === currentUser?.uid) {
            playSound('timeout');
        }
        
    }, 1000);
}

// التمرير التلقائي
async function autoPass(gameId) {
    const snapshot = await database.ref(`games/${gameId}`).once('value');
    const game = snapshot.val();
    const nextPlayer = getNextPlayer(game);
    
    await database.ref(`games/${gameId}`).update({
        currentTurn: nextPlayer,
        turnStartTime: Date.now()
    });
    
    addGameMessage('⏰ انتهى الوقت، تم تمرير الدور تلقائياً');
    playSound('timeout');
}

// رمي الورقة
async function playCard(card) {
    const snapshot = await database.ref(`games/${currentGameId}`).once('value');
    const game = snapshot.val();
    const player = game.players[currentUser.uid];
    
    // التحقق من صحة الحركة
    const isValid = validateMove(card, game.currentSuit, player.hand);
    if (!isValid) {
        showToast('❌ لا يمكنك رمي هذه الورقة!');
        return;
    }
    
    // إزالة البطاقة من يد اللاعب
    const newHand = player.hand.filter(c => c.id !== card.id);
    
    // تحديث اللعبة
    const updates = {
        [`players/${currentUser.uid}/hand`]: newHand,
        [`players/${currentUser.uid}/cardsLeft`]: newHand.length,
        [`playedCards`]: [...game.playedCards, card],
        [`currentSuit`]: card.rank === 'JOKER' ? game.currentSuit : card.suit,
        turnStartTime: Date.now()
    };
    
    // التحقق من الفوز
    if (newHand.length === 0) {
        updates.gameEnded = true;
        updates.winner = currentUser.uid;
        await handleWin(currentUser.uid, game);
    } else {
        updates.currentTurn = getNextPlayer(game);
    }
    
    await database.ref(`games/${currentGameId}`).update(updates);
    
    playSound('play');
    selectedCard = null;
    
    // إذا كان الدور للAI، قم بتشغيله
    const nextPlayer = game.players[updates.currentTurn];
    if (nextPlayer && nextPlayer.isAI) {
        setTimeout(() => aiPlayTurn(nextPlayer.hand, updates.currentSuit, card, game), 1000);
    }
}

// التحقق من صحة الحركة
function validateMove(card, currentSuit, hand) {
    if (card.rank === 'JOKER') return true;
    if (card.suit === currentSuit) return true;
    
    const hasMatchingSuit = hand.some(c => c.suit === currentSuit && c.rank !== 'JOKER');
    return !hasMatchingSuit;
}

// معالجة الفوز
async function handleWin(winnerId, game) {
    playSound('win');
    
    // تحديث إحصائيات الفائز
    await updateStats(winnerId, true);
    
    // تحديث إحصائيات الخاسرين
    for (let playerId in game.players) {
        if (playerId !== winnerId && !game.players[playerId].isAI) {
            await updateStats(playerId, false);
        }
    }
    
    // إضافة نقاط إضافية للفوز السريع
    const winnerCardsLeft = game.players[winnerId].cardsLeft;
    if (winnerCardsLeft === 0) {
        const bonus = 50;
        await database.ref(`users/${winnerId}/coins`).transaction(coins => (coins || 0) + bonus);
        addGameMessage(`🏆 ${game.players[winnerId].name} فاز! +${bonus} عملة إضافية!`);
    }
    
    showVictoryScreen(game.players[winnerId].name);
}

// الحصول على اللاعب التالي
function getNextPlayer(game) {
    const order = game.playersOrder;
    const currentIndex = order.indexOf(game.currentTurn);
    const nextIndex = (currentIndex + 1) % order.length;
    return order[nextIndex];
}

// توليد كود لعبة
function generateGameCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// عرض الرسائل في اللعبة
function addGameMessage(message) {
    const messagesDiv = document.getElementById('gameMessages');
    if (messagesDiv) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message';
        msgDiv.innerHTML = message;
        messagesDiv.appendChild(msgDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
}

// عرض شاشة الفوز
function showVictoryScreen(winnerName) {
    const modal = document.createElement('div');
    modal.className = 'victory-modal';
    modal.innerHTML = `
        <div class="victory-content">
            <div class="victory-trophy">🏆</div>
            <h2>${winnerName} فاز باللعبة!</h2>
            <p>+50 XP | +20 عملة</p>
            <button onclick="location.reload()">🎮 لعبة جديدة</button>
            <button onclick="window.location.href='index.html'">🏠 الرئيسية</button>
        </div>
    `;
    document.body.appendChild(modal);
}

// تحديث شاشة المؤقت
function updateTimerDisplay(ms) {
    const timerElement = document.getElementById('turnTimer');
    if (!timerElement) return;
    
    const seconds = Math.ceil(ms / 1000);
    timerElement.textContent = seconds;
    
    if (seconds <= 5) {
        timerElement.classList.add('danger');
    } else if (seconds <= 10) {
        timerElement.classList.add('warning');
    } else {
        timerElement.classList.remove('warning', 'danger');
    }
                  }
