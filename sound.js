// ============= المؤثرات الصوتية =============
const sounds = {
    play: new Audio('https://www.soundjay.com/misc/sounds/card-shuffle-1.mp3'),
    win: new Audio('https://www.soundjay.com/misc/sounds/applause-1.mp3'),
    lose: new Audio('https://www.soundjay.com/misc/sounds/sad-trombone-01.mp3'),
    joker: new Audio('https://www.soundjay.com/misc/sounds/magic-chime-01.mp3'),
    click: new Audio('https://www.soundjay.com/button/beep-01a.mp3'),
    levelup: new Audio('https://www.soundjay.com/misc/sounds/fanfare-01.mp3'),
    login: new Audio('https://www.soundjay.com/misc/sounds/bell-01.mp3'),
    timeout: new Audio('https://www.soundjay.com/misc/sounds/alarm-01.mp3')
};

let soundEnabled = true;
let musicEnabled = true;
let backgroundMusic = null;

// تشغيل الصوت
function playSound(soundName) {
    if (!soundEnabled) return;
    const sound = sounds[soundName];
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log('Sound error:', e));
    }
}

// تشغيل موسيقى الخلفية
function playBackgroundMusic() {
    if (!musicEnabled) return;
    if (!backgroundMusic) {
        backgroundMusic = new Audio('https://www.soundjay.com/misc/sounds/background-music-01.mp3');
        backgroundMusic.loop = true;
        backgroundMusic.volume = 0.3;
    }
    backgroundMusic.play().catch(e => console.log('Music error:', e));
}

// إيقاف الموسيقى
function stopBackgroundMusic() {
    if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    }
}

// تغيير إعدادات الصوت
function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('soundEnabled', soundEnabled);
    showToast(soundEnabled ? '🔊 تم تشغيل الصوت' : '🔇 تم إيقاف الصوت');
}

function toggleMusic() {
    musicEnabled = !musicEnabled;
    localStorage.setItem('musicEnabled', musicEnabled);
    if (musicEnabled) {
        playBackgroundMusic();
    } else {
        stopBackgroundMusic();
    }
    showToast(musicEnabled ? '🎵 تم تشغيل الموسيقى' : '🎵 تم إيقاف الموسيقى');
}

// تحميل الإعدادات المحفوظة
soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
musicEnabled = localStorage.getItem('musicEnabled') !== 'false';
if (musicEnabled) playBackgroundMusic();
