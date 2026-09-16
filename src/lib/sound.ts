let ctx: AudioContext | null = null;

export type SoundType = "move" | "capture" | "check" | "victory" | "defeat" | "illegal";

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
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(360, now);
        osc.frequency.exponentialRampToValueAtTime(190, now + 0.08);
        gain.gain.setValueAtTime(vol * 0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.11);
        break;
      }
      case "capture": {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
        gain.gain.setValueAtTime(vol * 0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
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
