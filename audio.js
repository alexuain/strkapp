const AudioSystem = {
    ctx: null, masterGain: null, ready: false, buffers: {},
    // Файлы (отключены для безопасности по умолчанию)
    // Чтобы включить: раскомментируйте loadAllSounds() в init()
    manifest: { 
        'hit_soft': 'audio/hit_soft.mp3', 
        'hit_hard': 'audio/hit_hard.mp3',
        'wet_slap': 'audio/wet_slap.mp3' 
    },

    init() {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 1.0;
        this.masterGain.connect(this.ctx.destination);
        
        // this.loadAllSounds(); // ВКЛЮЧИТЬ ЭТО, ЕСЛИ ФАЙЛЫ ЕСТЬ
        this.ready = true;
        console.log("Audio Safe Mode: Active");
    },

    async loadAllSounds() {
        for (const [key, url] of Object.entries(this.manifest)) {
            try {
                const res = await fetch(url);
                const buf = await res.arrayBuffer();
                this.buffers[key] = await this.ctx.decodeAudioData(buf);
            } catch(e) {}
        }
    },

    playSample(key) {
        if(!this.buffers[key]) return false;
        const src = this.ctx.createBufferSource();
        src.buffer = this.buffers[key];
        src.connect(this.masterGain);
        src.start(0);
        return true;
    },

    // Синтезатор (работает всегда)
    synthKick(intensity) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.5 * intensity, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
        osc.connect(gain); gain.connect(this.masterGain);
        osc.start(); osc.stop(this.ctx.currentTime + 0.15);
    },

    playHit(intensity = 1) {
        if(!this.ready) return;
        // Если файла нет, играем синт
        if(!this.playSample(intensity > 1.2 ? 'hit_hard' : 'hit_soft')) {
            this.synthKick(intensity);
        }
        this.playSample('wet_slap');
    },

    playClimax() { console.log("CLIMAX SOUND"); },
    updateAmbience(heat) {}
};