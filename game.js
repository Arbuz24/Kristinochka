// Game State Management
const GameState = {
    currentScreen: 'start',
    chapter1Score: 0,
    chapter1Lives: 5,
    chapter2Score: 0,
    chapter2Lives: 5,
    chapter3Score: 0,
    chapter3Lives: 5,
    audioContext: null,
    chapter1Running: true,
    chapter2Running: true,
    chapter3Running: true,
    dialogActive: false,
    playerTransformed: false
};

// Asset Loader
class AssetLoader {
    constructor() {
        this.images = {};
        this.loadedCount = 0;
        this.totalCount = 0;
    }

    loadImage(path, name, attempt = 1) {
        return new Promise((resolve) => {
            const img = new Image();
            const fail = (reason) => {
                console.warn(`Asset load failed (attempt ${attempt}/3): ${path} — ${reason}`);
                if (attempt < 3) {
                    // Retry with backoff. On mobile, a 235 MB first download causes
                    // transient timeouts; previously the only "fix" was dying →
                    // location.reload() (HTTP cache made re-fetches succeed). Retrying
                    // inside the FIRST load makes every asset arrive on run #1.
                    setTimeout(() => this.loadImage(path, name, attempt + 1).then(resolve), 600 * attempt);
                } else {
                    resolve(null);
                }
            };
            img.onload = () => {
                // Reject rare 0x0 "successful" loads (empty/corrupt response).
                if (!img.complete || img.naturalWidth === 0) { fail('naturalWidth=0'); return; }
                this.images[name] = img;
                // Wait for DECODE so the first drawImage never paints a blank frame
                // (onload fires on download-complete, before the PNG is decoded).
                if (typeof img.decode === 'function') {
                    img.decode().then(() => resolve(img)).catch(() => resolve(img));
                } else {
                    resolve(img);
                }
            };
            img.onerror = () => fail('network/onerror');
            img.src = path;
        });
    }

    get(name) {
        return this.images[name] || null;
    }

    async loadAssets(onProgress) {
        const assetPaths = {
            // Backgrounds
            'start_screen': 'assets/backgrounds/start_screen.png?v=5',
            'chapter1_piter': 'assets/backgrounds/chapter1_piter.png?v=5',
            'chapter1_basement': 'assets/backgrounds/chapter1_basement.png?v=5',
            'chapter1_quitting': 'assets/backgrounds/chapter1_quitting.png?v=5',
            'chapter1_grandpa': 'assets/backgrounds/chapter1_grandpa.png?v=5',
            'chapter1_ice': 'assets/backgrounds/chapter1_ice.png?v=5',
            'chapter1_mazapark': 'assets/backgrounds/chapter1_mazapark.png?v=5',
            'chapter2_lighthouse': 'assets/backgrounds/chapter2_lighthouse.png?v=5',
            'chapter2_etazhi': 'assets/backgrounds/chapter2_etazhi.png?v=5',
            'chapter2_birthday': 'assets/backgrounds/chapter2_birthday.png?v=5',
            'chapter2_moscow': 'assets/backgrounds/chapter2_moscow.png?v=5',
            'chapter3_road': 'assets/backgrounds/chapter3_road.png?v=5',
            
            // Characters
            'kristina': 'assets/characters/kristina.png?v=5',
            'you': 'assets/characters/you.png?v=5',
            'you_curly': 'assets/characters/you_curly.png?v=5',
            'you_cake_face': 'assets/characters/you_cake_face.png?v=5',
            'camry': 'assets/characters/camry.png?v=5',
            'dog': 'assets/characters/dog.png?v=5',
            
            // Collectibles
            'curl': 'assets/collectibles/curl.png?v=5',
            'bubble_tea': 'assets/collectibles/bubble_tea.png?v=5',
            'mlp_card': 'assets/collectibles/mlp_card.png?v=5',
            'frambini': 'assets/collectibles/frambini.png?v=5',
            'snowflake': 'assets/collectibles/snowflake.png?v=5',
            'ticket': 'assets/collectibles/ticket.png?v=5',
            'dog_food': 'assets/collectibles/dog_food.png?v=5',
            'license': 'assets/collectibles/license.png?v=5',
            'medkit': 'assets/collectibles/medkit.png?v=5',
            'bowling_pin': 'assets/collectibles/bowling_pin.png?v=5',
            'balloon': 'assets/collectibles/balloon.png?v=5',
            
            // Obstacles
            'trash_mountain': 'assets/obstacles/trash_mountain.png?v=5',
            'cigarette': 'assets/obstacles/cigarette.png?v=5',
            'captain_jack': 'assets/obstacles/captain_jack.png?v=5',
            'sofa': 'assets/obstacles/sofa.png?v=5',
            'box': 'assets/obstacles/box.png?v=5',
            'billiard_ball': 'assets/obstacles/billiard_ball.png?v=5',
            'bowling_ball': 'assets/obstacles/bowling_ball.png?v=5',
            'adult_skater': 'assets/obstacles/adult_skater.png?v=5',
            'child_skater': 'assets/obstacles/child_skater.png?v=5',
            'snowdrift': 'assets/obstacles/snowdrift.png?v=5',
            'taxi': 'assets/obstacles/taxi.png?v=5',
            'guard': 'assets/obstacles/guard.png?v=5',
            'cake': 'assets/obstacles/cake.png?v=5',
            'tower': 'assets/obstacles/tower.png?v=5',
            'tower1': 'assets/obstacles/tower1.png?v=5',
            'tower2': 'assets/obstacles/tower2.png?v=5',
            'tower3': 'assets/obstacles/tower3.png?v=5',
            'tower4': 'assets/obstacles/tower4.png?v=5',
            'police': 'assets/obstacles/police.png?v=5',
            'platform': 'assets/obstacles/platform.png?v=5',
            'barrier': 'assets/obstacles/barrier.png?v=5',
            'block': 'assets/obstacles/block.png?v=5',
            
            // UI Photos
            'photo_basement': 'assets/ui/photo_basement.png?v=5',
            'photo_skating': 'assets/ui/photo_skating.png?v=5',
            'photo_mazapark': 'assets/ui/photo_mazapark.png?v=5',
            'photo_lighthouse': 'assets/ui/photo_lighthouse.png?v=5',
            'photo_moscow': 'assets/ui/photo_moscow.png?v=5',
            'photo_camry': 'assets/ui/photo_camry.png?v=5',
            
        };

        this.totalCount = Object.keys(assetPaths).length;
        this.loadedCount = 0;
        const promises = Object.entries(assetPaths).map(([name, path]) => 
            this.loadImage(path, name).then(img => {
                this.loadedCount++;
                if (onProgress) onProgress(this.loadedCount, this.totalCount);
                return img;
            })
        );

        await Promise.all(promises);
        console.log('Assets loaded (some may have failed)');
    }
}

const assetLoader = new AssetLoader();

// Particle System
class ParticleSystem {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.particles = [];
        this.emojis = ['❤️', '✨', '💕', '🌸', '💖', '⭐'];
        this.init();
    }

    init() {
        for (let i = 0; i < 20; i++) {
            this.createParticle();
        }
    }

    createParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.textContent = this.emojis[Math.floor(Math.random() * this.emojis.length)];
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = (3 + Math.random() * 3) + 's';
        particle.style.animationDelay = Math.random() * 2 + 's';
        this.container.appendChild(particle);
        this.particles.push(particle);
    }
}

// Audio System
class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.sfx = {};            // name -> { pool:[Audio], idx, loaded }  (MP3 SFX layer)
        this.sfxVolume = 0.4;     // master SFX volume (0..1)
        this.muted = false;       // synced with the music mute (🎵/🔇 button)
    }

    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    // ---- MP3 sound-effect layer (HTML5 Audio clone pool) ----
    // Real .mp3 SFX (assets/sfx/*.mp3) replace the synthesized beeps. A small
    // pool of Audio clones per sound lets rapid triggers (jump/flap/click)
    // overlap instead of cutting each other off. A missing file flips
    // loaded=false on 'error' -> playSfx returns false -> callers fall back
    // to the synth beeps, so the game never goes silent on a 404.
    preloadSfx(name, path, poolSize = 3) {
        const entry = { pool: [], idx: 0, loaded: true };
        const make = () => {
            const a = new Audio(path);
            a.preload = 'auto';
            a.volume = this.sfxVolume;
            return a;
        };
        const primary = make();
        primary.addEventListener('error', () => { entry.loaded = false; });
        entry.pool = [primary];
        for (let i = 1; i < poolSize; i++) entry.pool.push(make());
        this.sfx[name] = entry;
    }

    playSfx(name, opts = {}) {
        const entry = this.sfx[name];
        if (this.muted || !entry || !entry.loaded) return false;
        const pool = entry.pool;
        const a = pool[entry.idx % pool.length];
        entry.idx = (entry.idx + 1) % pool.length;
        try {
            a.currentTime = 0;
            a.volume = (opts.volume != null ? opts.volume : this.sfxVolume);
            a.playbackRate = opts.rate || 1;
            a.loop = !!opts.loop;
            a.muted = false;
            const p = a.play();
            if (p && p.catch) p.catch(() => {});
            return true;
        } catch (e) {
            return false;
        }
    }

    stopSfx(name) {
        const entry = this.sfx[name];
        if (!entry) return;
        entry.pool.forEach(a => { try { a.pause(); a.currentTime = 0; a.loop = false; } catch (e) {} });
    }

    setSfxMuted(muted) {
        this.muted = muted;
        if (muted) Object.keys(this.sfx).forEach(name => this.stopSfx(name));
    }

    playClick() {
        if (this.muted) return;
        if (this.playSfx('click')) return;
        this.init();
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    playCollect() {
        if (this.muted) return;
        if (this.playSfx('collect', { volume: 0.15 })) return;
        this.init();
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = 1200;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.15);
    }

    playPop() {
        if (this.muted) return;
        this.playSfx('pop', { volume: 0.9 });   // real balloon-pop MP3 (assets/sfx/sfx_pop.mp3)
    }

    playHit() {
        if (this.muted) return;
        if (this.playSfx('hit', { volume: 0.7 })) return;
        this.init();
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = 200;
        oscillator.type = 'sawtooth';
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }
    
    playSiren(opts = {}) {
        if (this.muted) return;
        if (this.playSfx('siren', opts)) return;
        this.init();
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Siren effect: alternating between two frequencies
        const now = this.audioContext.currentTime;
        oscillator.frequency.setValueAtTime(600, now);
        oscillator.frequency.linearRampToValueAtTime(800, now + 0.3);
        oscillator.frequency.linearRampToValueAtTime(600, now + 0.6);
        oscillator.frequency.linearRampToValueAtTime(800, now + 0.9);
        oscillator.frequency.linearRampToValueAtTime(600, now + 1.2);
        
        oscillator.type = 'sawtooth';
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
        
        oscillator.start(now);
        oscillator.stop(now + 1.2);
    }

    // SFX pop + camera now play from real MP3 files (assets/sfx/sfx_pop.mp3, sfx_camera.mp3).

    // Polaroid instant-camera: real recording (shutter + flash + motor + photo eject).
    playCamera() {
        if (this.muted) return;
        this.playSfx('camera', { volume: 0.85 });   // real polaroid MP3 (assets/sfx/sfx_camera.mp3)
    }
    
    playCelebration() {
        if (this.muted) return;
        if (this.playSfx('celebration')) return;
        this.init();
        const now = this.audioContext.currentTime;
        
        // Create a simple celebratory melody
        const notes = [
            { freq: 523.25, start: 0, duration: 0.3 },    // C5
            { freq: 587.33, start: 0.3, duration: 0.3 }, // D5
            { freq: 659.25, start: 0.6, duration: 0.3 }, // E5
            { freq: 783.99, start: 0.9, duration: 0.4 }, // G5
            { freq: 659.25, start: 1.3, duration: 0.3 }, // E5
            { freq: 783.99, start: 1.6, duration: 0.4 }, // G5
            { freq: 880.00, start: 2.0, duration: 0.6 }  // A5
        ];
        
        notes.forEach(note => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = note.freq;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.08, now + note.start);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + note.start + note.duration);
            
            oscillator.start(now + note.start);
            oscillator.stop(now + note.start + note.duration);
        });
    }
}

const audioSystem = new AudioSystem();

// ---- Preload MP3 sound effects (assets/sfx/*.mp3) ----
// Real SFX replace the synthesized beeps. A small clone-pool per sound lets
// rapid triggers (jump/flap/click) overlap instead of cutting each other off.
// Missing files fall back to synth (preloadSfx flips loaded=false on error).
(function preloadSfxLibrary() {
    const SFX = 'assets/sfx/';
    const lib = [
        ['jump',        'sfx_jump.mp3',        4],
        ['flap',        'sfx_flap.mp3',        4],
        ['land',        'sfx_land.mp3',        3],
        ['collect',     'sfx_collect.mp3',     4],
        ['pop',         'sfx_pop.mp3?v=15',         3],
        ['hit',         'sfx_hit.mp3',         2],
        ['click',       'sfx_click.mp3',       3],
        ['siren',       'sfx_siren.mp3',       1],
        ['victory',     'sfx_victory.mp3',     1],
        ['gameover',    'sfx_gameover.mp3',    1],
        ['dialog',      'sfx_dialog.mp3',      2],
        ['respawn',     'sfx_respawn.mp3',     2],
        ['celebration', 'sfx_celebration.mp3', 1],
        ['whoosh',      'sfx_whoosh.mp3',      2],
        ['camera', 'sfx_camera.mp3?v=16', 2],
        ['dog',    'sfx_dog.mp3',    2],
    ];
    lib.forEach(([name, file, pool]) => audioSystem.preloadSfx(name, SFX + file, pool));
})();

// Music System - background music playback (MP3 via HTML5 Audio)
// 6 треков группы «Дайте Танк (!)» — по одному на каждый игровой сегмент.
// Выбор основан на ТЕКСТАХ песен, а не только на названиях:
//   Старт    → «Утро»    (молодая любовь, «мы слишком молоды, чтобы вести себя мудро»)
//   Глава 1  → «Бардак»  (заброшенный чердак, уют в хаосе, «я никого не вожу сюда»)
//   Глава 2  → «Мы»      («мы валяем дурака», «мы сказочно богаты — ты и я»)
//   Глава 3  → «Телец»   (вождение: «машина — продолжение меня», «давил педали в пол»)
//   Game Over → «Конец»  («всё имеет конец», но «любой конец — это хорошее начало»)
//   Финал    → «Эфир»    («это не повторится», «время летит, как птица», «это прямой эфир»)
// Короткие экраны (интро, завершение главы, галерея) продолжают трек без переключения.
// MP3 файлы лежат в assets/music/ — см. README.txt
const MUSIC_TRACKS = {
    'start':      'assets/music/start.mp3',      // «Утро»   — стартовый экран + интро
    'chapter1':   'assets/music/chapter1.mp3',   // «Бардак» — Глава 1
    'chapter2':   'assets/music/chapter2.mp3',   // «Мы»     — Глава 2
    'chapter3':   'assets/music/chapter3.mp3',   // «Телец»  — Глава 3
    'gameover':   'assets/music/gameover.mp3',   // «Конец»  — Game Over
    'final':      'assets/music/final.mp3'       // «Эфир»   — финал + галерея
};

class MusicSystem {
    constructor() {
        this.audio = new Audio();
        this.audio.loop = true;
        this.audio.volume = 0;
        this.currentTrack = null;
        this.volume = 0.35;
        this.muted = false;
        this.fadeInterval = null;
    }

    play(trackName) {
        if (this.currentTrack === trackName) return;
        const src = MUSIC_TRACKS[trackName];
        if (!src) { this.stop(); return; }

        const switchTrack = () => {
            this.currentTrack = trackName;
            this.audio.src = src;
            this.audio.loop = true;
            this.audio.volume = 0;
            const promise = this.audio.play();
            if (promise) {
                promise.then(() => {
                    this._fadeIn();
                }).catch(() => {
                    // File not found or autoplay blocked — fail silently
                    this.currentTrack = null;
                });
            }
        };

        if (this.currentTrack && !this.audio.paused) {
            this._fadeOut(switchTrack);
        } else {
            switchTrack();
        }
    }

    _fadeIn() {
        const target = this.muted ? 0 : this.volume;
        clearInterval(this.fadeInterval);
        let v = 0;
        this.fadeInterval = setInterval(() => {
            v = Math.min(target, v + target / 20);
            this.audio.volume = v;
            if (v >= target) clearInterval(this.fadeInterval);
        }, 50); // ~1 second fade-in
    }

    _fadeOut(callback) {
        const start = this.audio.volume;
        if (start <= 0) { if (callback) callback(); return; }
        clearInterval(this.fadeInterval);
        let v = start;
        this.fadeInterval = setInterval(() => {
            v = Math.max(0, v - start / 10);
            this.audio.volume = v;
            if (v <= 0) {
                clearInterval(this.fadeInterval);
                this.audio.pause();
                if (callback) callback();
            }
        }, 50); // ~0.5 second fade-out
    }

    stop() {
        this._fadeOut(null);
    }

    toggleMute() {
        this.muted = !this.muted;
        clearInterval(this.fadeInterval);
        this.audio.volume = this.muted ? 0 : this.volume;
        return this.muted;
    }
}

const musicSystem = new MusicSystem();

// Map screen IDs to music tracks — called from showScreen()
// Каждый сегмент = свой трек. Короткие экраны (интро, завершение главы,
// галерея) продолжают трек без переключения — тот же trackName → play() noop.
function playMusicForScreen(screenId) {
    const screenMusic = {
        'start-screen':         'start',     // «Утро»
        'intro-screen':         'start',     // продолжается «Утро»
        'chapter1-screen':      'chapter1',  // «Бардак»
        'chapter1-complete':    'chapter1',  // продолжается «Бардак»
        'chapter2-screen':      'chapter2',  // «Мы»
        'chapter2-complete':    'chapter2',  // продолжается «Мы»
        'chapter3-screen':      'chapter3',  // «Телец»
        'final-screen':         'final',     // «Эфир»
        'gallery-screen':       'final',     // продолжается «Эфир»
        'game-over-screen':     'gameover'   // «Конец»
    };
    const track = screenMusic[screenId];
    if (track) {
        musicSystem.play(track);
    } else {
        musicSystem.stop();
    }
}

// Music toggle button — works on all screens
document.getElementById('music-toggle').addEventListener('click', () => {
    const muted = musicSystem.toggleMute();
    audioSystem.setSfxMuted(muted);
    document.getElementById('music-toggle').textContent = muted ? '🔇' : '🎵';
});

// Start music on first user interaction (browsers block autoplay until a click/touch/keypress).
// This lets «Утро» begin on the start screen — the very first interaction unlocks audio.
function _startMusicOnFirstInteraction() {
    // currentScreen is 'start' before showScreen() is first called → map to 'start-screen'
    const screen = GameState.currentScreen === 'start' ? 'start-screen' : GameState.currentScreen;
    playMusicForScreen(screen);
    document.removeEventListener('click', _startMusicOnFirstInteraction);
    document.removeEventListener('touchstart', _startMusicOnFirstInteraction);
    document.removeEventListener('keydown', _startMusicOnFirstInteraction);
}
document.addEventListener('click', _startMusicOnFirstInteraction);
document.addEventListener('touchstart', _startMusicOnFirstInteraction);
document.addEventListener('keydown', _startMusicOnFirstInteraction);

// Screen Management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    document.getElementById(screenId).classList.remove('hidden');
    GameState.currentScreen = screenId;
    
    // Initialize screen-specific functionality + SFX for key transitions
    if (screenId === 'game-over-screen') {
        audioSystem.playSfx('gameover');
        initGameOverScreen();
    } else if (screenId === 'final-screen') {
        initFinalScreen();
    } else if (screenId === 'chapter1-complete' || screenId === 'chapter2-complete') {
        audioSystem.playSfx('victory');
    }

    // Switch background music based on screen
    playMusicForScreen(screenId);
}

// Start Screen
function initStartScreen() {
    const particleSystem = new ParticleSystem('start-particles');
    
    document.getElementById('start-btn').addEventListener('click', () => {
        audioSystem.playClick();
        
        // Fade out start screen
        const startScreen = document.getElementById('start-screen');
        startScreen.classList.add('fade-out');
        
        // Wait for fade out to complete, then show intro screen
        setTimeout(() => {
            showScreen('intro-screen');
            const introScreen = document.getElementById('intro-screen');
            introScreen.classList.add('fade-in');
            
            // Wait for intro, then start game
            setTimeout(() => {
                introScreen.classList.remove('fade-in');
                
                // Load saved progress
                const savedProgress = localStorage.getItem('chapterProgress');
                console.log('Saved progress:', savedProgress);
                if (savedProgress === '3') {
                    showScreen('chapter3-screen');
                    initChapter3();
                } else if (savedProgress === '2') {
                    showScreen('chapter2-screen');
                    initChapter2();
                } else {
                    showScreen('chapter1-screen');
                    initChapter1();
                }
            }, 3000);
        }, 1000);
    });
}

// Mobile support: tap anywhere to advance dialogs (simulates Enter key)
let _lastDialogTap = 0;
document.addEventListener('touchstart', function(e) {
    if (GameState.dialogActive) {
        const now = Date.now();
        if (now - _lastDialogTap > 300) {
            _lastDialogTap = now;
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        }
    }
}, { passive: true });

// Chapter 1: Platformer Runner
function initChapter1() {
    const canvas = document.getElementById('chapter1-canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Game state
    let score = 0;
    let lives = 5;
    let currentEvent = 0;
    
    // Initialize UI
    document.getElementById('chapter1-lives').textContent = lives;
    
    // Player
    const player = {
        x: 100,
        y: canvas.height - 300,
        width: 160,
        height: 200,
        velocityY: 0,
        jumping: false,
        doubleJump: false,
        grounded: true
    };
    
    // Physics
    const gravity = 1.5;
    const jumpForce = -30;
    const groundY = canvas.height; // floor at the very bottom of the screen (no separate ground bar)
    
    // Collectibles and obstacles
    let collectibles = [];
    let obstacles = [];
    const minObstacleDistance = 300;
    
    // Background layers
    let bgOffset = 0;
    let currentBackground = 'chapter1_piter';
    
    // Story events
    const storyEvents = [
        { score: 300, title: 'Уборка подвала у Паши', dialog: [
            { speaker: 'Я', text: 'Паша, конечно, надристал дристов, напрудил прудов...' },
            { speaker: 'Ты', text: 'Поэтому весь его подвал летит нахуй! 😈😈😈' },
            { speaker: 'Я', text: 'Именно в этот момент я понял, что ты совсем не та чсв девчёнка которой я тебя считал, и на примере досье понял что ты готова прийти на помощь и поддержать' }
        ]},
        { score: 600, title: 'Волевое бросание курить', dialog: [
            { speaker: 'Ты', text: 'Я больше не курю, я хочу новый аромат ☝️🤓' },
            { speaker: 'Я', text: 'А в этот момент, я осознал насколько ты сильная характером девушка, мало того что ты бросила курить когда все курили вокруг, так ты ещё и своей аурой заставила бросить всех остальных, ты правда очень сильный человек' }
        ]},
        { score: 900, title: 'Квартира деда: Миссия выполнима', dialog: [
            { speaker: 'Ты', text: 'У нас есть всего 3 дня, чтобы убрать этот пиздец!' },
            { speaker: 'Я', text: 'БЛЯДСКИЙ ЕБАНЫЙ ШКАФ НЕ ОТТИРАЕТСЯ АААААААА!!!!!!' },
            { speaker: 'Ты', text: 'Зато оставшиеся 2 дня мы провели уютненько 🥰' }
        ]},
        { score: 1200, title: 'Романтический лёд', dialog: [
            { speaker: 'Я', text: 'Ох, держи меня за руку, мне страшно((' },
            { speaker: 'Ты', text: 'Не бойся, я держу 💪' }
        ]},
        { score: 1500, title: 'Кудрявое пати в Мазапарке', dialog: [
            { speaker: 'Я', text: 'Спонтанно сорваться с Никитой и тобой в Мазапарк по среди ночи, было тем что заставило меня чувствовать себя.. живым' },
            { speaker: 'Ты', text: 'Твои волосы слишком прямые, надо тебя закрутить 😈' },
            { speaker: 'Я', text: 'Смотри, теперь я такой же тупой как и ты!' }
        ]}
    ];
    
    // Spawn collectibles
    function spawnCollectible() {
        // Determine background based on score
        let bgImageName = 'chapter1_piter';
        if (score >= 1500) {
            bgImageName = 'chapter1_mazapark';
        } else if (score >= 1200) {
            bgImageName = 'chapter1_ice';
        } else if (score >= 900) {
            bgImageName = 'chapter1_grandpa';
        } else if (score >= 600) {
            bgImageName = 'chapter1_quitting';
        } else if (score >= 300) {
            bgImageName = 'chapter1_basement';
        }
        
        // Spawn bowling pin on mazapark background
        if (bgImageName === 'chapter1_mazapark') {
            collectibles.push({
                x: canvas.width + 100,
                y: groundY - 100 - Math.random() * 200,
                width: 60,
                height: 60,
                emoji: '🎳',
                points: 15,
                name: 'кегля для боулинга',
                imageName: 'bowling_pin'
            });
        } else {
            // Regular collectibles
            const types = [
                { emoji: '🌀', points: 10, name: 'кудрявые локоны', imageName: 'curl' },
                { emoji: '🧋', points: 20, name: 'баббл-ти', imageName: 'bubble_tea' }
            ];
            const type = types[Math.floor(Math.random() * types.length)];
            collectibles.push({
                x: canvas.width + 100,
                y: groundY - 100 - Math.random() * 200,
                width: 60,
                height: 60,
                ...type
            });
        }
    }
    
    // Spawn obstacles
    function spawnObstacle() {
        // Determine obstacle type based on current background
        let bgImageName = 'chapter1_piter';
        if (score >= 1500) {
            bgImageName = 'chapter1_mazapark';
        } else if (score >= 1200) {
            bgImageName = 'chapter1_ice';
        } else if (score >= 900) {
            bgImageName = 'chapter1_grandpa';
        } else if (score >= 600) {
            bgImageName = 'chapter1_quitting';
        } else if (score >= 300) {
            bgImageName = 'chapter1_basement';
        }
        
        // Check if we should spawn trash mountain (only on basement and grandpa backgrounds)
        const spawnTrashMountain = (bgImageName === 'chapter1_basement' || bgImageName === 'chapter1_grandpa');

        // Decide the grandpa obstacle type NOW (trash_mountain vs sofa) so the fairness
        // gap below knows whether the upcoming obstacle is a fast-moving sofa. Before,
        // the `if (spawnTrashMountain)` branch shadowed the grandpa case, so
        // currentWillBeMoving was always false on grandpa and the trash->sofa fairness
        // never fired -- a big trash_mountain could be followed by a sofa too close to dodge.
        const willSpawnSofa = (bgImageName === 'chapter1_grandpa') && (Math.random() < 0.5);
        
        // Determine obstacle size (small: 80x80 or large: 160x160)
        const isLarge = Math.random() < 0.5;
        const obstacleSize = isLarge ? 160 : 80;
        
        // Calculate minimum distance based on obstacle sizes and movement
        let minDistance = 450; // default for small-small non-moving
        if (obstacles.length > 0) {
            const lastObstacle = obstacles[obstacles.length - 1];
            const lastWasLarge = lastObstacle.width >= 160;
            const lastIsMoving = lastObstacle.speed === 20;
            const currentIsMoving = obstacleSize === 160 ? isLarge : (obstacleSize === 80 ? !isLarge : false);
            
            // Check if current obstacle will be moving (based on type)
            let currentWillBeMoving = false;
            if (bgImageName === 'chapter1_grandpa') {
                // sofa drives at the player (speed 20); trash_mountain doesn't move.
                currentWillBeMoving = willSpawnSofa;
            }
            // other chapter1 backgrounds (basement box, quitting, ice, piter) don't move
            
            // Fairness fix: a large non-moving obstacle (big trash_mountain) followed by a
            // fast-moving obstacle (sofa on grandpa bg) was unfair — the player must
            // double-jump the large one and would land right on the approaching sofa.
            // Force a big gap (trash fully off-screen) so the player lands first and can
            // react to (jump over) the approaching sofa. Keeps both logics intact:
            // big trash still needs a double jump; sofa still drives at the player.
            if (lastWasLarge && !lastIsMoving && currentWillBeMoving) {
                minDistance = canvas.width + 300;
            } else if (isLarge && lastWasLarge) {
                if (lastIsMoving && currentWillBeMoving) {
                    minDistance = 1350; // both moving large (min and max)
                } else {
                    minDistance = 900; // large-large
                }
            } else if (isLarge || lastWasLarge) {
                if (lastIsMoving && currentWillBeMoving) {
                    minDistance = 1012; // both moving (one large, one small)
                } else {
                    minDistance = 675; // large-small or small-large
                }
            } else {
                if (lastIsMoving && currentWillBeMoving) {
                    minDistance = 675; // both moving small
                }
                // else small-small: 450 (default)
            }
        }
        
        // Check minimum distance from last obstacle
        if (obstacles.length > 0) {
            const lastObstacle = obstacles[obstacles.length - 1];
            const distance = (canvas.width + 100) - lastObstacle.x;
            if (distance < minDistance) {
                return;
            }
        }
        
        let obstacle;
        if (spawnTrashMountain) {
            // On basement and grandpa backgrounds, randomly spawn either trash mountain or specific obstacle
            if (bgImageName === 'chapter1_basement') {
                if (Math.random() < 0.5) {
                    // Spawn trash mountain with random size
                    obstacle = {
                        x: canvas.width + 100,
                        y: groundY - obstacleSize,
                        width: obstacleSize,
                        height: obstacleSize,
                        emoji: '🗑️',
                        name: 'гора мусора',
                        imageName: 'trash_mountain',
                        isLarge: isLarge
                    };
                } else {
                    // Spawn box
                    obstacle = {
                        x: canvas.width + 100,
                        y: groundY - 80,
                        width: 80,
                        height: 80,
                        emoji: '📦',
                        name: 'коробка',
                        imageName: 'box',
                        isLarge: false
                    };
                }
            } else if (bgImageName === 'chapter1_grandpa') {
                if (!willSpawnSofa) {
                    // Spawn trash mountain with random size
                    obstacle = {
                        x: canvas.width + 100,
                        y: groundY - obstacleSize,
                        width: obstacleSize,
                        height: obstacleSize,
                        emoji: '🗑️',
                        name: 'гора мусора',
                        imageName: 'trash_mountain',
                        isLarge: isLarge
                    };
                } else {
                    // Spawn sofa -- drives at the player at 20px/frame (faster than the
                    // 12px/frame trash/box clutter) so it feels like it's bearing down.
                    obstacle = {
                        x: canvas.width + 100,
                        y: groundY - 80,
                        width: 80,
                        height: 80,
                        emoji: '🛋️',
                        name: 'диван',
                        imageName: 'sofa',
                        isLarge: false,
                        speed: 20
                    };
                }
            } else {
                // Spawn trash mountain with random size
                obstacle = {
                    x: canvas.width + 100,
                    y: groundY - obstacleSize,
                    width: obstacleSize,
                    height: obstacleSize,
                    emoji: '🗑️',
                    name: 'гора мусора',
                    imageName: 'trash_mountain',
                    isLarge: isLarge
                };
            }
        } else if (bgImageName === 'chapter1_mazapark') {
            // Spawn billiard ball or bowling ball on mazapark background
            const isLarge = Math.random() < 0.5;
            const obstacleSize = isLarge ? 160 : 80;
            
            // Calculate minimum distance based on obstacle sizes and movement
            let minDistance = 450; // default for small-small non-moving
            if (obstacles.length > 0) {
                const lastObstacle = obstacles[obstacles.length - 1];
                const lastWasLarge = lastObstacle.width >= 160;
                const lastIsMoving = lastObstacle.speed === 20;
                const currentWillBeMoving = true; // all mazapark obstacles move (speed: 20)
                
                if (isLarge && lastWasLarge) {
                    if (lastIsMoving && currentWillBeMoving) {
                        minDistance = 1350; // both moving large (min and max)
                    } else {
                        minDistance = 900; // large-large
                    }
                } else if (isLarge || lastWasLarge) {
                    if (lastIsMoving && currentWillBeMoving) {
                        minDistance = 1012; // both moving (one large, one small)
                    } else {
                        minDistance = 675; // large-small or small-large
                    }
                } else {
                    if (lastIsMoving && currentWillBeMoving) {
                        minDistance = 675; // both moving small
                    }
                    // else small-small: 450 (default)
                }
            }
            
            // Check minimum distance from last obstacle
            if (obstacles.length > 0) {
                const lastObstacle = obstacles[obstacles.length - 1];
                const distance = (canvas.width + 100) - lastObstacle.x;
                if (distance < minDistance) {
                    return;
                }
            }
            
            if (isLarge) {
                // Spawn bowling ball (large, fast)
                obstacle = {
                    x: canvas.width + 100,
                    y: groundY - obstacleSize,
                    width: obstacleSize,
                    height: obstacleSize,
                    emoji: '🎳',
                    name: 'шар для боулинга',
                    imageName: 'bowling_ball',
                    isLarge: isLarge,
                    speed: 20
                };
            } else {
                // Spawn billiard ball (small, fast)
                obstacle = {
                    x: canvas.width + 100,
                    y: groundY - obstacleSize,
                    width: obstacleSize,
                    height: obstacleSize,
                    emoji: '🎱',
                    name: 'бильярдный шар',
                    imageName: 'billiard_ball',
                    isLarge: isLarge,
                    speed: 20
                };
            }
        } else if (bgImageName === 'chapter1_ice') {
            // Spawn adult or child skater on ice background
            const isAdult = Math.random() < 0.5;
            
            // Calculate minimum distance based on skater types
            let minDistance = 300; // default for child-child
            if (obstacles.length > 0) {
                const lastObstacle = obstacles[obstacles.length - 1];
                const lastWasAdult = lastObstacle.width >= 160;
                
                if (isAdult && lastWasAdult) {
                    minDistance = 600; // adult-adult
                } else if (isAdult || lastWasAdult) {
                    minDistance = 450; // adult-child or child-adult
                }
                // else child-child: 300 (default)
            }
            
            // Check minimum distance from last obstacle
            if (obstacles.length > 0) {
                const lastObstacle = obstacles[obstacles.length - 1];
                const distance = (canvas.width + 100) - lastObstacle.x;
                if (distance < minDistance) {
                    return;
                }
            }
            
            if (isAdult) {
                // Spawn adult skater (same height as player, moves slower)
                obstacle = {
                    x: canvas.width + 100,
                    y: groundY - 200,
                    width: 160,
                    height: 200,
                    emoji: '⛸️',
                    name: 'взрослый на коньках',
                    imageName: 'adult_skater',
                    isLarge: true,
                    speed: 8 // moves slower than normal obstacles (12)
                };
            } else {
                // Spawn child skater (half height of player, moves slower)
                obstacle = {
                    x: canvas.width + 100,
                    y: groundY - 100,
                    width: 80,
                    height: 100,
                    emoji: '⛸️',
                    name: 'ребёнок на коньках',
                    imageName: 'child_skater',
                    isLarge: false,
                    speed: 8 // moves slower than normal obstacles (12)
                };
            }
        } else {
            // Spawn regular obstacles (always small)
            // Only spawn cigarette and captain jack on piter, basement, and quitting backgrounds
            const allowedCigaretteBackgrounds = ['chapter1_piter', 'chapter1_basement', 'chapter1_quitting'];
            const types = allowedCigaretteBackgrounds.includes(bgImageName)
                ? [
                    { emoji: '🚬', name: 'сигареты', imageName: 'cigarette' },
                    { emoji: '📦', name: 'капитан джек', imageName: 'captain_jack' }
                ]
                : [];
            const type = types[Math.floor(Math.random() * types.length)];
            obstacle = {
                x: canvas.width + 100,
                y: groundY - 80,
                width: 80,
                height: 80,
                ...type,
                isLarge: false
            };
        }
        
        obstacles.push(obstacle);
    }
    
    // Show dialog
    function showDialog(dialog) {
        // Prevent multiple dialogs
        if (!GameState.chapter1Running || GameState.dialogActive) return;
        audioSystem.playSfx('dialog');
        
        GameState.dialogActive = true;
        GameState.chapter1Running = false;
        const dialogBox = document.getElementById('chapter1-dialog');
        dialogBox.innerHTML = '';
        dialogBox.classList.remove('hidden');
        
        let index = 0;
        
        // Check if dialog contains the transformation phrase
        const hasTransformationPhrase = dialog.some(line => 
            line.text.includes('Смотри, теперь я такой же тупой как и ты!')
        );
        
        // Handle Enter key to advance dialog
        const handleKeyPress = (e) => {
            if (e.key === 'Enter' && GameState.dialogActive) {
                if (index < dialog.length) {
                    const line = dialog[index];
                    dialogBox.innerHTML = `<p><span class="speaker">${line.speaker}:</span> ${line.text}</p><p class="dialog-hint">Нажмите Enter или коснитесь экрана для продолжения...</p>`;
                    index++;
                } else {
                    dialogBox.classList.add('hidden');
                    dialogBox.innerHTML = '';
                    document.removeEventListener('keydown', handleKeyPress);
                    
                    // Transform player if phrase was in dialog
                    if (hasTransformationPhrase) {
                        GameState.playerTransformed = true;
                    }
                    
                    // Small delay before resuming
                    setTimeout(() => {
                        GameState.dialogActive = false;
                        GameState.chapter1Running = true;
                        
                        // Don't reset player state - preserve momentum
                        // player.grounded = true;
                        // player.jumping = false;
                        // player.doubleJump = false;
                        // player.velocityY = 0;
                        
                        // Force redraw
                        draw();
                        
                        // Force game loop restart (but don't reset player state)
                        gameLoop();
                    }, 100);
                }
            }
        };
        document.addEventListener('keydown', handleKeyPress);
        
        // Show first line
        const line = dialog[0];
        dialogBox.innerHTML = `<p><span class="speaker">${line.speaker}:</span> ${line.text}</p><p class="dialog-hint">Нажмите Enter или коснитесь экрана для продолжения...</p>`;
        index = 1;
    }
    
    // Check story events (now handled by background change in drawBackground)
    function checkStoryEvents() {
        // Dialogs are now triggered by background changes in drawBackground
        // This function is kept for compatibility but does nothing
    }
    
    // Draw background
    function drawBackground() {
        // Select background based on score
        let bgImageName = 'chapter1_piter';
        if (score >= 1500) {
            bgImageName = 'chapter1_mazapark';
        } else if (score >= 1200) {
            bgImageName = 'chapter1_ice';
        } else if (score >= 900) {
            bgImageName = 'chapter1_grandpa';
        } else if (score >= 600) {
            bgImageName = 'chapter1_quitting';
        } else if (score >= 300) {
            bgImageName = 'chapter1_basement';
        }
        
        // Check if background changed and trigger dialog
        if (bgImageName !== currentBackground) {
            currentBackground = bgImageName;
            // Find dialog for this background
            const event = storyEvents.find(e => {
                if (bgImageName === 'chapter1_basement') return e.score === 300;
                if (bgImageName === 'chapter1_quitting') return e.score === 600;
                if (bgImageName === 'chapter1_grandpa') return e.score === 900;
                if (bgImageName === 'chapter1_ice') return e.score === 1200;
                if (bgImageName === 'chapter1_mazapark') return e.score === 1500;
                return false;
            });
            if (event && !GameState.dialogActive) {
                showDialog(event.dialog);
            }
        }
        
        // Try to load background image
        const bgImage = assetLoader.get(bgImageName);
        
        if (bgImage) {
            // Draw image scaled to canvas
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        } else {
            // Fallback to gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#E0F2F1');
            gradient.addColorStop(1, '#FFF0F5');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Parallax buildings
            ctx.fillStyle = '#DB7093';
            for (let i = 0; i < 5; i++) {
                const x = ((i * 200 - bgOffset * 0.2) % (canvas.width + 200)) - 100;
                ctx.fillRect(x, canvas.height - 250, 80, 150);
            }
        }
        
        // Ground fill disabled — the background image already covers the full canvas;
        // the previous solid #FAF0E6 strip covered the bottom of colored scenes and read as a glaring white bar.
        
        // Ground line disabled (paired with the removed solid ground strip).
    }
    
    // Draw player
    function drawPlayer() {
        const kristinaImg = assetLoader.get('kristina');
        const youImg = assetLoader.get('you');
        const youCurlyImg = assetLoader.get('you_curly');
        
        if (kristinaImg && youImg) {
            // Draw images
            ctx.drawImage(kristinaImg, player.x, player.y, 100, 200);
            
            // Use curly version if transformed
            if (GameState.playerTransformed && youCurlyImg) {
                ctx.drawImage(youCurlyImg, player.x + 100, player.y, 100, 200);
            } else {
                ctx.drawImage(youImg, player.x + 100, player.y, 100, 200);
            }
        } else {
            // Fallback to rectangles
            ctx.fillStyle = '#DB7093';
            ctx.fillRect(player.x, player.y, 80, 200);
            
            ctx.fillStyle = '#2F4F4F';
            ctx.fillRect(player.x + 80, player.y, 80, 200);
            
            // Holding hands (only for fallback)
            ctx.strokeStyle = '#2F4F4F';
            ctx.lineWidth = 12;
            ctx.beginPath();
            ctx.moveTo(player.x + 80, player.y + 120);
            ctx.lineTo(player.x + 100, player.y + 120);
            ctx.stroke();
        }
    }
    
    // Draw collectibles
    function drawCollectibles() {
        collectibles.forEach(c => {
            const img = assetLoader.get(c.imageName);
            if (img) {
                ctx.drawImage(img, c.x, c.y, c.width, c.height);
            } else {
                ctx.font = '30px Arial';
                ctx.fillText(c.emoji, c.x, c.y + 30);
            }
        });
    }
    
    // Draw obstacles
    function drawObstacles() {
        obstacles.forEach(o => {
            const img = assetLoader.get(o.imageName);
            if (img) {
                ctx.drawImage(img, o.x, o.y, o.width, o.height);
            } else {
                ctx.font = '35px Arial';
                ctx.fillText(o.emoji, o.x, o.y + 35);
            }
        });
    }
    
    // Update game
    function update() {
        if (!GameState.chapter1Running || GameState.dialogActive) return;
        
        // Move background
        bgOffset += 3;
        
        // Apply gravity
        player.velocityY += gravity;
        player.y += player.velocityY;
        
        // Ground collision
        if (player.y >= groundY - player.height) {
            const wasAirborne = !player.grounded;
            player.y = groundY - player.height;
            player.velocityY = 0;
            if (wasAirborne) audioSystem.playSfx('land', { volume: 0.6 });
            player.grounded = true;
            player.jumping = false;
            player.doubleJump = false;
        }
        
        // Move collectibles
        collectibles.forEach(c => {
            c.x -= 12;
        });
        
        // Move obstacles
        obstacles.forEach(o => {
            const speed = o.speed || 12;
            o.x -= speed;
        });
        
        // Remove off-screen items
        collectibles = collectibles.filter(c => c.x > -200);
        obstacles = obstacles.filter(o => o.x > -200);
        
        // Spawn new items
        if (Math.random() < 0.02) spawnCollectible();
        
        // Spawn obstacles with maximum distance check
        let forceSpawnObstacle = false;
        if (obstacles.length > 0) {
            const lastObstacle = obstacles[obstacles.length - 1];
            const distance = (canvas.width + 100) - lastObstacle.x;
            if (distance > 1200) {
                forceSpawnObstacle = true;
            }
        }
        
        if (forceSpawnObstacle || Math.random() < 0.01) {
            spawnObstacle();
        }
        
        // Collision detection - collectibles
        collectibles = collectibles.filter(c => {
            if (player.x < c.x + c.width &&
                player.x + player.width > c.x &&
                player.y < c.y + c.height &&
                player.y + player.height > c.y) {
                score += c.points;
                audioSystem.playCollect();
                document.getElementById('chapter1-score').textContent = score;
                checkStoryEvents();
                return false;
            }
            return true;
        });
        
        // Collision detection - obstacles
        obstacles = obstacles.filter(o => {
            if (player.x < o.x + o.width &&
                player.x + player.width > o.x &&
                player.y < o.y + o.height &&
                player.y + player.height > o.y) {
                lives--;
                audioSystem.playHit();
                document.getElementById('chapter1-lives').textContent = lives;
                if (lives <= 0) {
                    GameState.chapter1Running = false;
                    showScreen('game-over-screen');
                }
                return false;
            }
            return true;
        });
        
        // Check chapter completion
        if (score >= 1800) {
            GameState.chapter1Running = false;
            localStorage.setItem('chapterProgress', '1');
            showScreen('chapter1-complete');
        }
    }
    
    // Draw game
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBackground();
        drawCollectibles();
        drawObstacles();
        drawPlayer();
    }
    
    // Game loop
    function gameLoop() {
        update();
        draw();
        if (GameState.chapter1Running) {            
            requestAnimationFrame(gameLoop);
        }
    }
    
    // Input handling
    function jump() {
        if (!GameState.chapter1Running || GameState.dialogActive) return;
        
        if (player.grounded) {
            player.velocityY = jumpForce;
            player.grounded = false;
            player.jumping = true;
            audioSystem.playSfx('jump');
        } else if (player.jumping && !player.doubleJump) {
            player.velocityY = jumpForce * 0.8;
            player.doubleJump = true;
            audioSystem.playSfx('jump');
        }
    }
    
    // Keyboard
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && GameState.currentScreen === 'chapter1-screen') {
            e.preventDefault();
            jump();
        }
    });
    
    // Touch/Click
    canvas.addEventListener('click', () => {
        if (GameState.currentScreen === 'chapter1-screen') {
            jump();
        }
    });
    
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (GameState.currentScreen === 'chapter1-screen') {
            jump();
        }
    });
    
    // Start game
    gameLoop();
    
    // Chapter complete button
    document.getElementById('chapter2-btn').addEventListener('click', () => {
        audioSystem.playClick();
        localStorage.setItem('chapterProgress', '2');
        showScreen('chapter2-screen');
        initChapter2();
    });
}

// Chapter 2: Multi-section Runner
function initChapter2() {
    const canvas = document.getElementById('chapter2-canvas');
    const ctx = canvas.getContext('2d');
    
    // Set game state to running
    GameState.chapter2Running = true;
    
    // Set canvas size
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.removeEventListener('resize', resizeCanvas);
    window.addEventListener('resize', resizeCanvas);
    
    // Game state
    let score = 0;
    let lives = 5;
    let currentSection = 0;
    let currentEvent = 0;
    let gravityInverted = false;
    let moscowStartScore = 1800; // score captured when entering the Moscow section; death there respawns at section start instead of the whole chapter
    
    // Initialize UI
    document.getElementById('chapter2-lives').textContent = lives;
    
    // Player
    const player = {
        x: 100,
        y: canvas.height - 300,
        width: 160,
        height: 200,
        velocityY: 0,
        velocityX: 0,
        jumping: false,
        doubleJump: false,
        grounded: true,
        visible: true,
        invincible: false
    };
    
    // Physics
    const gravity = 1.5;
    const jumpForce = -30;
    const groundY = canvas.height; // floor at the very bottom of the screen (no separate ground bar)
    const ceilingY = 50;
    
    // Collectibles and obstacles
    let collectibles = [];
    let obstacles = [];
    let platforms = [];
    let platformIdCounter = 0;
    
    // Taxi (for lighthouse section)
    let taxi = {
        x: canvas.width + 200,
        y: groundY - 150,
        width: 300,
        height: 150,
        speed: 12,
        stopped: false,
        boarded: false,
        leaving: false,
        approaching: false
    };
    
    // Kristina on platform (for etazhi section)
    let kristinaOnPlatform = null;
    let kristinaDialogShown = false;
    let etazhiIntroShown = false;
    let lighthouseIntroShown = false;
    let birthdayDialogShown = false;
    let birthdayDialogPart2Shown = false;
    let moscowDialogShown = false;
    let cakeFaceActive = false;
    let forceKristinaOnNextPlatform = false;
    let kristinaPlatformSpawned = false;
    let lastScore = 0;
    
    // Background
    let bgOffset = 0;
    let currentBackground = '';
    
    // Sections
    const sections = [
        { name: 'Маяк', background: '#E0F2F1', gravity: false, endScore: 600 },
        { name: 'Этажи', background: '#FAF0E6', gravity: false, endScore: 1200 },
        { name: 'День Рождения', background: '#FFE4E1', gravity: false, endScore: 1800 },
        { name: 'Москва-Сити', background: '#FFF0F5', gravity: true, endScore: 2400 }
    ];
    
    // Story events
    const storyEvents = [];
    
    // Spawn collectibles
    function spawnCollectible() {
        // First section (lighthouse): only snowflakes (phones)
        if (currentSection === 0) {
            collectibles.push({
                x: canvas.width + 100,
                y: gravityInverted ? ceilingY + 100 + Math.random() * 200 : groundY - 100 - Math.random() * 200,
                width: 60,
                height: 60,
                emoji: '❄️',
                points: 10,
                name: 'снежинка',
                imageName: 'snowflake'
            });
            return;
        }
        
        // Second section (etazhi): collectibles are spawned with platforms, not separately
        if (currentSection === 1) {
            return;
        }
        
        // Third section (birthday): balloons
        if (currentSection === 2) {
            const balloonColors = ['🎈', '🎈', '🎈', '🎈', '🎈'];
            const colorIndex = Math.floor(Math.random() * balloonColors.length);
            collectibles.push({
                x: canvas.width + 100,
                y: gravityInverted ? ceilingY + 100 + Math.random() * 200 : groundY - 100 - Math.random() * 200,
                width: 60,
                height: 60,
                emoji: '🎈',
                points: 15,
                name: 'шарик',
                imageName: 'balloon'
            });
            return;
        }
        
        // Fourth section (moscow): no collectibles (Flappy Bird style)
        if (currentSection === 3) {
            return;
        }
    }
    
    // Spawn platforms (for etazhi section)
    function spawnPlatform(forceSpawn = false) {
        if (currentSection !== 1) return;
        
        let platformX = canvas.width + 100;
        
        // Calculate position based on last platform to ensure 300-600px gap
        if (platforms.length > 0) {
            const lastPlatform = platforms[platforms.length - 1];
            const gap = 300 + Math.random() * 300; // Random gap between 300-600
            platformX = lastPlatform.x + lastPlatform.width + gap;
            
            // Skip all checks if forcing spawn for Kristina or kristinaPlatformSpawned
            if (!forceSpawn && !forceKristinaOnNextPlatform && !kristinaPlatformSpawned) {
                const verticalDistance = Math.abs((groundY - 100 - Math.random() * 300) - lastPlatform.y);
                
                // Only check vertical distance if not forcing spawn
                if (verticalDistance < 100) {
                    return;
                }
            }
        }
        
        // Ensure platform is outside the screen
        if (platformX < canvas.width + 200) {
            platformX = canvas.width + 200;
        }
        
        // Generate platforms at different heights (above guard level)
        const platformY = groundY - 250 - Math.random() * 300;
        const platformId = platformIdCounter++;
        
        // Check if Kristina should spawn on this platform (at 1200 score or forced)
        let spawnKristina = false;
        if (forceSpawn || forceKristinaOnNextPlatform || kristinaPlatformSpawned) {
            spawnKristina = true;
            forceKristinaOnNextPlatform = false; // Reset flag
            kristinaPlatformSpawned = false; // Reset flag
            kristinaOnPlatform = {
                x: platformX + 50,
                y: platformY - 200,
                width: 100,
                height: 200,
                platformId: platformId
            };
        } else if (score >= 1200 && !kristinaOnPlatform && !kristinaDialogShown) {
            spawnKristina = true;
            kristinaOnPlatform = {
                x: platformX + 50,
                y: platformY - 200,
                width: 100,
                height: 200,
                platformId: platformId
            };
        }
        
        // Generate collectibles on platform (1-2 items) - but not if Kristina is spawning
        let numCollectibles = 0;
        if (!spawnKristina) {
            numCollectibles = 1 + Math.floor(Math.random() * 2); // 1 or 2
        }
        
        const types = [
            { emoji: '🦄', points: 20, name: 'MLP карточка', imageName: 'mlp_card' },
            { emoji: '🍷', points: 10, name: 'Frambini', imageName: 'frambini' }
        ];
        
        for (let i = 0; i < numCollectibles; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            collectibles.push({
                x: platformX + 20 + i * 80,
                y: platformY - 60,
                width: 60,
                height: 60,
                ...type,
                platformId: platformId
            });
        }
        
        platforms.push({
            id: platformId,
            x: platformX,
            y: platformY,
            width: 200,
            height: 30,
            emoji: '📦',
            hasCollectible: numCollectibles > 0
        });
    }
    
    // Spawn obstacles
    function spawnObstacle() {
        // First section (lighthouse): only snowdrifts
        if (currentSection === 0) {
            // Determine obstacle size (small: 80x80 or large: 160x160)
            const isLarge = Math.random() < 0.5;
            const obstacleSize = isLarge ? 160 : 80;
            
            // Calculate minimum distance based on obstacle sizes and movement
            let minDistance = 450; // default for small-small non-moving
            if (obstacles.length > 0) {
                const lastObstacle = obstacles[obstacles.length - 1];
                const lastWasLarge = lastObstacle.width >= 160;
                const lastIsMoving = lastObstacle.speed === 20;
                const currentWillBeMoving = false; // snowdrifts don't move (no speed property)
                
                if (isLarge && lastWasLarge) {
                    if (lastIsMoving && currentWillBeMoving) {
                        minDistance = 1350; // both moving large (min and max)
                    } else {
                        minDistance = 900; // large-large
                    }
                } else if (isLarge || lastWasLarge) {
                    if (lastIsMoving && currentWillBeMoving) {
                        minDistance = 1012; // both moving (one large, one small)
                    } else {
                        minDistance = 675; // large-small or small-large
                    }
                } else {
                    if (lastIsMoving && currentWillBeMoving) {
                        minDistance = 675; // both moving small
                    }
                    // else small-small: 450 (default)
                }
            }
            
            // Check minimum distance from last obstacle
            if (obstacles.length > 0) {
                const lastObstacle = obstacles[obstacles.length - 1];
                const distance = (canvas.width + 100) - lastObstacle.x;
                if (distance < minDistance) {
                    return;
                }
            }
            
            obstacles.push({
                x: canvas.width + 100,
                y: gravityInverted ? ceilingY : groundY - obstacleSize,
                width: obstacleSize,
                height: obstacleSize,
                emoji: '⛄',
                name: 'сугроб',
                imageName: 'snowdrift',
                isLarge: isLarge
            });
            return;
        }
        
        // Second section (etazhi): only guards
        if (currentSection === 1) {
            // Check minimum distance from last obstacle
            if (obstacles.length > 0) {
                const lastObstacle = obstacles[obstacles.length - 1];
                const distance = (canvas.width + 100) - lastObstacle.x;
                if (distance < 450) {
                    return;
                }
            }
            
            obstacles.push({
                x: canvas.width + 100,
                y: gravityInverted ? ceilingY : groundY - 200,
                width: 100,
                height: 200,
                emoji: '👮',
                name: 'охранник',
                imageName: 'guard'
            });
            return;
        }
        
        // Third section (birthday): only cakes
        if (currentSection === 2) {
            // Determine obstacle size (cakes are always small: 80x80)
            const obstacleSize = 80;
            
            // Calculate minimum distance based on obstacle sizes and movement
            let minDistance = 450; // default for small-small non-moving
            if (obstacles.length > 0) {
                const lastObstacle = obstacles[obstacles.length - 1];
                const lastWasLarge = lastObstacle.width >= 160;
                const lastIsMoving = lastObstacle.speed === 20;
                const currentWillBeMoving = false; // cakes don't move (no speed property)
                
                if (lastWasLarge) {
                    if (lastIsMoving && currentWillBeMoving) {
                        minDistance = 1012; // both moving (one large, one small)
                    } else {
                        minDistance = 675; // large-small
                    }
                } else {
                    if (lastIsMoving && currentWillBeMoving) {
                        minDistance = 675; // both moving small
                    }
                    // else small-small: 450 (default)
                }
            }
            
            // Check minimum distance from last obstacle
            if (obstacles.length > 0) {
                const lastObstacle = obstacles[obstacles.length - 1];
                const distance = (canvas.width + 100) - lastObstacle.x;
                if (distance < minDistance) {
                    return;
                }
            }
            
            obstacles.push({
                x: canvas.width + 100,
                y: gravityInverted ? ceilingY : groundY - 80,
                width: 80,
                height: 80,
                emoji: '🎂',
                name: 'торт',
                imageName: 'cake'
            });
            return;
        }
        
        // Fourth section (moscow): Flappy Bird style with towers
        if (currentSection === 3) {
            // Fixed horizontal distance between towers
            const fixedDistance = 580; // wider spacing -> more reaction time between towers
            let spawnX = canvas.width + 100;
            if (obstacles.length > 0) {
                const lastObstacle = obstacles[obstacles.length - 1];
                const calculatedX = lastObstacle.x + fixedDistance;
                // Always use the calculated position to maintain fixed distance
                spawnX = calculatedX;
            }
            
            // Random gap position for the passage
            const gapHeight = Math.min(520, canvas.height - 160); // generous passage, capped so both towers stay on-screen
            const gapY = 100 + Math.random() * Math.max(0, canvas.height - gapHeight - 200);
            
            // Random tower type
            const towerTypes = ['tower', 'tower1', 'tower2', 'tower3', 'tower4'];
            const randomTower = towerTypes[Math.floor(Math.random() * towerTypes.length)];
            
            // Top tower
            obstacles.push({
                x: spawnX,
                y: 0,
                width: 80,
                height: gapY,
                emoji: '🏢',
                name: 'башня',
                imageName: randomTower,
                isTop: true,
                passed: false
            });
            
            // Bottom tower
            obstacles.push({
                x: spawnX,
                y: gapY + gapHeight,
                width: 80,
                height: canvas.height - gapY - gapHeight,
                emoji: '🏢',
                name: 'башня',
                imageName: randomTower,
                isTop: false,
                passed: false
            });
            return;
        }
        
        // Default: no obstacles for other sections that don't have specific logic
    }
    
    // Show dialog
    function showDialog(dialog, callback = null) {
        // Prevent multiple dialogs
        if (!GameState.chapter2Running || GameState.dialogActive) return;
        audioSystem.playSfx('dialog');
        
        GameState.dialogActive = true;
        GameState.chapter2Running = false;
        const dialogBox = document.getElementById('chapter2-dialog');
        dialogBox.innerHTML = '';
        dialogBox.classList.remove('hidden');
        
        let index = 0;
        
        // Handle Enter key to advance dialog
        const handleKeyPress = (e) => {
            if (e.key === 'Enter' && GameState.dialogActive) {
                if (index < dialog.length) {
                    const line = dialog[index];
                    dialogBox.innerHTML = `<p><span class="speaker">${line.speaker}:</span> ${line.text}</p><p class="dialog-hint">Нажмите Enter или коснитесь экрана для продолжения...</p>`;
                    index++;
                } else {
                    dialogBox.classList.add('hidden');
                    dialogBox.innerHTML = '';
                    document.removeEventListener('keydown', handleKeyPress);
                    
                    // Small delay before resuming
                    setTimeout(() => {
                        GameState.dialogActive = false;
                        GameState.chapter2Running = true;
                        
                        // Call callback if provided
                        if (callback) {
                            callback();
                        }
                        
                        // Force redraw
                        draw();
                        
                        // Force game loop restart (but don't reset player state)
                        gameLoop();
                    }, 100);
                }
            }
        };
        document.addEventListener('keydown', handleKeyPress);
        
        // Show first line
        const line = dialog[0];
        dialogBox.innerHTML = `<p><span class="speaker">${line.speaker}:</span> ${line.text}</p><p class="dialog-hint">Нажмите Enter или коснитесь экрана для продолжения...</p>`;
        index = 1;
    }
    
    // Check story events
    function checkStoryEvents() {
        if (!GameState.chapter2Running) return;
        for (let i = currentEvent; i < storyEvents.length; i++) {
            if (score >= storyEvents[i].score) {
                currentEvent = i + 1;
                showDialog(storyEvents[i].dialog);
                break;
            }
        }
    }
    
    // Check section change
    function checkSection() {
        // Show intro dialog when entering lighthouse section
        if (currentSection === 0 && !lighthouseIntroShown) {
            lighthouseIntroShown = true;
            showDialog([
                { speaker: 'Я', text: 'Маяк очень атмосферный, спасибо тебе за такой сюрприз ❤️' },
                { speaker: 'Ты', text: 'О нет! Где мой телефон?! Кажется, он выпал у ресторане!' },
                { speaker: 'Я', text: 'Ебучий случай! Поворачивай назад!' }
            ]);
            return;
        }
        
        // Don't auto-change section in lighthouse section (let taxi logic handle it)
        if (currentSection === 0) return;
        
        // Don't auto-change section in etazhi section (let Kristina dialog handle it)
        if (currentSection === 1) {
            // Show intro dialog when entering etazhi section
            if (!etazhiIntroShown) {
                etazhiIntroShown = true;
                showDialog([
                    { speaker: 'Я', text: 'Мы поссорились прямо перед 14 февраля... Это была наша первая крупная ссора, и я чувствовал себя как дерьмо, в тот день я понял что ты и твоё настроение для меня действительно очень дороги' }
                ]);
            }
            return;
        }
        
        for (let i = currentSection; i < sections.length; i++) {
            if (score >= sections[i].endScore) {
                currentSection = i + 1;
                if (currentSection < sections.length) {
                    gravityInverted = sections[currentSection].gravity;
                    if (currentSection === 3) {
                        moscowStartScore = score; // capture entry score for the Moscow sub-checkpoint
                    }
                }
                break;
            }
        }
    }
    
    // Draw background
    function drawBackground() {
        const section = sections[Math.min(currentSection, sections.length - 1)];
        
        // Try to load background image based on section
        let bgImage = null;
        let bgImageName = 'chapter2_lighthouse';
        if (currentSection === 0) {
            bgImage = assetLoader.get('chapter2_lighthouse');
            bgImageName = 'chapter2_lighthouse';
        } else if (currentSection === 1) {
            bgImage = assetLoader.get('chapter2_etazhi');
            bgImageName = 'chapter2_etazhi';
        } else if (currentSection === 2) {
            bgImage = assetLoader.get('chapter2_birthday');
            bgImageName = 'chapter2_birthday';
        } else if (currentSection === 3) {
            bgImage = assetLoader.get('chapter2_moscow');
            bgImageName = 'chapter2_moscow';
        }
        
        // Check if background changed and trigger dialog
        if (bgImageName !== currentBackground) {
            currentBackground = bgImageName;
            // Trigger birthday dialog part 1 when entering birthday section
            if (bgImageName === 'chapter2_birthday' && !birthdayDialogShown && !GameState.dialogActive) {
                birthdayDialogShown = true;
                showDialog([
                    { speaker: 'Я', text: 'Эх, ко мне в 12 ночи никто не приедет...(((' },
                    { speaker: 'Ты', text: 'Сюрприз! Мы взорвали твой подъезд ебаными шарами' },
                    { speaker: 'Я', text: 'Вся площадка в противопехотных шариках! Это лучший...' }
                ], () => {
                    // After part 1, change player sprite and show part 2
                    cakeFaceActive = true;
                    setTimeout(() => {
                        showDialog([
                            { speaker: 'Я', text: 'И в тот момент стоя в парадной под звуки взрывающихся шаров, с тортом на лице, я понял насколько тебе не плевать, и насколько ты готова отдавать свои силы и энергию ради счастья своего партнёра' }
                        ], () => {
                            birthdayDialogPart2Shown = true;
                        });
                    }, 500);
                });
            }
            // Reset cake face when leaving birthday section
            if (bgImageName === 'chapter2_moscow' && cakeFaceActive) {
                cakeFaceActive = false;
            }
            // Trigger moscow dialog when entering moscow section
            if (bgImageName === 'chapter2_moscow' && !moscowDialogShown && !GameState.dialogActive) {
                moscowDialogShown = true;
                showDialog([
                    { speaker: 'Ты', text: 'Спасибо, что отвез меня в город моей мечты 😊' },
                    { speaker: 'Я', text: 'В тот момент когда я расплакался смотря на сити, я был воистину счастлив, ведь рядом со мной был человек которого я безумно люблю, а над моей головой возвышался символ, который кроме как "свобода", я не могу никак описать' },
                    { speaker: 'Ты', text: 'Ну всё, всё, не плачь, иди обниму 😘' }
                ]);
            }
        }
        
        if (bgImage) {
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        } else {
            // Fallback to gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, section.background);
            gradient.addColorStop(1, '#FFF0F5');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Section-specific elements
            if (currentSection === 0) {
                // Lighthouse
                ctx.fillStyle = '#FF6B6B';
                ctx.fillRect(canvas.width - 200, canvas.height - 300, 40, 200);
                ctx.fillStyle = '#FFE66D';
                ctx.beginPath();
                ctx.arc(canvas.width - 180, canvas.height - 320, 20, 0, Math.PI * 2);
                ctx.fill();
            } else if (currentSection === 2) {
                // Moscow City buildings
                ctx.fillStyle = '#2F4F4F';
                for (let i = 0; i < 3; i++) {
                    const x = ((i * 150 - bgOffset * 0.3) % (canvas.width + 200)) - 100;
                    ctx.fillRect(x, canvas.height - 350, 60, 250);
                }
            }
        }
        
        // Ground/Ceiling fill disabled — let the background image show through (top and bottom);
        // the previous solid #FAF0E6 strip covered the bottom/top of colored scenes and read as a glaring white bar.
    }
    
    // Draw taxi (only in lighthouse section)
    function drawTaxi() {
        if (currentSection !== 0) return;
        
        const taxiImg = assetLoader.get('taxi');
        if (taxiImg) {
            ctx.drawImage(taxiImg, taxi.x, taxi.y, taxi.width, taxi.height);
        } else {
            // Fallback to yellow rectangle
            ctx.fillStyle = '#FFE66D';
            ctx.fillRect(taxi.x, taxi.y, taxi.width, taxi.height);
            ctx.fillStyle = '#FF6B6B';
            ctx.fillRect(taxi.x + 10, taxi.y + 10, 30, 30);
        }
    }
    
    // Draw platforms (for etazhi section)
    function drawPlatforms() {
        if (currentSection !== 1) return;
        
        platforms.forEach(p => {
            const platformImg = assetLoader.get('platform');
            if (platformImg) {
                ctx.drawImage(platformImg, p.x, p.y, p.width, p.height);
            } else {
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(p.x, p.y, p.width, p.height);
                ctx.strokeStyle = '#5D3A1A';
                ctx.lineWidth = 3;
                ctx.strokeRect(p.x, p.y, p.width, p.height);
                
                // Draw box emoji
                ctx.font = '25px Arial';
                ctx.fillText(p.emoji, p.x + p.width / 2 - 12, p.y + 22);
            }
        });
        
        // Draw Kristina on platform
        if (kristinaOnPlatform) {
            const kristinaImg = assetLoader.get('kristina');
            if (kristinaImg) {
                ctx.drawImage(kristinaImg, kristinaOnPlatform.x, kristinaOnPlatform.y, kristinaOnPlatform.width, kristinaOnPlatform.height);
            } else {
                ctx.fillStyle = '#FFB6C1';
                ctx.fillRect(kristinaOnPlatform.x, kristinaOnPlatform.y, kristinaOnPlatform.width, kristinaOnPlatform.height);
                ctx.font = '30px Arial';
                ctx.fillText('👩', kristinaOnPlatform.x + 15, kristinaOnPlatform.y + 60);
            }
        }
    }
    
    // Draw player
    function drawPlayer() {
        if (!player.visible) return;
        
        const kristinaImg = assetLoader.get('kristina');
        const youImg = assetLoader.get('you');
        const youCurlyImg = assetLoader.get('you_curly');
        const youCakeFaceImg = assetLoader.get('you_cake_face');
        
        // In etazhi section (section 1), only show curly you
        if (currentSection === 1) {
            if (youCurlyImg) {
                ctx.drawImage(youCurlyImg, player.x, player.y, 100, 200);
            } else {
                ctx.fillStyle = '#2F4F4F';
                ctx.fillRect(player.x, player.y, 80, 200);
            }
        } else {
            if (kristinaImg && youCurlyImg) {
                ctx.drawImage(kristinaImg, player.x, player.y, 100, 200);
                
                // Use cake face version if active
                if (cakeFaceActive && youCakeFaceImg) {
                    ctx.drawImage(youCakeFaceImg, player.x + 100, player.y, 100, 200);
                } else {
                    ctx.drawImage(youCurlyImg, player.x + 100, player.y, 100, 200);
                }
            } else {
                ctx.fillStyle = '#DB7093';
                ctx.fillRect(player.x, player.y, 80, 200);
                
                ctx.fillStyle = '#2F4F4F';
                ctx.fillRect(player.x + 80, player.y, 80, 200);
                
                // Holding hands (only for fallback)
                ctx.strokeStyle = '#2F4F4F';
                ctx.lineWidth = 12;
                ctx.beginPath();
                ctx.moveTo(player.x + 80, player.y + 120);
                ctx.lineTo(player.x + 100, player.y + 120);
                ctx.stroke();
            }
        }
    }
    
    // Draw collectibles
    function drawCollectibles() {
        collectibles.forEach(c => {
            const img = assetLoader.get(c.imageName);
            if (img) {
                ctx.drawImage(img, c.x, c.y, c.width, c.height);
            } else {
                ctx.font = '30px Arial';
                ctx.fillText(c.emoji, c.x, c.y + 30);
            }
        });
    }
    
    // Draw obstacles
    function drawObstacles() {
        obstacles.forEach(o => {
            // Draw towers for Moscow section (Flappy Bird style)
            if (currentSection === 3 && o.name === 'башня') {
                const img = assetLoader.get(o.imageName);
                if (img) {
                    if (o.isTop) {
                        // Flip top towers upside down
                        ctx.save();
                        ctx.translate(o.x + o.width / 2, o.y + o.height / 2);
                        ctx.rotate(Math.PI);
                        ctx.drawImage(img, -o.width / 2, -o.height / 2, o.width, o.height);
                        ctx.restore();
                    } else {
                        // Bottom towers drawn normally
                        ctx.drawImage(img, o.x, o.y, o.width, o.height);
                    }
                } else {
                    // Fallback to rectangle if no image
                    ctx.fillStyle = '#4A4A4A';
                    ctx.fillRect(o.x, o.y, o.width, o.height);
                    
                    // Add border to make hitbox visible
                    ctx.strokeStyle = '#2A2A2A';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(o.x, o.y, o.width, o.height);
                    
                    // Add some visual detail
                    ctx.fillStyle = '#5A5A5A';
                    ctx.fillRect(o.x + 10, o.y + 10, o.width - 20, o.height - 20);
                }
            } else {
                const img = assetLoader.get(o.imageName);
                if (img) {
                    ctx.drawImage(img, o.x, o.y, o.width, o.height);
                } else {
                    ctx.font = '35px Arial';
                    ctx.fillText(o.emoji, o.x, o.y + 35);
                }
            }
        });
    }
    
    // Update game
    function update() {
        if (!GameState.chapter2Running) return;
        
        bgOffset += 3;
        checkSection();
        
        // Horizontal movement (for etazhi section - platformer)
        if (currentSection === 1) {
            const moveSpeed = 5;
            if (keys['ArrowLeft'] || keys['KeyA']) {
                player.velocityX = -moveSpeed;
            } else if (keys['ArrowRight'] || keys['KeyD']) {
                player.velocityX = moveSpeed;
            } else {
                player.velocityX = 0;
            }
            player.x += player.velocityX;
            
            // Keep player in bounds horizontally
            if (player.x < 0) player.x = 0;
            if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;
        }
        
        // Taxi logic (only in lighthouse section)
        if (currentSection === 0) {
            if (!taxi.stopped && !taxi.leaving) {
                // Taxi moves with the same speed as obstacles
                taxi.x -= taxi.speed;
                
                // Keep taxi at the right edge of the screen
                if (taxi.x < canvas.width - 300) {
                    taxi.x = canvas.width - 300;
                }
                
                // Stop taxi when score reaches 600
                if (score >= 600) {
                    taxi.stopped = true;
                    taxi.x = canvas.width - 300;
                    player.invincible = true;
                    // After a short delay, taxi starts approaching
                    setTimeout(() => {
                        taxi.approaching = true;
                        taxi.speed = 20;
                    }, 500);
                }
            } else if (taxi.stopped && taxi.approaching && !taxi.boarded) {
                // Taxi approaches player (moves left)
                taxi.x -= taxi.speed;
                
                // Check collision with player (vertical trigger bar)
                if (player.x < taxi.x + taxi.width &&
                    player.x + player.width > taxi.x) {
                    taxi.boarded = true;
                    taxi.leaving = true;
                    taxi.speed = 20;
                    // Hide player (they boarded the taxi)
                    player.visible = false;
                }
            } else if (taxi.leaving) {
                // Taxi leaves to the right
                taxi.x += taxi.speed;
                
                // Teleport to next section when taxi goes off screen
                if (taxi.x > canvas.width + 200) {
                    currentSection = 1;
                    audioSystem.playSfx('whoosh');
                    gravityInverted = sections[1].gravity;
                    player.x = 100;
                    player.y = groundY - 200;
                    player.visible = true;
                    player.invincible = false;
                    taxi.x = canvas.width + 200;
                    taxi.stopped = false;
                    taxi.boarded = false;
                    taxi.leaving = false;
                    taxi.approaching = false;
                    taxi.speed = 12;
                    
                    // Clear collectibles and obstacles from previous section
                    collectibles = [];
                    obstacles = [];
                    platforms = [];
                }
            }
        }
        
        // Apply gravity
        if (currentSection === 3) {
            // Flappy Bird style gravity for Moscow section
            player.velocityY += 0.5; // Constant downward acceleration
            if (player.velocityY > 9) player.velocityY = 9; // terminal velocity - a missed tap no longer spirals into an unrecoverable dive
            player.y += player.velocityY;
            
            // Ceiling collision
            if (player.y <= 0) {
                player.y = 0;
                player.velocityY = 0;
            }
            
            // Ground collision
            if (player.y >= canvas.height - player.height) {
                player.y = canvas.height - player.height;
                player.velocityY = 0;
            }
        } else if (gravityInverted) {
            player.velocityY -= gravity;
            player.y += player.velocityY;
            
            // Ceiling collision
            if (player.y <= ceilingY) {
                player.y = ceilingY;
                player.velocityY = 0;
                player.grounded = true;
                player.jumping = false;
                player.doubleJump = false;
            }
        } else {
            player.velocityY += gravity;
            player.y += player.velocityY;
            
            // Ground collision
            if (player.y >= groundY - player.height) {
                player.y = groundY - player.height;
                player.velocityY = 0;
                player.grounded = true;
                player.jumping = false;
                player.doubleJump = false;
            }
        }
        
        // Keep player in bounds
        if (player.y < ceilingY) player.y = ceilingY;
        if (player.y > groundY - player.height) player.y = groundY - player.height;
        
        // Platform collision (for etazhi section)
        if (currentSection === 1) {
            platforms.forEach(p => {
                if (player.x < p.x + p.width &&
                    player.x + player.width > p.x &&
                    player.y + player.height > p.y &&
                    player.y + player.height < p.y + p.height + 20 &&
                    player.velocityY > 0) {
                    player.y = p.y - player.height;
                    player.velocityY = 0;
                    player.grounded = true;
                    player.jumping = false;
                    player.doubleJump = false;
                }
            });
        }
        
        // Move collectibles
        collectibles.forEach(c => {
            const speed = currentSection === 1 ? 3 : 12;
            c.x -= speed;
        });
        
        // Move obstacles
        obstacles.forEach(o => {
            const speed = currentSection === 1 ? 3 : 12;
            o.x -= speed;
            
            // Check if player passed through a tower gap (moscow section)
            if (currentSection === 3 && o.isTop && !o.passed) {
                if (player.x > o.x + o.width) {
                    o.passed = true;
                    score += 10;
                    document.getElementById('chapter2-score').textContent = score;
                    audioSystem.playCollect();
                }
            }
        });
        
        // Move platforms
        platforms.forEach(p => {
            p.x -= 3;
        });
        
        // Move Kristina on platform
        if (kristinaOnPlatform) {
            kristinaOnPlatform.x -= 3;
        }
        
        // Remove off-screen items
        collectibles = collectibles.filter(c => c.x > -200);
        obstacles = obstacles.filter(o => o.x > -200);
        platforms = platforms.filter(p => p.x > -200);
        
        // Spawn new items (stop spawning when player is in taxi)
        if (!taxi.boarded) {
            // Stop spawning collectibles after 1200 score in section 1
            const collectibleRate = (currentSection === 1 && score >= 1200) ? 0 : (currentSection === 1 ? 0.005 : 0.02);
            if (Math.random() < collectibleRate) spawnCollectible();
            
            // Spawn obstacles
            if (currentSection === 3) {
                // For Moscow section, spawn multiple towers at once to create buffer
                if (Math.random() < 0.03) {
                    spawnObstacle();
                    // Spawn additional towers to create buffer
                    if (obstacles.length > 0) {
                        const lastObstacle = obstacles[obstacles.length - 1];
                        if (lastObstacle.x < canvas.width + 1000) {
                            spawnObstacle();
                        }
                    }
                }
            } else {
                if (Math.random() < 0.01) spawnObstacle();
            }
            
            // Force spawn platform with Kristina immediately when score reaches 1200
            if (currentSection === 1 && score >= 1200 && !kristinaOnPlatform && !kristinaDialogShown && !kristinaPlatformSpawned) {
                kristinaPlatformSpawned = true;
                
                // Clear any pending platforms to ensure Kristina appears next
                platforms = platforms.filter(p => p.x < canvas.width);
                
                // Clear any pending collectibles to prevent them appearing in air
                collectibles = collectibles.filter(c => c.x < canvas.width);
                
                // Calculate platform position based on last platform
                let platformX = canvas.width + 200;
                if (platforms.length > 0) {
                    const lastPlatform = platforms[platforms.length - 1];
                    const gap = 300 + Math.random() * 300;
                    platformX = lastPlatform.x + lastPlatform.width + gap;
                }
                
                const platformY = groundY - 250 - Math.random() * 300;
                const platformId = platformIdCounter++;
                
                kristinaOnPlatform = {
                    x: platformX + 50,
                    y: platformY - 200,
                    width: 100,
                    height: 200,
                    platformId: platformId
                };
                
                platforms.push({
                    id: platformId,
                    x: platformX,
                    y: platformY,
                    width: 200,
                    height: 30,
                    emoji: '📦',
                    hasCollectible: false
                });
            }
            
            // Update last score
            lastScore = score;
            
            // Normal platform spawning (stop if Kristina platform spawned)
            if (currentSection === 1 && !kristinaPlatformSpawned && Math.random() < 0.03) {
                spawnPlatform();
            }
        }
        
        // Collision detection - collectibles
        collectibles = collectibles.filter(c => {
            if (player.x < c.x + c.width &&
                player.x + player.width > c.x &&
                player.y < c.y + c.height &&
                player.y + player.height > c.y) {
                score += c.points;
                // Play pop sound for balloons, collect sound for others
                if (c.imageName === 'balloon') {
                    audioSystem.playPop();
                } else {
                    audioSystem.playCollect();
                }
                document.getElementById('chapter2-score').textContent = score;
                checkStoryEvents();
                
                // Reset hasCollectible flag on platform (for etazhi section)
                if (c.platformId !== undefined) {
                    const platform = platforms.find(p => p.id === c.platformId);
                    if (platform) {
                        platform.hasCollectible = false;
                    }
                }
                
                return false;
            }
            return true;
        });
        
        // Collision detection - Kristina on platform
        if (kristinaOnPlatform) {
            if (player.x < kristinaOnPlatform.x + kristinaOnPlatform.width &&
                player.x + player.width > kristinaOnPlatform.x &&
                player.y < kristinaOnPlatform.y + kristinaOnPlatform.height &&
                player.y + player.height > kristinaOnPlatform.y) {
                // Trigger dialog with Kristina (only if not already shown)
                if (!kristinaDialogShown) {
                    kristinaDialogShown = true;
                    showDialog([
                        { speaker: 'Ты', text: 'Ты реально поехал в Этажи воровать карточки My Little Pony, которые мне понравились..?' },
                        { speaker: 'Я', text: 'Да💪😎 Вот тебе карточки и Фрамбини, и да, всё что было в этажах, остаётся в этажах, мир?👉 👈' },
                        { speaker: 'Ты', text: 'Мир💋' }
                    ], () => {
                        // After dialog, transition to section 3
                        currentSection = 2;
                        audioSystem.playSfx('whoosh');
                        gravityInverted = sections[2].gravity;
                        player.x = 100;
                        player.y = groundY - 200;
                        
                        // Clear collectibles, obstacles, and platforms from previous section
                        collectibles = [];
                        obstacles = [];
                        platforms = [];
                        kristinaOnPlatform = null;
                    });
                }
            }
        }
        
        // Collision detection - obstacles
        let moscowDeath = false;
        obstacles = obstacles.filter(o => {
            if (moscowDeath) return false; // clear remaining towers on Moscow respawn
            if (player.x < o.x + o.width &&
                player.x + player.width > o.x &&
                player.y < o.y + o.height &&
                player.y + player.height > o.y) {
                if (!player.invincible) {
                    lives--;
                    audioSystem.playHit();
                    document.getElementById('chapter2-lives').textContent = lives;
                    if (lives <= 0) {
                        if (currentSection === 3) {
                            moscowDeath = true; // sub-checkpoint: respawn at Moscow start instead of restarting the whole chapter
                        } else {
                            GameState.chapter2Running = false;
                            showScreen('game-over-screen');
                        }
                    }
                }
                return false;
            }
            return true;
        });
        if (moscowDeath) {
            respawnMoscow();
        }
        
        // Check chapter completion (Moscow section shortened: ~30 forgiving towers instead of ~60)
        if (score >= 2100) {
            GameState.chapter2Running = false;
            localStorage.setItem('chapterProgress', '3');
            showScreen('chapter2-complete');
        }
    }
    
    // Draw game
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBackground();
        drawTaxi();
        drawPlatforms();
        drawCollectibles();
        drawObstacles();
        drawPlayer();
    }
    
    // Game loop
    function gameLoop() {
        update();
        draw();
        if (GameState.chapter2Running) {
            requestAnimationFrame(gameLoop);
        }
    }
    
    // Input handling
    function jump() {
        if (!GameState.chapter2Running || GameState.dialogActive) return;
        
        // Flappy Bird style jump for Moscow section
        if (currentSection === 3) {
            player.velocityY = -8; // Instant upward jump
            audioSystem.playSfx('flap');
            return;
        }
        
        if (gravityInverted) {
            if (player.grounded) {
                player.velocityY = -jumpForce;
                player.grounded = false;
                player.jumping = true;
                audioSystem.playSfx('jump');
            } else if (player.jumping && !player.doubleJump) {
                player.velocityY = -jumpForce * 0.8;
                player.doubleJump = true;
                audioSystem.playSfx('jump');
            }
        } else {
            if (player.grounded) {
                player.velocityY = jumpForce;
                player.grounded = false;
                player.jumping = true;
                audioSystem.playSfx('jump');
            } else if (player.jumping && !player.doubleJump) {
                player.velocityY = jumpForce * 0.8;
                player.doubleJump = true;
                audioSystem.playSfx('jump');
            }
        }
    }
    
    // Moscow sub-checkpoint: dying in the flappy section respawns at its start
    // (keeps progress from earlier sections) instead of restarting the whole chapter.
    function respawnMoscow() {
        audioSystem.playSfx('respawn');
        lives = 5;
        score = moscowStartScore;
        document.getElementById('chapter2-lives').textContent = lives;
        document.getElementById('chapter2-score').textContent = score;
        obstacles = [];
        collectibles = [];
        player.x = 100;
        player.y = (canvas.height - player.height) / 2;
        player.velocityY = 0;
        player.invincible = true;
        setTimeout(() => { player.invincible = false; }, 1500); // brief grace period while new towers spawn in
    }

    // Keyboard
    const keys = {};
    document.addEventListener('keydown', (e) => {
        keys[e.code] = true;
        
        if (e.code === 'Space' && GameState.currentScreen === 'chapter2-screen') {
            e.preventDefault();
            jump();
        }
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });
    
    // Touch/Click
    canvas.addEventListener('click', () => {
        if (GameState.currentScreen === 'chapter2-screen') {
            jump();
        }
    });
    
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (GameState.currentScreen === 'chapter2-screen') {
            jump();
        }
    });
    
    // Start game
    gameLoop();
    
    // Chapter complete button
    document.getElementById('chapter3-btn').addEventListener('click', () => {
        audioSystem.playClick();
        localStorage.setItem('chapterProgress', '3');
        showScreen('chapter3-screen');
        initChapter3();
    });
}

// Chapter 3: Vertical Car Scrolling Game
function initChapter3() {
    const canvas = document.getElementById('chapter3-canvas');
    const ctx = canvas.getContext('2d');
    
    // Set game state to running
    GameState.chapter3Running = true;
    
    // Set canvas size
    function resizeCanvas() {
   
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.removeEventListener('resize', resizeCanvas);
    window.addEventListener('resize', resizeCanvas);
    
    // Game state
    let score = 0;
    let lives = 5;
    let currentEvent = 0;
    let policeActive = false;
    let currentSection = 0;
    let policeWaveActive = false;
    let finalPoliceWaveTriggered = false;
    let fadeInProgress = false;
    let fadeOutProgress = false;
    let fadeHoldProgress = false;
    let fadeAlpha = 0;
    let fadeText = '';
    let fadeStartTime = 0;
    let sirenPlaying = false;
    let lastSirenTime = 0;
    let cutsceneActive = false;
    let cutsceneCompleted = false;
    let endingActive = false;
    let endingPhase = 0; // 0: arch descending, 1: moving to arch, 2: characters appear, 3: flash, 4: fade to final
    let endingStartTime = 0;
    let archX = 0;
    let archY = -400; // Start above screen
    let charactersVisible = false;
    let playerX = 0;
    let playerY = 0;
    let kristinaX = 0;
    let kristinaY = 0;
    let playerVelocityY = 0;
    let kristinaVelocityY = 0;
    let jumpPhase = 0; // 0: jumping up, 1: falling down
    let flashAlpha = 0;
    let flashActive = false;
    let inputDisabled = false;
    
    // Initialize UI
    document.getElementById('chapter3-lives').textContent = lives;
    
    // Lane system
    const laneWidth = canvas.width / 3;
    const lanes = [
        { x: 0 },                        // Left lane
        { x: laneWidth },               // Center lane
        { x: laneWidth * 2 }            // Right lane
    ];
    let currentLane = 1; // Start in center lane
    
    // Car
    const car = {
        x: lanes[currentLane].x + laneWidth / 2 - 120,
        y: canvas.height - 400,
        width: 240,
        height: 400,
        speed: 10,
        targetX: lanes[currentLane].x + laneWidth / 2 - 120
    };
    
    // Collectibles and obstacles
    let collectibles = [];
    let obstacles = [];
    
    // Monya (dog easter egg)
    let monya = null;
    
    // Road offset
    let roadOffset = 0;
    
    // Story events
    const storyEvents = [
        { score: 0, title: 'Жаркие ночи на Наличной', dialog: [
            { speaker: 'Ты', text: 'Надо присмотреть за Моней, пока дедушки нет дома' },
            { speaker: 'Я', text: 'Этот совместный быт с тобой был прекрасен💕🤭. Особенно наши ночи без интернета' },
            { speaker: 'Ты', text: 'Тииииииихо😈' }
        ]},
        { score: 600, title: 'Угон дедовской Камри', dialog: [
            { speaker: 'Стас', text: 'Ой-ой.., сзади мигалки!😕' },
            { speaker: 'Я', text: 'Дерьмо((' },
            { speaker: 'Ты', text: 'Дерьмо!!' }
        ], special: true },
        { score: 9999, title: 'Операция: Спасение жопы', dialog: [
            { speaker: 'Я', text: 'АААА! У МЕНЯ ВЗОРВАЛАСЬ ЖОПА!!' },
            { speaker: 'Ты', text: 'Спокойно! Держись за меня, я доведу тебя до поликлиники🚀🚀🚀' },
            { speaker: 'Я', text: 'В тот момент я во всю прочувствовал твою заботу, ведь всем известно, что "настоящие бдсм-друзья познаются в беде"' },
            { speaker: 'Ты', text: 'Для этого и нужны бдсм-друзья! Всё будет хорошо!' }
        ]}
    ];
    
    // Spawn collectibles
    function spawnCollectible() {
        // Don't spawn during cutscene
        if (cutsceneActive) return;
        
        const types = [
            { emoji: '🦴', points: 20, name: 'корм для собаки', imageName: 'dog_food' },
            { emoji: '🪪', points: 50, name: 'права Кристины', imageName: 'license' },
            { emoji: '💊', points: 30, name: 'аптечка', imageName: 'medkit' }
        ];
        const type = types[Math.floor(Math.random() * types.length)];
        const lane = Math.floor(Math.random() * 3);
        collectibles.push({
            x: lanes[lane].x + laneWidth / 2 - 40,
            y: -100,
            width: 80,
            height: 80,
            ...type
        });
    }
    
    // Spawn Monya (dog easter egg)
    function spawnMonya() {
        if (monya !== null) return; // Don't spawn if already on screen
        
        const direction = Math.random() < 0.5 ? 'left' : 'right';
        const y = canvas.height - 150; // Near bottom of screen
        const speed = 3 + Math.random() * 2; // Random speed between 3-5
        
        monya = {
            x: direction === 'left' ? -100 : canvas.width + 100,
            y: y,
            width: 80,
            height: 80,
            speed: speed,
            direction: direction,
            imageName: 'dog'
        };
        audioSystem.playSfx('dog');
    }
    
    // Spawn obstacles
    function spawnObstacle() {
        // Don't spawn during cutscene
        if (cutsceneActive) return;
        
        // Determine obstacle types based on current section
        let types;
        if (score < 600) {
            // Section 1: all obstacles except police
            types = [
                { emoji: '🚧', name: 'шлагбаум', imageName: 'barrier', width: 100, height: 100 },
                { emoji: '🧱', name: 'блок', imageName: 'block', width: 100, height: 100 }
            ];
        } else if (score < 1200) {
            // Section 2: only police cars with special wave mechanics
            if (policeWaveActive) {
                return; // Don't spawn if wave is already active
            }
            
            // Check if all police cars are off-screen before spawning new wave
            const policeOnScreen = obstacles.filter(o => o.name === 'полиция' && o.y < canvas.height + 50);
            if (policeOnScreen.length > 0) {
                return;
            }
            
            // Spawn police wave
            const policeType = { emoji: '🚔', name: 'полиция', imageName: 'police', width: 240, height: 400 };
            
            let patterns;
            if (score < 900) {
                // 600-900: all patterns
                patterns = [
                    [0],           // Left only
                    [1],           // Center only
                    [2],           // Right only
                    [0, 1],        // Left + Center
                    [1, 2],        // Center + Right
                    [0, 2]         // Left + Right
                ];
            } else {
                // 900-1200: only pairs
                patterns = [
                    [0, 1],        // Left + Center
                    [1, 2],        // Center + Right
                    [0, 2]         // Left + Right
                ];
            }
            
            const pattern = patterns[Math.floor(Math.random() * patterns.length)];
            
            pattern.forEach(lane => {
                obstacles.push({
                    x: lanes[lane].x + laneWidth / 2 - policeType.width / 2,
                    y: -policeType.height / 2, // Halfway out of screen
                    width: policeType.width,
                    height: policeType.height,
                    ...policeType,
                    state: 'waiting',
                    waitTime: 500, // 0.5 second wait
                    speed: 20,
                    waitStartTime: Date.now()
                });
            });
            
            policeWaveActive = true;
            return;
        } else {
            // Section 3: all obstacles
            types = [
                { emoji: '🚔', name: 'полиция', imageName: 'police', width: 240, height: 400 },
                { emoji: '🚧', name: 'шлагбаум', imageName: 'barrier', width: 100, height: 100 },
                { emoji: '🧱', name: 'блок', imageName: 'block', width: 100, height: 100 }
            ];
        }
        
        const type = types[Math.floor(Math.random() * types.length)];
        
        // Spawn obstacles just above the screen
        const spawnY = -type.height;
        
        // Check which lanes are safe to spawn in
        const safeLanes = [];
        const minDistanceSameLane = 600;
        const minDistanceAdjacentLane = 600;
        
        // Check which lanes currently have obstacles on screen
        const lanesWithObstacles = new Set();
        obstacles.forEach(o => {
            const obstacleCenter = o.x + o.width / 2;
            if (obstacleCenter < laneWidth) {
                lanesWithObstacles.add(0);
            } else if (obstacleCenter < laneWidth * 2) {
                lanesWithObstacles.add(1);
            } else {
                lanesWithObstacles.add(2);
            }
        });
        
        for (let lane = 0; lane < 3; lane++) {
            let isSafe = true;
            
            // If all three lanes already have obstacles, don't spawn in any lane
            if (lanesWithObstacles.size >= 3) {
                isSafe = false;
            }
            
            obstacles.forEach(o => {
                // Determine which lane this obstacle is in
                const obstacleCenter = o.x + o.width / 2;
                let obstacleLane;
                if (obstacleCenter < laneWidth) {
                    obstacleLane = 0;
                } else if (obstacleCenter < laneWidth * 2) {
                    obstacleLane = 1;
                } else {
                    obstacleLane = 2;
                }
                
                // Calculate new obstacle position
                const newX = lanes[lane].x + laneWidth / 2 - type.width / 2;
                
                // Check if hitboxes would overlap
                const horizontalOverlap = (newX < o.x + o.width && newX + type.width > o.x);
                const verticalOverlap = (spawnY < o.y + o.height && spawnY + type.height > o.y);
                
                if (horizontalOverlap && verticalOverlap) {
                    isSafe = false;
                }
                
                // Check vertical distance for same lane (stricter)
                if (obstacleLane === lane) {
                    const existingBottom = o.y + o.height;
                    const existingTop = o.y;
                    const newTop = spawnY;
                    const newBottom = spawnY + type.height;
                    
                    // Check both directions of vertical distance
                    const distance1 = existingBottom - newTop;
                    const distance2 = newBottom - existingTop;
                    
                    if (distance1 < minDistanceSameLane || distance2 < minDistanceSameLane) {
                        isSafe = false;
                    }
                }
                
                // Check vertical distance for adjacent lanes (only if obstacle is in danger zone)
                if (Math.abs(obstacleLane - lane) === 1 && o.y < 400) {
                    const existingBottom = o.y + o.height;
                    const existingTop = o.y;
                    const newTop = spawnY;
                    const newBottom = spawnY + type.height;
                    
                    // Check both directions of vertical distance
                    const distance1 = existingBottom - newTop;
                    const distance2 = newBottom - existingTop;
                    
                    if (distance1 < minDistanceAdjacentLane || distance2 < minDistanceAdjacentLane) {
                        isSafe = false;
                    }
                }
            });
            
            if (isSafe) {
                safeLanes.push(lane);
            }
        }
        
        // If no safe lanes available, don't spawn
        if (safeLanes.length === 0) {
            return;
        }
        
        // Choose random safe lane
        const lane = safeLanes[Math.floor(Math.random() * safeLanes.length)];
        
        obstacles.push({
            x: lanes[lane].x + laneWidth / 2 - type.width / 2,
            y: spawnY,
            width: type.width,
            height: type.height,
            ...type
        });
    }
    
    // Show dialog
    function showDialog(dialog) {
        // Prevent multiple dialogs
        if (!GameState.chapter3Running || GameState.dialogActive) return;
        audioSystem.playSfx('dialog');
        
        GameState.dialogActive = true;
        GameState.chapter3Running = false;
        const dialogBox = document.getElementById('chapter3-dialog');
        dialogBox.innerHTML = '';
        dialogBox.classList.remove('hidden');
        
        let currentLine = 0;
        
        function showLine() {
            if (currentLine >= dialog.length) {
                // Dialog finished
                dialogBox.classList.add('hidden');
                dialogBox.innerHTML = '';
                GameState.dialogActive = false;
                GameState.chapter3Running = true;
                
                // Force redraw
                draw();
                
                // Force game loop restart
                requestAnimationFrame(gameLoop);
                return;
            }
            
            const line = dialog[currentLine];
            dialogBox.innerHTML = `<p class="dialog-speaker">${line.speaker}:</p><p class="dialog-text">${line.text}</p><p class="dialog-hint">Нажмите Enter или коснитесь экрана для продолжения...</p>`;
            
            const handleKeyPress = (e) => {
                if (e.key === 'Enter' && GameState.dialogActive) {
                    document.removeEventListener('keydown', handleKeyPress);
                    currentLine++;
                    showLine();
                }
            };
            
            document.addEventListener('keydown', handleKeyPress);
        }
        
        showLine();
    }
    
    // Check story events
    function checkStoryEvents() {
        if (!GameState.chapter3Running) return;
        for (let i = currentEvent; i < storyEvents.length; i++) {
            if (score >= storyEvents[i].score) {
                currentEvent = i + 1;
                showDialog(storyEvents[i].dialog);
                if (storyEvents[i].special) {
                    policeActive = true;
                }
                break;
            }
        }
    }
    
    // Show initial dialog at game start
    function showInitialDialog() {
        if (storyEvents.length > 0 && storyEvents[0].score === 0) {
            currentEvent = 1;
            showDialog(storyEvents[0].dialog);
        }
    }
    
    // Draw background
    function drawBackground() {
        const bgImage = assetLoader.get('chapter3_road');
        
        if (bgImage) {
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        } else {
            // Fallback: draw road surface (top-down view)
            
            // Draw lanes
            ctx.fillStyle = '#4A4A4A';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Lane dividers
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 3;
            ctx.setLineDash([30, 30]);
            ctx.lineDashOffset = -roadOffset;
            
            // Left divider
            ctx.beginPath();
            ctx.moveTo(laneWidth, 0);
            ctx.lineTo(laneWidth, canvas.height);
            ctx.stroke();
            
            // Right divider
            ctx.beginPath();
            ctx.moveTo(laneWidth * 2, 0);
            ctx.lineTo(laneWidth * 2, canvas.height);
            ctx.stroke();
            
            ctx.setLineDash([]);
        }
    }
    
    // Draw car
    function drawCar() {
        const camryImg = assetLoader.get('camry');
        
        if (camryImg) {
            ctx.drawImage(camryImg, car.x, car.y, car.width, car.height);
        } else {
            // Car body
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(car.x, car.y, car.width, car.height);
            
            // Windows
            ctx.fillStyle = '#87CEEB';
            ctx.fillRect(car.x + 20, car.y + 40, car.width - 40, 100);
            
            // Wheels
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(car.x + 60, car.y + car.height - 40, 40, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(car.x + car.width - 60, car.y + car.height - 40, 40, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Warning sign (only after cutscene completes)
        if (cutsceneCompleted) {
            // Draw yellow triangle
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.moveTo(car.x + 60, car.y + car.height - 100);
            ctx.lineTo(car.x + 180, car.y + car.height - 100);
            ctx.lineTo(car.x + 120, car.y + car.height - 160);
            ctx.closePath();
            ctx.fill();
            
            // Draw exclamation mark
            ctx.fillStyle = '#000';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('!', car.x + 120, car.y + car.height - 115);
        }
    }
    
    // Draw collectibles
    function drawCollectibles() {
        collectibles.forEach(c => {
            const img = assetLoader.get(c.imageName);
            if (img) {
                ctx.drawImage(img, c.x, c.y, c.width, c.height);
            } else {
                ctx.font = '35px Arial';
                ctx.fillText(c.emoji, c.x, c.y + 35);
            }
        });
    }
    
    // Draw obstacles
    function drawObstacles() {
        obstacles.forEach(o => {
            const img = assetLoader.get(o.imageName);
            if (img) {
                ctx.drawImage(img, o.x, o.y, o.width, o.height);
            } else {
                // Draw gray rectangle for hitbox
                ctx.fillStyle = '#808080';
                ctx.fillRect(o.x, o.y, o.width, o.height);
                // Add border for visibility
                ctx.strokeStyle = '#606060';
                ctx.lineWidth = 2;
                ctx.strokeRect(o.x, o.y, o.width, o.height);
            }
        });
    }
    
    // Draw Monya (dog easter egg)
    function drawMonya() {
        if (monya === null) return;
        
        const img = assetLoader.get(monya.imageName);
        if (img) {
            ctx.save();
            if (monya.direction === 'right') {
                // Flip horizontally for right-to-left movement
                ctx.translate(monya.x + monya.width, monya.y);
                ctx.scale(-1, 1);
                ctx.drawImage(img, 0, 0, monya.width, monya.height);
            } else {
                // Normal drawing for left-to-right movement
                ctx.drawImage(img, monya.x, monya.y, monya.width, monya.height);
            }
            ctx.restore();
        } else {
            // Draw placeholder if image not loaded
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(monya.x, monya.y, monya.width, monya.height);
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            ctx.strokeRect(monya.x, monya.y, monya.width, monya.height);
        }
    }
    
    // Update game
    function update() {
        if (!GameState.chapter3Running) return;
        
        roadOffset += car.speed;
        
        // Smooth car movement to target lane
        const lerpSpeed = 0.15;
        car.x += (car.targetX - car.x) * lerpSpeed;
        
        // Move collectibles
        collectibles.forEach(c => {
            c.y += car.speed;
        });
        
        // Move obstacles
        obstacles.forEach(o => {
            if (o.name === 'полиция' && o.state === 'waiting') {
                // Police car waiting logic
                if (Date.now() - o.waitStartTime >= o.waitTime) {
                    o.state = 'flying';
                }
            } else if (o.name === 'полиция' && o.state === 'flying') {
                // Police car flying logic
                o.y += o.speed;
            } else {
                // Normal obstacle movement
                o.y += car.speed;
            }
        });
        
        // Move Monya
        if (monya !== null) {
            if (monya.direction === 'left') {
                monya.x += monya.speed;
            } else {
                monya.x -= monya.speed;
            }
            
            // Remove Monya if off-screen
            if (monya.x > canvas.width + 100 || monya.x < -100) {
                monya = null;
            }
        }
        
        // Remove off-screen items
        collectibles = collectibles.filter(c => c.y < canvas.height + 50);
        obstacles = obstacles.filter(o => o.y < canvas.height + 50);
        
        // Check if all police cars are off-screen to reset wave
        if (policeWaveActive) {
            const policeOnScreen = obstacles.filter(o => o.name === 'полиция');
            if (policeOnScreen.length === 0) {
                policeWaveActive = false;
            }
        }
        
        // Trigger final police wave at 1200 points
        if (score >= 1200 && !finalPoliceWaveTriggered) {
            // Stop spawning obstacles immediately
            cutsceneActive = true;
            // Wait for current police wave to finish
            const policeOnScreen = obstacles.filter(o => o.name === 'полиция');
            if (policeOnScreen.length === 0) {
                finalPoliceWaveTriggered = true;
                // Spawn 3 police cars on all lanes
                const policeType = { emoji: '🚔', name: 'полиция', imageName: 'police', width: 240, height: 400 };
                [0, 1, 2].forEach(lane => {
                    obstacles.push({
                        x: lanes[lane].x + laneWidth / 2 - policeType.width / 2,
                        y: -policeType.height / 2,
                        width: policeType.width,
                        height: policeType.height,
                        ...policeType,
                        state: 'waiting',
                        waitTime: 500,
                        speed: 20,
                        waitStartTime: Date.now(),
                        isFinalWave: true
                    });
                });
            }
        }
        
        // Spawn new items
        if (Math.random() < 0.03) spawnCollectible();
        if (Math.random() < 0.1) spawnObstacle();
        
        // Spawn Monya occasionally (rare easter egg)
        if (Math.random() < 0.002) spawnMonya();
        
        // Real police siren (continuous loop) during section 2 (600-1200 points)
        if (score >= 600 && score < 1200) {
            if (!sirenPlaying) {
                audioSystem.playSiren({ loop: true, volume: 0.3 });
                sirenPlaying = true;
            }
        } else if (sirenPlaying) {
            audioSystem.stopSfx('siren');
            sirenPlaying = false;
        }
        
        // Collision detection - collectibles
        collectibles = collectibles.filter(c => {
            if (car.x < c.x + c.width &&
                car.x + car.width > c.x &&
                car.y < c.y + c.height &&
                car.y + car.height > c.y) {
                score += c.points;
                audioSystem.playCollect();
                document.getElementById('chapter3-score').textContent = score;
                checkStoryEvents();
                return false;
            }
            return true;
        });
        
        // Collision detection - obstacles
        obstacles = obstacles.filter(o => {
            if (car.x < o.x + o.width &&
                car.x + car.width > o.x &&
                car.y < o.y + o.height &&
                car.y + car.height > o.y) {
                // Check if this is final wave police car
                if (o.isFinalWave) {
                    // Don't deal damage, trigger fade instead
                    if (!fadeOutProgress && !fadeInProgress) {
                        fadeOutProgress = true;
                        fadeStartTime = Date.now();
                        fadeText = 'Спустя 5 часов доказывания в МВД, что мы не автоугонщики, а просто дурачки...\nМашину эвакуировали, но нас отпустили👍\nНомера поменяли, дед жив-здоров🎉🎉🎉';
                    }
                    return true; // Keep police car on screen (flies off naturally)
                }
                
                // Don't deal damage during ending
                if (endingActive) {
                    return true; // Remove obstacle but don't deal damage
                }
                
                lives--;
                audioSystem.playHit();
                document.getElementById('chapter3-lives').textContent = lives;
                if (lives <= 0) {
                    GameState.chapter3Running = false;
                    audioSystem.stopSfx('siren');
                    sirenPlaying = false;
                    showScreen('game-over-screen');
                }
                return false;
            }
            return true;
        });
        
        // Handle fade effects
        if (fadeOutProgress) {
            const elapsed = Date.now() - fadeStartTime;
            const fadeDuration = 1000; // 1 second fade out
            fadeAlpha = Math.min(elapsed / fadeDuration, 1);
            
            if (elapsed >= fadeDuration) {
                fadeOutProgress = false;
                fadeHoldProgress = true;
                fadeStartTime = Date.now();
                fadeAlpha = 1;
            }
        }
        
        if (fadeHoldProgress) {
            const elapsed = Date.now() - fadeStartTime;
            const holdDuration = 3000; // 3 seconds hold with text
            fadeAlpha = 1;
            
            if (elapsed >= holdDuration) {
                fadeHoldProgress = false;
                fadeInProgress = true;
                fadeStartTime = Date.now();
            }
        }
        
        if (fadeInProgress) {
            const elapsed = Date.now() - fadeStartTime;
            const fadeDuration = 1000; // 1 second fade in
            fadeAlpha = 1 - Math.min(elapsed / fadeDuration, 1);
            
            if (elapsed >= fadeDuration) {
                fadeInProgress = false;
                fadeAlpha = 0;
                cutsceneActive = false;
                cutsceneCompleted = true;
                // Trigger dialog for section 3 (manually, not via checkStoryEvents)
                showDialog(storyEvents[2].dialog);
            }
        }
        
        // Check chapter completion
        if (score >= 1800 && !endingActive) {
            endingActive = true;
            endingPhase = 0;
            endingStartTime = Date.now();
            archX = canvas.width / 2 - 150; // Center the arch
            archY = -400; // Start above screen
            // Move car to center lane
            currentLane = 1;
            car.targetX = lanes[1].x + laneWidth / 2 - car.width / 2;
            car.x = car.targetX;
            // Disable input
            inputDisabled = true;
            // Stop spawning obstacles and collectibles
            cutsceneActive = true;
            audioSystem.stopSfx('siren');
            sirenPlaying = false;
        }
        
        // Handle ending sequence
        if (endingActive) {
            const elapsed = Date.now() - endingStartTime;
            
            if (endingPhase === 0) {
                // Phase 0: Arch descends from top
                const targetArchY = canvas.height - 400;
                const descendSpeed = 2;
                
                if (archY < targetArchY) {
                    archY += descendSpeed;
                } else {
                    archY = targetArchY;
                    endingPhase = 1;
                    endingStartTime = Date.now();
                }
            } else if (endingPhase === 1) {
                // Phase 1: Characters jump out of car
                if (!charactersVisible) {
                    charactersVisible = true;
                    // Set initial positions (inside car hitbox)
                    playerX = car.x + car.width / 2 - 80;
                    playerY = car.y + car.height / 2 - 50;
                    kristinaX = car.x + car.width / 2 + 20;
                    kristinaY = car.y + car.height / 2 - 50;
                    // Initial jump velocity (automatic jump)
                    playerVelocityY = -30;
                    kristinaVelocityY = -30;
                    audioSystem.playCelebration();
                }
                
                // Jump animation with gravity (same physics as chapter 1)
                const gravity = 1.5;
                const landY = car.y + car.height - 150; // Landing position (ground level, same as car)
                
                // Apply gravity
                playerVelocityY += gravity;
                kristinaVelocityY += gravity;
                
                // Update positions
                playerY += playerVelocityY;
                kristinaY += kristinaVelocityY;
                
                // Check if landed
                if (playerY >= landY) {
                    playerY = landY;
                    kristinaY = landY;
                    playerVelocityY = 0;
                    kristinaVelocityY = 0;
                    endingPhase = 2;
                    endingStartTime = Date.now();
                }
            } else if (endingPhase === 2) {
                // Phase 2: Stay at arch for a moment
                if (elapsed > 3000) { // Stay for 3 seconds
                    endingPhase = 3;
                    endingStartTime = Date.now();
                    flashActive = true;
                    flashAlpha = 1;
                    audioSystem.playCamera();
                }
            } else if (endingPhase === 3) {
                // Phase 3: Camera flash effect
                const flashDuration = 500; // 0.5 seconds flash
                flashAlpha = 1 - Math.min(elapsed / flashDuration, 1);
                
                if (elapsed >= flashDuration) {
                    endingPhase = 4;
                    endingStartTime = Date.now();
                    flashActive = false;
                }
            } else if (endingPhase === 4) {
                // Phase 4: Fade to final screen
                const fadeDuration = 1000;
                fadeAlpha = Math.min(elapsed / fadeDuration, 1);
                
                if (elapsed >= fadeDuration) {
                    GameState.chapter3Running = false;
                    showScreen('final-screen');
                    initFinalScreen();
                }
            }
        }
    }
    
    // Draw game
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBackground();
        drawCollectibles();
        drawObstacles();
        drawMonya();
        
        // Draw wedding arch during ending
        if (endingActive) {
            drawWeddingArch();
        }
        
        drawCar();
        
        // Draw characters during ending
        if (charactersVisible) {
            drawCharacters();
        }
        
        // Draw fade overlay
        if (fadeAlpha > 0) {
            ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Only show fade text during cutscene, not during ending
            if (fadeText && !endingActive) {
                ctx.fillStyle = 'white';
                ctx.font = '24px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const lines = fadeText.split('\n');
                lines.forEach((line, index) => {
                    ctx.fillText(line, canvas.width / 2, canvas.height / 2 + (index - lines.length / 2) * 30);
                });
            }
        }
        
        // Draw camera flash effect
        if (flashActive && flashAlpha > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }
    
    // Draw characters (player and Kristina)
    function drawCharacters() {
        const characterWidth = 100;
        const characterHeight = 150;
        
        // Draw player (you_curly)
        const playerImg = assetLoader.get('you_curly');
        if (playerImg) {
            ctx.drawImage(playerImg, playerX, playerY, characterWidth, characterHeight);
        } else {
            // Fallback if image not loaded
            ctx.fillStyle = '#4169E1';
            ctx.fillRect(playerX, playerY, characterWidth, characterHeight);
            ctx.fillStyle = 'white';
            ctx.font = '20px Arial';
            ctx.fillText('😊', playerX + 30, playerY + 50);
        }
        
        // Draw Kristina
        const kristinaImg = assetLoader.get('kristina');
        if (kristinaImg) {
            ctx.drawImage(kristinaImg, kristinaX, kristinaY, characterWidth, characterHeight);
        } else {
            // Fallback if image not loaded
            ctx.fillStyle = '#FF69B4';
            ctx.fillRect(kristinaX, kristinaY, characterWidth, characterHeight);
            ctx.fillStyle = 'white';
            ctx.font = '20px Arial';
            ctx.fillText('💖', kristinaX + 30, kristinaY + 50);
        }
    }
    
    // Draw wedding arch
    function drawWeddingArch() {
        const archWidth = 300;
        const archHeight = 350;
        
        // Draw arch structure
        ctx.fillStyle = '#8B4513'; // Brown wood
        ctx.fillRect(archX - 10, archY, 20, archHeight); // Left pillar
        ctx.fillRect(archX + archWidth - 10, archY, 20, archHeight); // Right pillar
        
        // Draw arch top (curved)
        ctx.beginPath();
        ctx.arc(archX + archWidth / 2, archY, archWidth / 2 + 10, Math.PI, 0);
        ctx.lineWidth = 20;
        ctx.strokeStyle = '#8B4513';
        ctx.stroke();
        
        // Draw flowers on arch
        const flowerColors = ['#FF69B4', '#FF1493', '#FFB6C1', '#FFC0CB', '#FF6347'];
        for (let i = 0; i < 20; i++) {
            const angle = Math.PI + (i / 19) * Math.PI;
            const radius = archWidth / 2;
            const flowerX = archX + archWidth / 2 + Math.cos(angle) * radius;
            const flowerY = archY + Math.sin(angle) * radius * 0.5;
            
            ctx.beginPath();
            ctx.arc(flowerX, flowerY, 8, 0, Math.PI * 2);
            ctx.fillStyle = flowerColors[i % flowerColors.length];
            ctx.fill();
        }
        
        // Draw garland lights
        ctx.fillStyle = '#FFD700';
        for (let i = 0; i < 15; i++) {
            const x = archX + (i / 14) * archWidth;
            const y = archY + 30 + Math.sin(i * 0.5) * 20;
            
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw balloons
        const balloonColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
        for (let i = 0; i < 8; i++) {
            const balloonX = archX - 30 + i * 45;
            const balloonY = archY - 50 - Math.sin(i * 0.8) * 30;
            
            ctx.beginPath();
            ctx.arc(balloonX, balloonY, 15, 0, Math.PI * 2);
            ctx.fillStyle = balloonColors[i % balloonColors.length];
            ctx.fill();
            
            // Balloon string
            ctx.beginPath();
            ctx.moveTo(balloonX, balloonY + 15);
            ctx.lineTo(balloonX, balloonY + 50);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        
        // Draw ЗАГС text
        ctx.fillStyle = '#FF1493';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ЗАГС', archX + archWidth / 2, archY - 80);
        
        // Add decorative ribbon
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(archX + archWidth / 2 - 80, archY - 60, 160, 5);
        ctx.fillRect(archX + archWidth / 2 - 80, archY - 60, 5, 20);
        ctx.fillRect(archX + archWidth / 2 + 75, archY - 60, 5, 20);
    }
    
    // Game loop
    function gameLoop() {
        update();
        draw();
        if (GameState.chapter3Running) {
            requestAnimationFrame(gameLoop);
        }
    }
    
    // Start game loop and show initial dialog
    showInitialDialog();
    gameLoop();
    
    // Input handling - Keyboard (A/D for lane switching)
    document.addEventListener('keydown', (e) => {
        if (GameState.currentScreen === 'chapter3-screen' && GameState.chapter3Running && !inputDisabled) {
            if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft' || e.key === 'ф' || e.key === 'Ф') {
                if (currentLane > 0) {
                    currentLane--;
                    car.targetX = lanes[currentLane].x + laneWidth / 2 - car.width / 2;
                }
            } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight' || e.key === 'в' || e.key === 'В') {
                if (currentLane < 2) {
                    currentLane++;
                    car.targetX = lanes[currentLane].x + laneWidth / 2 - car.width / 2;
                }
            }
        }
    });
    
    // Input handling - Touch (swipe for lane switching)
    let touchStartX = 0;
    canvas.addEventListener('touchstart', (e) => {
        if (GameState.currentScreen === 'chapter3-screen' && GameState.chapter3Running && !inputDisabled && !GameState.dialogActive) {
            e.preventDefault();
            touchStartX = e.touches[0].clientX;
        }
    });
    
    canvas.addEventListener('touchend', (e) => {
        if (GameState.currentScreen === 'chapter3-screen' && GameState.chapter3Running && !inputDisabled && !GameState.dialogActive) {
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchEndX - touchStartX;
            
            if (Math.abs(diff) > 50) { // Minimum swipe distance
                if (diff > 0 && currentLane < 2) {
                    // Swipe right
                    currentLane++;
                    car.targetX = lanes[currentLane].x + laneWidth / 2 - car.width / 2;
                } else if (diff < 0 && currentLane > 0) {
                    // Swipe left
                    currentLane--;
                    car.targetX = lanes[currentLane].x + laneWidth / 2 - car.width / 2;
                }
            }
        }
    });
    
    // Input handling - Mouse (disabled for lane system)
    canvas.addEventListener('mousemove', (e) => {
        // Mouse control disabled for lane system
    });
    
    // Start game
    gameLoop();
}

// Final Screen
function initFinalScreen() {
    const particleSystem = new ParticleSystem('final-particles');
    
    document.getElementById('restart-btn').addEventListener('click', () => {
        audioSystem.playClick();
        musicSystem.stop();
        document.getElementById('chapter-selection').classList.remove('hidden');
    });
    
    document.getElementById('gallery-btn').addEventListener('click', () => {
        audioSystem.playClick();
        showScreen('gallery-screen');
    });
    
    document.getElementById('close-gallery-btn').addEventListener('click', () => {
        audioSystem.playClick();
        showScreen('final-screen');
    });
    
    // Chapter selection buttons
    document.getElementById('chapter1-select').addEventListener('click', () => {
        audioSystem.playClick();
        localStorage.setItem('chapterProgress', '1');
        location.reload();
    });
    
    document.getElementById('chapter2-select').addEventListener('click', () => {
        audioSystem.playClick();
        localStorage.setItem('chapterProgress', '2');
        location.reload();
    });
    
    document.getElementById('chapter3-select').addEventListener('click', () => {
        audioSystem.playClick();
        localStorage.setItem('chapterProgress', '3');
        location.reload();
    });
}

function initGameOverScreen() {
    const particleSystem = new ParticleSystem('game-over-particles');
    
    document.getElementById('retry-btn').addEventListener('click', () => {
        audioSystem.playClick();
        location.reload();
    });
}

// Initialize game
document.addEventListener('DOMContentLoaded', async () => {
    const loadingScreen = document.getElementById('loading-screen');
    const loadingBar = document.getElementById('loading-bar');
    const enterBtn = document.getElementById('enter-btn');

    // Preload ALL assets before showing the start screen — no placeholders mid-game.
    // Wait for EVERY image to load (or fail) so the game starts fully ready.
    await assetLoader.loadAssets((loaded, total) => {
        const pct = total ? Math.round((loaded / total) * 100) : 0;
        if (loadingBar) loadingBar.style.width = pct + '%';
    });

    // Preload complete. Wire up the start screen (still hidden behind the splash).
    initStartScreen();

    // Reveal the "tap to start" button. This first tap also unlocks audio (autoplay
    // policy) so menu music («Утро») plays from this point on — before Start.
    if (loadingBar) loadingBar.style.width = '100%';
    if (enterBtn) enterBtn.classList.add('show');

    let _splashDismissed = false;
    const dismissSplash = () => {
        if (_splashDismissed) return;
        _splashDismissed = true;
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            loadingScreen.removeEventListener('click', dismissSplash);
        }
        // Start menu music on this first user gesture (autoplay policy unlock).
        try { audioSystem.init(); } catch (e) { /* ignore */ }
        musicSystem.play('start');
    };
    if (loadingScreen) {
        loadingScreen.addEventListener('click', dismissSplash);
    }
});
