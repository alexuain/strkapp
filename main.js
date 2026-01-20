// --- MAIN CONTROLLER (STABLE INPUT) ---

const STATE = {
    screen: 'tutorial',
    scriptIdx: 0, scriptTimer: 0,
    arousal: 0.0, 
    strokeSpeed: 0.0, 
    ringPhase: 0.0,   
    ringY: -3.0,      
    velocity: 0.0,    
    edgesSurvived: 0,
    time: 0,
    lastTouchY: null, // Изменил на null для проверки первого касания
    waveform: new Array(100).fill(0)
};

const DOM = {
    cmdMain: document.getElementById('cmd-main'),
    cmdSub: document.getElementById('cmd-sub'),
    arousalFill: document.getElementById('arousal-fill'),
    arousalVal: document.getElementById('arousal-val'),
    edgeCounter: document.getElementById('edge-counter'),
    status: document.getElementById('status-text'),
    overlay: document.getElementById('overlay-screen'),
    tutContent: document.getElementById('tutorial-content'),
    resContent: document.getElementById('result-content'),
    startBtn: document.getElementById('start-btn'),
    resTitle: document.getElementById('res-title'),
    resStats: document.getElementById('res-stats'),
    waveCanvas: document.getElementById('waveCanvas')
};

const clock = new THREE.Clock();
let waveCtx = null;
if (DOM.waveCanvas) waveCtx = DOM.waveCanvas.getContext('2d');

// --- INPUT (SAFE) ---
function handleInput(y) {
    if (STATE.screen !== 'playing') return;
    
    // ЗАЩИТА: Если это первое касание, просто запоминаем позицию и выходим
    if (STATE.lastTouchY === null) {
        STATE.lastTouchY = y;
        return;
    }
    
    const delta = y - STATE.lastTouchY; 
    STATE.lastTouchY = y;

    const sensitivity = 0.008; 
    
    // Защита от скачков: ограничиваем максимальную дельту
    const safeDelta = Math.max(-50, Math.min(50, delta)); 
    
    const instantForce = Math.abs(safeDelta) / sensitivity;
    STATE.strokeSpeed += (instantForce - STATE.strokeSpeed) * 0.1;
    
    const rawVelocity = -(safeDelta / sensitivity) * 0.5;
    STATE.velocity += (rawVelocity - STATE.velocity) * 0.2; 
    
    // Защита от NaN
    if (isNaN(STATE.strokeSpeed)) STATE.strokeSpeed = 0;
    if (isNaN(STATE.velocity)) STATE.velocity = 0;
}

// Сбрасываем lastTouchY когда отпускаем палец, чтобы следующий тап не дергал модель
function resetInput() {
    STATE.lastTouchY = null;
    STATE.velocity = 0;
}

document.addEventListener('mousemove', e => handleInput(e.clientY));
document.addEventListener('touchmove', e => { e.preventDefault(); handleInput(e.touches[0].clientY); }, { passive: false });

document.addEventListener('touchstart', e => STATE.lastTouchY = e.touches[0].clientY);
document.addEventListener('touchend', resetInput);
document.addEventListener('mouseup', resetInput);


// --- PHYSICS LOOP ---
function updatePhysics(dt) {
    const cooldown = 0.08;
    const ruinThresh = 1.0;
    
    STATE.velocity *= 0.92; 
    
    if (STATE.strokeSpeed > 0.05) {
        STATE.arousal += STATE.strokeSpeed * 0.006 * dt * 60;
    } else {
        STATE.arousal -= cooldown * dt * 6;
    }
    
    STATE.arousal = Math.max(0, STATE.arousal);
    if (STATE.arousal >= ruinThresh) endGame(false);
    
    if (window.ringGroup) {
        const ringSpeed = 0.5 + (STATE.strokeSpeed * 20.0);
        STATE.ringPhase += ringSpeed * dt;
        const sineWave = Math.sin(STATE.ringPhase);
        STATE.ringY = 0.15 + (sineWave * 3.35);
        
        ringGroup.position.y = STATE.ringY;
        
        const direction = Math.cos(STATE.ringPhase); 
        ringGroup.rotation.x = (Math.PI / 2) - (direction * 0.15);
    }
}

function processScript(dt) {
    if (typeof GAME_SCRIPT === 'undefined') return;
    const action = GAME_SCRIPT[STATE.scriptIdx];
    if (!action) { endGame(true); return; }

    STATE.scriptTimer += dt;

    if (STATE.scriptTimer < 0.1) {
        showCommand(action.text, action.sub, action.flash);
        if (action.type === 'rest') STATE.arousal = 0.2;
    }
    
    const edgeThresh = 0.85;

    if (action.type === 'edge') {
        if (STATE.arousal > edgeThresh) {
            DOM.status.innerText = "EDGING";
            DOM.status.style.color = "#ffaa00"; 
        } else {
            DOM.status.innerText = "STROKE";
            DOM.status.style.color = "#fff";
        }
    } else {
        DOM.status.innerText = action.type.toUpperCase();
        DOM.status.style.color = "#00f3ff"; 
    }

    if (STATE.scriptTimer > action.duration) {
        STATE.scriptTimer = 0; STATE.scriptIdx++;
        if (action.type === 'edge' && STATE.arousal > edgeThresh) {
            STATE.edgesSurvived++;
            if(DOM.edgeCounter) DOM.edgeCounter.innerText = `${STATE.edgesSurvived} / 6`;
        }
    }
}

function showCommand(main, sub, flash) {
    if(!DOM.cmdMain) return;
    DOM.cmdMain.innerText = main;
    DOM.cmdSub.innerText = sub || '';
    DOM.cmdMain.className = flash ? 'flash-text' : '';
}

function endGame(win) {
    STATE.screen = 'result';
    if(DOM.overlay) DOM.overlay.classList.add('active');
    if(DOM.tutContent) DOM.tutContent.style.display = 'none';
    if(DOM.resContent) DOM.resContent.style.display = 'block';
    
    if(DOM.resTitle) {
        DOM.resTitle.innerText = win ? "SESSION COMPLETE" : "RUINED";
        DOM.resTitle.style.color = win ? "#00f3ff" : "#ff0055";
    }
    if(DOM.resStats) DOM.resStats.innerText = `Edges: ${STATE.edgesSurvived} / 6`;
}

function drawWaveform() {
    if (!waveCtx || !DOM.waveCanvas) return;
    STATE.waveform.shift(); STATE.waveform.push(STATE.arousal);
    
    if (DOM.waveCanvas.width !== DOM.waveCanvas.clientWidth) {
        DOM.waveCanvas.width = DOM.waveCanvas.clientWidth;
        DOM.waveCanvas.height = DOM.waveCanvas.clientHeight;
    }
    const w = DOM.waveCanvas.width, h = DOM.waveCanvas.height;
    
    waveCtx.clearRect(0, 0, w, h);
    waveCtx.beginPath(); waveCtx.moveTo(0, h);
    const step = w / STATE.waveform.length;
    for (let i = 0; i < STATE.waveform.length; i++) {
        waveCtx.lineTo(i * step, h - (STATE.waveform[i] * h * 0.9));
    }
    waveCtx.strokeStyle = "#00f3ff"; waveCtx.lineWidth = 2; waveCtx.stroke();
    
    waveCtx.fillStyle = "rgba(255, 170, 0, 0.2)";
    waveCtx.fillRect(0, 0, w, h - (0.85 * h * 0.9));
}

function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta(); STATE.time += dt;

    if (STATE.screen === 'playing') {
        updatePhysics(dt); processScript(dt); drawWaveform();
        
        const pct = Math.min(STATE.arousal * 100, 100);
        if(DOM.arousalFill) {
            DOM.arousalFill.style.width = pct + '%';
            if(STATE.arousal > 1.0) DOM.arousalFill.style.background = '#ff0000';
            else if(STATE.arousal > 0.85) DOM.arousalFill.style.background = '#ffaa00';
            else DOM.arousalFill.style.background = '#00f3ff';
            
            if(DOM.arousalVal) DOM.arousalVal.innerText = Math.floor(pct) + '%';
        }
        
        if (STATE.arousal > 0.95) document.body.classList.add('shake-screen');
        else document.body.classList.remove('shake-screen');
        
        if (window.updateVisuals) window.updateVisuals(STATE.arousal, STATE.strokeSpeed, STATE.time, STATE.velocity, STATE.ringY);
    }
    if(renderer) renderer.render(scene, camera);
}

if(DOM.startBtn) {
    DOM.startBtn.onclick = () => {
        if (typeof AudioSystem !== 'undefined' && AudioSystem.init) AudioSystem.init();
        const el = document.documentElement;
        if (el.requestFullscreen) el.requestFullscreen().catch(e=>{});
        DOM.overlay.classList.remove('active');
        STATE.screen = 'playing';
        clock.start();
        animate();
    };
}