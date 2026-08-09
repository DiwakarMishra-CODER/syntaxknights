"use client";

// Lazily initialize AudioContext to comply with browser autoplay policies
let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

/** Plays a soft, short "pop/click" when the user sends a message */
export function playSendSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);

  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.1);
}

/** Plays a pleasant double-chime when a question is received */
export function playReceiveSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const playNote = (freq: number, startTime: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.08, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.3);
  };

  const now = ctx.currentTime;
  playNote(523.25, now); // C5
  playNote(659.25, now + 0.1); // E5
}

/** Plays a longer, resolving chord sequence when the interview concludes */
export function playEndSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const playChord = (freqs: number[], startTime: number, duration: number) => {
    freqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.05, startTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  };

  const now = ctx.currentTime;
  // Play C Major chord
  playChord([261.63, 329.63, 392.0], now, 1.5);
}

let activeAlarmOsc: OscillatorNode | null = null;
let activeAlarmGain: GainNode | null = null;
let alarmInterval: number | null = null;

/** Plays a harsh, loud siren-like alarm sound that loops until stopped */
export function playAlarmSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  if (activeAlarmOsc) return; // Already playing

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sawtooth";
  gain.gain.value = 0.5; // Loud

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  
  activeAlarmOsc = osc;
  activeAlarmGain = gain;

  // Modulate frequency to create a siren effect
  let high = true;
  alarmInterval = window.setInterval(() => {
    if (!activeAlarmOsc || !ctx) return;
    activeAlarmOsc.frequency.setValueAtTime(high ? 800 : 400, ctx.currentTime);
    high = !high;
  }, 300);
}

/** Stops the active alarm sound */
export function stopAlarmSound() {
  if (alarmInterval) {
    window.clearInterval(alarmInterval);
    alarmInterval = null;
  }
  
  if (activeAlarmOsc && activeAlarmGain) {
    const ctx = getAudioContext();
    if (ctx) {
      activeAlarmGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      activeAlarmOsc.stop(ctx.currentTime + 0.2);
    } else {
      activeAlarmOsc.stop();
    }
  }
  
  activeAlarmOsc = null;
  activeAlarmGain = null;
}
