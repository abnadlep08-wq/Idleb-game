// ============= نظام البطولات =============

let currentTournament = null;

// إنشاء بطولة جديدة (للمشرف)
async function createTournament(name, prize, maxPlayers) {
    const tournamentId = 'tournament_' + Date.now();
    const tournament = {
        id: tournamentId,
        name: name,
        prize: prize,
        maxPlayers: maxPlayers,
        players: [],
        matches: [],
        status: 'waiting', // waiting, active, finished
        startDate: Date.now() + 86400000, // بعد 24 ساعة
        createdAt: Date.now()
    };
    
    await database.ref(`tournaments/${tournamentId}`).set(tournament);
    return tournamentId;
}

// الانضمام للبطولة
async function joinTournament(tournamentId) {
    const tournamentRef = database.ref(`tournaments/${tournamentId}`);
    const snapshot = await tournamentRef.once('value');
    const tournament = snapshot.val();
    
    if (!tournament) {
        showToast('البطولة غير موجودة');
        return false;
    }
    
    if (tournament.players.length >= tournament.maxPlayers) {
        showToast('البطولة ممتلئة');
        return false;
    }
    
    if (tournament.players.includes(currentUser.uid)) {
        showToast('أنت مسجل بالفعل');
        return false;
    }
    
    await tournamentRef.update({
        players: [...tournament.players, currentUser.uid]
    });
    
    showToast('تم التسجيل في البطولة بنجاح!');
    return true;
}

// بدء البطولة
async function startTournament(tournamentId) {
    const snapshot = await database.ref(`tournaments/${tournamentId}`).once('value');
    const tournament = snapshot.val();
    
    const players = tournament.players;
    const matches = [];
    
    // إنشاء جدول المباريات
    for (let i = 0; i < players.length; i += 2) {
        if (i + 1 < players.length) {
            matches.push({
                id: `match_${i}`,
                player1: players[i],
                player2: players[i + 1],
                winner: null,
                status: 'pending'
            });
        }
    }
    
    await database.ref(`tournaments/${tournamentId}`).update({
        matches: matches,
        status: 'active'
    });
}

// عرض البطولات النشطة
function loadActiveTournaments() {
    database.ref('tournaments').orderByChild('status').equalTo('waiting').on('value', (snapshot) => {
        const tournaments = [];
        snapshot.forEach(child => {
            tournaments.push({ id: child.key, ...child.val() });
        });
        
        displayTournaments(tournaments);
    });
}

// عرض البطولات في الواجهة
function displayTournaments(tournaments) {
    const container = document.getElementById('tournamentsList');
    if (!container) return;
    
    container.innerHTML = tournaments.map(t => `
        <div class="tournament-card">
            <div class="tournament-name">🏆 ${t.name}</div>
            <div class="tournament-info">
                <span>👥 ${t.players.length}/${t.maxPlayers}</span>
                <span>💰 جائزة: ${t.prize} عملة</span>
            </div>
            <div class="tournament-timer" id="timer_${t.id}"></div>
            <button onclick="joinTournament('${t.id}')" class="btn-primary">انضم للبطولة</button>
        </div>
    `).join('');
    
    // بدء المؤقتات
    tournaments.forEach(t => {
        startTournamentTimer(t.id, t.startDate);
    });
}

// مؤقت بدء البطولة
function startTournamentTimer(tournamentId, startDate) {
    const timerElement = document.getElementById(`timer_${tournamentId}`);
    if (!timerElement) return;
    
    const interval = setInterval(() => {
        const now = Date.now();
        const remaining = startDate - now;
        
        if (remaining <= 0) {
            clearInterval(interval);
            timerElement.innerHTML = '🚀 بدأت!';
            startTournament(tournamentId);
        } else {
            const hours = Math.floor(remaining / 3600000);
            const minutes = Math.floor((remaining % 3600000) / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            timerElement.innerHTML = `⏰ تبدأ بعد: ${hours}:${minutes}:${seconds}`;
        }
    }, 1000);
}
