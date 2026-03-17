export class SoundManager {
  private audioCtx: AudioContext | null = null;

  constructor() {
    // Audio context is initialized on first user interaction
  }

  private init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  playGunshot() {
    this.init();
    if (!this.audioCtx) return;

    const oscillator = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(150, this.audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);

    oscillator.connect(gain);
    gain.connect(this.audioCtx.destination);

    oscillator.start();
    oscillator.stop(this.audioCtx.currentTime + 0.1);
    
    // Add some noise for the "crack"
    this.playNoise(0.05, 0.05);
  }

  playHit() {
    this.init();
    if (!this.audioCtx) return;

    const oscillator = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(100, this.audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.2);

    oscillator.connect(gain);
    gain.connect(this.audioCtx.destination);

    oscillator.start();
    oscillator.stop(this.audioCtx.currentTime + 0.2);
  }

  private playNoise(duration: number, volume: number) {
    if (!this.audioCtx) return;
    const bufferSize = this.audioCtx.sampleRate * duration;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);

    noise.connect(gain);
    gain.connect(this.audioCtx.destination);

    noise.start();
  }
}
