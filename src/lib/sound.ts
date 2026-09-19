let ctx: AudioContext | null = null;

export type SoundType = "move" | "capture" | "check" | "castle" | "victory" | "defeat" | "illegal";

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AudioCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return null;
    ctx = ctx ?? new AudioCtor();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function playMoveSound(volume: number, type: SoundType = "move") {
  const audioCtx = getAudioContext();
  if (!audioCtx) return;

  const vol = Math.min(Math.max(volume, 0), 1);
  if (vol === 0) return;

  const now = audioCtx.currentTime;

  try {
    switch (type) {
      case "move": {
        // Warm tactile piece placement tap
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.09);
        gain.gain.setValueAtTime(vol * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.11);
        break;
      }
      case "castle": {
        [0, 0.07].forEach((delay) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(360 - delay * 800, now + delay);
          osc.frequency.exponentialRampToValueAtTime(160, now + delay + 0.07);
          gain.gain.setValueAtTime(vol * 0.35, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.09);
          osc.connect(gain).connect(audioCtx.destination);
          osc.start(now + delay);
          osc.stop(now + delay + 0.1);
        });
        break;
      }
      case "capture": {
        // Layer 1: High-frequency percussive slash crack
        const snapOsc = audioCtx.createOscillator();
        const snapGain = audioCtx.createGain();
        snapOsc.type = "sawtooth";
        snapOsc.frequency.setValueAtTime(780, now);
        snapOsc.frequency.exponentialRampToValueAtTime(180, now + 0.08);
        snapGain.gain.setValueAtTime(vol * 0.55, now);
        snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
        snapOsc.connect(snapGain).connect(audioCtx.destination);
        snapOsc.start(now);
        snapOsc.stop(now + 0.1);

        // Layer 2: Deep punchy impact thump
        const thumpOsc = audioCtx.createOscillator();
        const thumpGain = audioCtx.createGain();
        thumpOsc.type = "sine";
        thumpOsc.frequency.setValueAtTime(240, now);
        thumpOsc.frequency.exponentialRampToValueAtTime(45, now + 0.16);
        thumpGain.gain.setValueAtTime(vol * 0.65, now);
        thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
        thumpOsc.connect(thumpGain).connect(audioCtx.destination);
        thumpOsc.start(now);
        thumpOsc.stop(now + 0.19);
        break;
      }
      case "check": {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.08); // A5
        gain.gain.setValueAtTime(vol * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.23);
        break;
      }
      case "victory": {
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          const startTime = now + idx * 0.09;
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(vol * 0.3, startTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.25);
          osc.connect(gain).connect(audioCtx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.26);
        });
        break;
      }
      case "defeat": {
        const notes = [440, 415.3, 392, 349.23]; // A4, Ab4, G4, F4
        notes.forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          const startTime = now + idx * 0.12;
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(vol * 0.35, startTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.3);
          osc.connect(gain).connect(audioCtx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.32);
        });
        break;
      }
      case "illegal": {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(150, now);
        gain.gain.setValueAtTime(vol * 0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.16);
        break;
      }
    }
  } catch {
    /* audio playback fallback */
  }
}
