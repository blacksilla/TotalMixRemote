/**
 * TotalMix FX OSC Command Reference
 *
 * How TotalMix OSC works:
 * ─────────────────────────────────────────────────────────────────────────────
 * TotalMix uses a "bank + page" navigation model.
 *
 * ROWS:
 *   Row 1 (Inputs):    /1/  prefix
 *   Row 2 (Playback):  /2/  prefix  (software playback channels)
 *   Row 3 (Outputs):   /3/  prefix
 *
 * SUBMIX SELECTION:
 *   Before controlling a submix (headphone/monitor bus), you must SELECT it:
 *   /1/busOutput  <index_float>   (1.0 = first output pair, 2.0 = second, etc.)
 *
 *   After selecting a submix, all fader/mute messages affect THAT submix's
 *   send levels — not the master output faders.
 *
 * FADERS:
 *   /1/volume<N>   0.0–1.0   (input channel N fader in selected submix)
 *   /2/volume<N>   0.0–1.0   (playback channel N fader in selected submix)
 *   /3/volume<N>   0.0–1.0   (output channel N master fader)
 *
 * MUTES:
 *   /1/mute<N>     1.0 = toggle mute on input channel N
 *   /2/mute<N>     1.0 = toggle mute on playback channel N
 *
 * MASTER OUTPUT VOLUME (Main Out):
 *   /3/volume1    0.0–1.0    (controls the Main Out pair)
 *
 * SNAPSHOTS (Recall a saved mix):
 *   /1/snapShot<N>  1.0      (N = 1–8)
 *
 * DIM:
 *   /1/mainDim     1.0 = toggle dim
 *
 * MUTE ALL:
 *   /1/mainMute    1.0 = toggle global mute
 *
 * LEVEL FEEDBACK:
 *   TotalMix sends back OSC on port 9001. The messages mirror the addresses
 *   above with the current values, so you can keep your UI in sync.
 *
 * BANK SIZE:
 *   In TotalMix Settings → OSC, set "Number of faders per bank" to match
 *   your interface's channel count. If your interface has 8 analog inputs,
 *   set it to 8. This determines what /1/volume1 through /1/volume8 map to.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * EXAMPLE — Set Phones 1 mix, input channel 3 to 75%:
 *   1. /1/busOutput  1.0       ← select output bus 1 (Phones 1)
 *   2. /1/volume3    0.75      ← set input ch3 send to 75% in that mix
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const OSC = {
  // Select which output submix to control (1-based index as float)
  selectSubmix: (index) => ({ address: '/1/busOutput', value: parseFloat(index) }),

  // Input row fader for channel N in the selected submix (0.0 – 1.0)
  inputFader: (ch) => `/1/volume${ch}`,

  // Playback row fader for channel N in the selected submix
  playbackFader: (ch) => `/2/volume${ch}`,

  // Output master fader for channel N
  outputFader: (ch) => `/3/volume${ch}`,

  // Mute toggles (send 1.0 to toggle)
  inputMute: (ch) => `/1/mute${ch}`,
  playbackMute: (ch) => `/2/mute${ch}`,

  // Global controls
  mainDim: '/1/mainDim',
  mainMute: '/1/mainMute',

  // Snapshots 1–8
  snapshot: (n) => `/1/snapShot${n}`,

  // Utility: convert dB to OSC float (TotalMix uses 0.0–1.0 where 1.0 = 0dB)
  // Approximate mapping: 0dB = 1.0, -6dB ≈ 0.875, -inf = 0.0
  dbToFloat: (db) => {
    if (db <= -65) return 0;
    // TotalMix fader curve is roughly logarithmic
    // This is an approximation — fine-tune by ear or from the OSC table
    const clamped = Math.max(-65, Math.min(6, db));
    return Math.pow(10, clamped / 20) / Math.pow(10, 6 / 20);
  },

  floatToDb: (f) => {
    if (f <= 0) return -Infinity;
    return 20 * Math.log10(f * Math.pow(10, 6 / 20));
  },
};

/**
 * Default mix buses — edit these to match your interface's output routing.
 * index: the OSC busOutput index (1-based)
 */
export const DEFAULT_CHANNELS = [
  // ── Hardware Inputs ──────────────────────────────────────────
  { id: 1,  name: '1-KICK',     type: 'input', ch: 1,  color: '#FF4757' },
  { id: 2,  name: '2-SNS TOP',  type: 'input', ch: 2,  color: '#FF4757' },
  { id: 3,  name: '3-SNRLOTTO', type: 'input', ch: 3,  color: '#FF4757' },
  { id: 4,  name: '4-HIHAT',    type: 'input', ch: 4,  color: '#FF6584' },
  { id: 5,  name: '5-TT',       type: 'input', ch: 5,  color: '#FF6584' },
  { id: 6,  name: '6-OC',       type: 'input', ch: 6,  color: '#FF6584' },
  { id: 7,  name: '7-OH',       type: 'input', ch: 7,  color: '#FF6584' },
  { id: 8,  name: '8-RIDE',     type: 'input', ch: 8,  color: '#FF6584' },
  { id: 9,  name: '9-BAND',     type: 'input', ch: 9,  color: '#F9A826' },
  { id: 10, name: '10-BASS',    type: 'input', ch: 10, color: '#43D9AD' },
  { id: 11, name: '11-VOZ ME',  type: 'input', ch: 11, color: '#6C63FF' },
  { id: 12, name: '12-ELEC ME', type: 'input', ch: 12, color: '#43D9AD' },
  { id: 13, name: '13-AC. ME',  type: 'input', ch: 13, color: '#43D9AD' },
  { id: 14, name: '14-VOZ AF',  type: 'input', ch: 14, color: '#FF6584' },
  { id: 15, name: '15-ELEC AF', type: 'input', ch: 15, color: '#43D9AD' },
  { id: 16, name: '16-AC AFON', type: 'input', ch: 16, color: '#43D9AD' },
  { id: 17, name: '17-VOZ GUS', type: 'input', ch: 17, color: '#F9A826' },
  { id: 18, name: '18-VIOLINO', type: 'input', ch: 18, color: '#ffa502' },
  { id: 19, name: '19-T.BACK',  type: 'input', ch: 19, color: '#eccc68' },
  { id: 20, name: 'L/R',        type: 'input', ch: 20, color: '#2ed573' },
  { id: 21, name: 'CLICK',      type: 'input', ch: 21, color: '#FF4757' },
  { id: 22, name: 'MARIANA',    type: 'input', ch: 22, color: '#6C63FF' },

  // ── Software Playback ────────────────────────────────────────
  { id: 23, name: 'NUNO',         type: 'playback', ch: 1, color: '#6C63FF' },
  { id: 24, name: 'JOAO',         type: 'playback', ch: 2, color: '#FF6584' },
  { id: 25, name: 'AFONSO',       type: 'playback', ch: 3, color: '#43D9AD' },
  { id: 26, name: 'GUSTAVO',      type: 'playback', ch: 4, color: '#F9A826' },
  { id: 27, name: 'REVERB SEND',  type: 'playback', ch: 5, color: '#555577' },
];

export const DEFAULT_BUSES = [
  { id: 1, name: 'NUNO',    color: '#6C63FF' },
  { id: 2, name: 'JOAO',    color: '#FF6584' },
  { id: 3, name: 'AFONSO',  color: '#43D9AD' },
  { id: 4, name: 'GUSTAVO', color: '#F9A826' },
];