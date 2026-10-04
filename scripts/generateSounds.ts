/**
 * Synthesizes the game's sound effects into assets/sounds/*.wav (16-bit mono PCM).
 * No sample files to license: re-run `bun run generate-sounds` after tweaking a recipe.
 */
const RATE = 22050;

type Wave = 'sine' | 'square' | 'triangle';

interface Note {
  /** Start and end frequency in Hz (a sweep when they differ). */
  from: number;
  to?: number;
  ms: number;
  wave?: Wave;
  gain?: number;
  /** Silence before this note, in ms. */
  delay?: number;
}

function osc(wave: Wave, phase: number): number {
  const p = phase % 1;
  if (wave === 'square') return p < 0.5 ? 1 : -1;
  if (wave === 'triangle') return 1 - 4 * Math.abs(p - 0.5);
  return Math.sin(2 * Math.PI * p);
}

function render(notes: Note[]): Float32Array {
  const out: number[] = [];
  for (const n of notes) {
    for (let i = 0; i < Math.round(((n.delay ?? 0) * RATE) / 1000); i++) out.push(0);
    const len = Math.round((n.ms * RATE) / 1000);
    const attack = Math.min(len, Math.round(0.004 * RATE));
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const freq = n.from + ((n.to ?? n.from) - n.from) * t;
      phase += freq / RATE;
      const env = (i < attack ? i / attack : 1) * Math.pow(1 - t, 2);
      out.push(osc(n.wave ?? 'sine', phase) * env * (n.gain ?? 0.6));
    }
  }
  return Float32Array.from(out);
}

function toWav(samples: Float32Array): Uint8Array {
  const buf = new DataView(new ArrayBuffer(44 + samples.length * 2));
  const str = (o: number, s: string) => [...s].forEach((c, i) => buf.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  buf.setUint32(4, 36 + samples.length * 2, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  buf.setUint32(16, 16, true);
  buf.setUint16(20, 1, true); // PCM
  buf.setUint16(22, 1, true); // mono
  buf.setUint32(24, RATE, true);
  buf.setUint32(28, RATE * 2, true);
  buf.setUint16(32, 2, true);
  buf.setUint16(34, 16, true);
  str(36, 'data');
  buf.setUint32(40, samples.length * 2, true);
  samples.forEach((s, i) => buf.setInt16(44 + i * 2, Math.max(-1, Math.min(1, s)) * 0x7fff, true));
  return new Uint8Array(buf.buffer);
}

const SOUNDS: Record<string, Note[]> = {
  // Quick rising swoosh as an arrow slides out.
  exit: [{ from: 420, to: 1100, ms: 130, wave: 'triangle', gain: 0.55 }],
  // Two low thuds for a blocked tap.
  blocked: [
    { from: 170, to: 120, ms: 90, wave: 'square', gain: 0.3 },
    { from: 150, to: 100, ms: 110, wave: 'square', gain: 0.3, delay: 25 },
  ],
  // C–E–G–C arpeggio.
  win: [
    { from: 523, ms: 110, wave: 'triangle' },
    { from: 659, ms: 110, wave: 'triangle' },
    { from: 784, ms: 110, wave: 'triangle' },
    { from: 1047, ms: 380, wave: 'triangle', gain: 0.7 },
  ],
  // Sparkly two-note chime.
  hint: [
    { from: 1319, ms: 90, gain: 0.45 },
    { from: 1976, ms: 220, gain: 0.45 },
  ],
  // Short soft blip for buttons and tabs.
  tap: [{ from: 880, to: 660, ms: 45, gain: 0.4 }],
  // Hammer: a short crunch then a heavy thud.
  smash: [
    { from: 220, to: 70, ms: 70, wave: 'square', gain: 0.3 },
    { from: 130, to: 40, ms: 210, gain: 0.9 },
  ],
  // Extra heart: bright rising three notes.
  life: [
    { from: 659, ms: 80, wave: 'triangle' },
    { from: 880, ms: 80, wave: 'triangle' },
    { from: 1319, ms: 240, wave: 'triangle', gain: 0.65 },
  ],
  // Classic two-note coin "ching".
  coin: [
    { from: 988, ms: 55, wave: 'square', gain: 0.22 },
    { from: 1319, ms: 190, wave: 'square', gain: 0.22 },
  ],
};

for (const [name, notes] of Object.entries(SOUNDS)) {
  const path = `assets/sounds/${name}.wav`;
  await Bun.write(path, toWav(render(notes)));
  console.log(`wrote ${path}`);
}
