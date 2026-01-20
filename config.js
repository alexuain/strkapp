// --- CONFIGURATION ---
const CONFIG = {
    cam: { 
        dist: 28,    // Немного дальше (было 22), чтобы видеть композицию
        height: 1.5, // Выше центр
        fov: 55 
    },
    bloom: { // Новые настройки свечения
        strength: 1.5, // Сила свечения
        radius: 0.4,   // Радиус размытия
        threshold: 0.1 // Порог яркости (все что ярче - светится)
    },
    colors: { bg: 0x020205, ringGlow: 0x00f3ff }, // Фон темнее
    physics: { ringTopY: 3.8, ringBotY: -3.5, strokeDuration: 0.35, spring: 150, damping: 15 },
    particles: { count: 1000, gravity: 0.04 }, // Больше частиц
    controls: { tiltEnabled: true, tiltSensitivity: 0.03, stealthFlipAngle: 140 }
};

// ... [Остальной код config.js без изменений] ...
const clock = new THREE.Clock();
let state = {
    running: false, time: 0, lastHit: -1, noteIdx: 0, combo: 0, heat: 0, climax: false, shake: 0,
    titanPos: 0, titanVel: 0, currentPatternName: '', speedMod: 1.0, isStealth: false
};

const DOM = {
    loader: document.getElementById('loader'),
    startBtn: document.getElementById('start-btn'),
    beatText: document.getElementById('beat-text'),
    hitZone: document.getElementById('hit-zone'),
    rhythmTrack: document.getElementById('rhythm-track'),
    trackCanvas: document.getElementById('trackCanvas'),
    mainCanvas: document.getElementById('mainCanvas'),
    stealthLayer: document.getElementById('stealth-layer'),
    panicZone: document.getElementById('panic-zone'),
    timelineCanvas: document.getElementById('timelineCanvas'),
    intensityBar: document.getElementById('intensity-bar')
};

const tCtx = DOM.trackCanvas.getContext('2d');