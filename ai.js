// ============= الذكاء الاصطناعي =============
let aiDifficulty = 'medium'; // easy, medium, hard

// قرارات AI
function aiPlayTurn(playerHand, currentSuit, topCard, gameState) {
    setTimeout(() => {
        const validCards = findValidCards(playerHand, currentSuit, topCard);
        
        if (validCards.length === 0) {
            // لا توجد أوراق صالحة، يمرر
            passTurn();
            return;
        }
        
        let selectedCard;
        
        switch(aiDifficulty) {
            case 'easy':
                selectedCard = aiEasy(validCards);
                break;
            case 'medium':
                selectedCard = aiMedium(validCards, playerHand);
                break;
            case 'hard':
                selectedCard = aiHard(validCards, playerHand, gameState);
                break;
            default:
                selectedCard = validCards[0];
        }
        
        // رمي الورقة
        playCard(selectedCard);
        addAIMessage();
        
    }, 1000 + Math.random() * 2000);
}

// AI سهل: يرمي أول ورقة
function aiEasy(validCards) {
    return validCards[0];
}

// AI متوسط: يفضل رمي الجوكر والبطاقات العالية
function aiMedium(validCards, hand) {
    // إذا كان لديه جوكر
    const joker = validCards.find(c => c.rank === 'JOKER');
    if (joker) return joker;
    
    // ارمي أعلى بطاقة
    return getHighestCard(validCards);
}

// AI صعب: ذكي، يحسب ويخطط
function aiHard(validCards, hand, gameState) {
    const joker = validCards.find(c => c.rank === 'JOKER');
    if (joker && hand.length < 5) return joker;
    
    // حاول الاحتفاظ بالجوكر للنهاية
    if (hand.length > 3 && joker) {
        validCards = validCards.filter(c => c.rank !== 'JOKER');
    }
    
    // ارمي البطاقات العالية أولاً إذا كان الخصم قريب من الفوز
    if (gameState.otherPlayersMinCards < 3) {
        return getHighestCard(validCards);
    }
    
    // ارمي البطاقات المنخفضة لتضليل الخصم
    return getLowestCard(validCards);
}

// أعلى بطاقة
function getHighestCard(cards) {
    const rankOrder = { 'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2 };
    return cards.reduce((highest, card) => {
        const cardValue = rankOrder[card.rank] || 0;
        const highestValue = rankOrder[highest.rank] || 0;
        return cardValue > highestValue ? card : highest;
    });
}

// أدنى بطاقة
function getLowestCard(cards) {
    const rankOrder = { 'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2 };
    return cards.reduce((lowest, card) => {
        const cardValue = rankOrder[card.rank] || 0;
        const lowestValue = rankOrder[lowest.rank] || 0;
        return cardValue < lowestValue ? card : lowest;
    });
}

// البطاقات الصالحة للعب
function findValidCards(hand, currentSuit, topCard) {
    const matchingSuit = hand.filter(c => c.suit === currentSuit && c.rank !== 'JOKER');
    if (matchingSuit.length > 0) return matchingSuit;
    
    const joker = hand.filter(c => c.rank === 'JOKER');
    if (joker.length > 0) return joker;
    
    return hand;
}

// تغيير صعوبة AI
function setAIDifficulty(difficulty) {
    aiDifficulty = difficulty;
    showToast(`صعوبة AI: ${difficulty === 'easy' ? 'سهل' : difficulty === 'medium' ? 'متوسط' : 'صعب'}`);
                                       }
