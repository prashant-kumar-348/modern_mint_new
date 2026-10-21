// Web Audio API Synthesized Sound Effects Engine for Modern Mint
// Zero external audio assets required - ultra-low latency, crisp, non-intrusive sound effects.

class SoundEffectsEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMutedState = false;
    this.volume = 0.35; // Default comfortable volume
    this.initialized = false;
    this.lastClickTime = 0;

    // Load persisted mute preference from localStorage if available
    if (typeof window !== 'undefined') {
      try {
        const savedMute = localStorage.getItem('mm_sound_muted');
        if (savedMute !== null) {
          this.isMutedState = savedMute === 'true';
        }
      } catch (_) {}
    }
  }

  // Lazily initialize AudioContext on user gesture
  getAudioContext() {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMutedState ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  isMuted() {
    return this.isMutedState;
  }

  toggleMute() {
    this.isMutedState = !this.isMutedState;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMutedState ? 0 : this.volume, this.ctx.currentTime);
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('mm_sound_muted', String(this.isMutedState));
        window.dispatchEvent(new CustomEvent('mm_sound_mute_changed', { detail: { muted: this.isMutedState } }));
      } catch (_) {}
    }
    return this.isMutedState;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMutedState) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  // Play a sound effect by name
  play(soundName) {
    if (this.isMutedState) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx || !this.masterGain) return;

      const now = ctx.currentTime;

      switch (soundName) {
        case 'click':
          this.playClick(ctx, now);
          break;
        case 'dice':
          this.playDiceRoll(ctx, now);
          break;
        case 'cash':
        case 'coins':
          this.playCoins(ctx, now);
          break;
        case 'card':
          this.playCardDraw(ctx, now);
          break;
        case 'phase':
          this.playPhaseTransition(ctx, now);
          break;
        case 'notify':
          this.playNotification(ctx, now);
          break;
        case 'modal':
          this.playModal(ctx, now);
          break;
        case 'deal':
        case 'success':
          this.playDeal(ctx, now);
          break;
        case 'alert':
        case 'warn':
          this.playAlert(ctx, now);
          break;
        case 'victory':
        case 'win':
          this.playVictory(ctx, now);
          break;
        default:
          this.playClick(ctx, now);
      }
    } catch (e) {
      // Audio errors must never disrupt game logic
      console.warn('[SoundEffects] Playback error:', e);
    }
  }

  // 1. Subtle tactile button click (35ms soft wood/metallic tap)
  playClick(ctx, now) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.Q.setValueAtTime(2.5, now);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.035);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  // 2. Realistic dice rolling rattle & table landing thud
  playDiceRoll(ctx, now) {
    const bounces = [0, 0.08, 0.16, 0.24, 0.34];
    bounces.forEach((t, i) => {
      const isFinal = i === bounces.length - 1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isFinal ? 320 : 750 + Math.random() * 350, now + t);

      osc.type = isFinal ? 'triangle' : 'square';
      osc.frequency.setValueAtTime(isFinal ? 110 : 180 + Math.random() * 120, now + t);
      osc.frequency.exponentialRampToValueAtTime(45, now + t + (isFinal ? 0.12 : 0.04));

      const vol = isFinal ? 0.32 : 0.14 + Math.random() * 0.08;
      gain.gain.setValueAtTime(vol, now + t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + (isFinal ? 0.13 : 0.05));

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + t);
      osc.stop(now + t + (isFinal ? 0.14 : 0.06));
    });
  }

  // 3. Bright glittering gold coin chimes
  playCoins(ctx, now) {
    const notes = [1318.51, 1567.98, 2093.0]; // E6, G6, C7
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const delay = idx * 0.07;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0.2, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.42);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + delay);
      osc.stop(now + delay + 0.45);
    });
  }

  // 4. Smooth card draw / slide swoosh
  playCardDraw(ctx, now) {
    const bufferSize = Math.floor(ctx.sampleRate * 0.12);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2600, now);
    filter.frequency.exponentialRampToValueAtTime(700, now + 0.11);
    filter.Q.setValueAtTime(1.8, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
  }

  // 5. Cinematic phase transition whoosh + sparkle
  playPhaseTransition(ctx, now) {
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(85, now);
    sub.frequency.exponentialRampToValueAtTime(135, now + 0.25);
    sub.frequency.exponentialRampToValueAtTime(50, now + 0.65);

    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.linearRampToValueAtTime(0.25, now + 0.18);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

    sub.connect(subGain);
    subGain.connect(this.masterGain);
    sub.start(now);
    sub.stop(now + 0.75);

    // Warm chord chime
    [659.25, 783.99, 1046.50].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const delay = 0.14 + i * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0.16, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.5);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + delay);
      osc.stop(now + delay + 0.55);
    });
  }

  // 6. Gentle pleasant notification / turn start chime
  playNotification(ctx, now) {
    [523.25, 659.25].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const delay = idx * 0.1;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0.22, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.38);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + delay);
      osc.stop(now + delay + 0.42);
    });
  }

  // 7. Airy pop for opening modals or expanding sheets
  playModal(ctx, now) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, now);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(580, now + 0.06);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  // 8. Deal formalization / milestone success chord
  playDeal(ctx, now) {
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const delay = idx * 0.07;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0.18, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.42);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + delay);
      osc.stop(now + delay + 0.48);
    });
  }

  // 9. Alert / warning / bankruptcy pulse
  playAlert(ctx, now) {
    [0, 0.17].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(420, now + delay);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(196, now + delay); // G3

      gain.gain.setValueAtTime(0.18, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.14);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + delay);
      osc.stop(now + delay + 0.15);
    });
  }

  // 10. Victory fanfare for winner / game over
  playVictory(ctx, now) {
    const fanfare = [
      { f: 523.25, d: 0, dur: 0.14 },
      { f: 659.25, d: 0.13, dur: 0.14 },
      { f: 783.99, d: 0.26, dur: 0.14 },
      { f: 1046.50, d: 0.42, dur: 0.55 },
    ];
    fanfare.forEach((item) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(item.f, now + item.d);

      gain.gain.setValueAtTime(0.26, now + item.d);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + item.d + item.dur);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + item.d);
      osc.stop(now + item.d + item.dur + 0.06);
    });
  }

  // Global click delegate: Automatically plays subtle click on any interactive element
  initGlobalListener() {
    if (typeof window === 'undefined' || this.initialized) return;
    this.initialized = true;

    window.addEventListener(
      'click',
      (e) => {
        // Debounce clicks slightly so double-clicks don't blast sound
        const now = Date.now();
        if (now - this.lastClickTime < 50) return;

        const target = e.target;
        if (!target || !(target instanceof HTMLElement)) return;

        // Check if element or any ancestor is clickable
        const interactive = target.closest(
          'button, [role="button"], a, input[type="submit"], input[type="button"], select, [data-sound]'
        );

        if (interactive) {
          // If marked explicitly with data-no-sound, skip
          if (interactive.getAttribute('data-no-sound') === 'true') return;

          const customSound = interactive.getAttribute('data-sound');
          this.lastClickTime = now;
          if (customSound) {
            this.play(customSound);
          } else {
            this.play('click');
          }
        }
      },
      { capture: true, passive: true }
    );
  }
}

export const soundEffects = new SoundEffectsEngine();
export default soundEffects;
