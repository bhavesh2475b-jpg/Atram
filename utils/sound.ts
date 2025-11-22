
// Global volume state
let globalVolume = 1.0;

export const setGlobalVolume = (vol: number) => {
  globalVolume = Math.max(0, Math.min(1, vol));
};

// Synthesizer logic for default sounds
const createOscillator = (ctx: AudioContext, type: OscillatorType, freq: number, startTime: number, duration: number) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(startTime);
  osc.stop(startTime + duration);
  
  return { osc, gain };
};

export const playSound = (soundId: string, customUrl?: string) => {
  try {
    // Handle Custom File
    if (soundId === 'custom' && customUrl) {
      const audio = new Audio(customUrl);
      audio.volume = globalVolume;
      audio.play().catch(e => console.error("Error playing custom sound:", e));
      return;
    }

    // Handle Synthesized Defaults
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.value = globalVolume;
    masterGain.connect(ctx.destination);

    const mkOsc = (type: OscillatorType, freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, start);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(start);
        osc.stop(start + dur);
        return { osc, gain: g };
    };

    switch (soundId) {
      case 'chime':
        // Soft major chord fade out
        [261.63, 329.63, 392.00, 523.25].forEach((freq, i) => { // C Major
          const { gain } = mkOsc('sine', freq, now + (i * 0.05), 2.5);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
        });
        break;

      case 'pulse':
        // Deep rhythmic pulse
        const { gain: pGain } = mkOsc('triangle', 110, now, 1.5);
        pGain.gain.setValueAtTime(0, now);
        pGain.gain.linearRampToValueAtTime(0.5, now + 0.1);
        pGain.gain.linearRampToValueAtTime(0, now + 0.8);
        pGain.gain.linearRampToValueAtTime(0.5, now + 0.9);
        pGain.gain.linearRampToValueAtTime(0, now + 1.5);
        break;

      case 'digital':
      default:
        // Classic digital beep pattern
        [880, 0, 880, 0, 880].forEach((freq, i) => {
          if (freq > 0) {
            const { gain } = mkOsc('square', freq, now + (i * 0.15), 0.1);
            gain.gain.setValueAtTime(0.1, now + (i * 0.15));
            gain.gain.linearRampToValueAtTime(0.01, now + (i * 0.15) + 0.1);
          }
        });
        break;
    }
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export const playNotificationSound = () => playSound('digital');
