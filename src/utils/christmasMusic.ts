/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MusicalNoteEvent {
  /** Beat offset from track start (in quarter-note beats) */
  beat: number;
  /** MIDI note number (60 = C4, 69 = A4 = 440Hz) */
  midi: number;
  /** Note length in quarter-note beats */
  duration: number;
  /** Relative velocity 0.1..1.0 */
  velocity?: number;
  /** Instrument voice timbre */
  voice?: 'piano' | 'celesta' | 'bass';
}

export interface ChordPadEvent {
  beat: number;
  midis: number[];
  duration: number;
  velocity?: number;
}

export interface GroovePercussionEvent {
  beat: number;
  kind: 'kick' | 'shaker' | 'sleigh';
  velocity?: number;
}

export interface ChristmasInstrumentalTrack {
  id: string;
  title: string;
  vietnameseSubtitle: string;
  origin: string;
  bpm: number;
  totalBeats: number;
  melody: MusicalNoteEvent[];
  chords: ChordPadEvent[];
  percussion: GroovePercussionEvent[];
}

/**
 * Standard equal-temperament MIDI note to frequency (Hz).
 */
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Computes track duration in seconds from BPM and beat count.
 */
export function getTrackDurationSeconds(track: ChristmasInstrumentalTrack): number {
  return (track.totalBeats / track.bpm) * 60;
}

/**
 * Formats seconds as M:SS for clean tabular display.
 */
export function formatTrackTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getNextTrackIndex(currentIndex: number, total: number): number {
  if (total <= 0) return 0;
  return (currentIndex + 1) % total;
}

export function getPrevTrackIndex(currentIndex: number, total: number): number {
  if (total <= 0) return 0;
  return (currentIndex - 1 + total) % total;
}

// Helper: [midi, durationBeats, velocity?] — midi=0 means musical rest
type RawNote = [number, number, number?];

function seq(
  rawNotes: RawNote[],
  startBeat = 0,
  voice: MusicalNoteEvent['voice'] = 'piano',
  transpose = 0,
  velocityScale = 1
): MusicalNoteEvent[] {
  const out: MusicalNoteEvent[] = [];
  let cursor = startBeat;
  for (const [midi, duration, velocity] of rawNotes) {
    if (midi > 0) {
      out.push({
        beat: cursor,
        midi: midi + transpose,
        duration,
        velocity: Math.min(1, Math.max(0.18, (velocity ?? 0.82) * velocityScale)),
        voice
      });
    }
    cursor += duration;
  }
  return out;
}

interface ChordCycleSpec {
  beatOffset: number;
  midis: number[];
  duration: number;
  bassMidi: number;
}

/**
 * Arranges an upbeat, bright, toe-tapping (> 2 minutes) Holiday Groove / Jazz-Swing piece:
 *   - 4-beat crisp intro with bouncy piano chord pickup & sleigh-bell count-in
 *   - Multi-section cycling between Phrase A (Chorus/Main) & Phrase B (Verse/Bridge)
 *   - Bouncy walking bassline, rhythmic offbeat piano comping, sparkling celesta/glockenspiel lift,
 *     and crisp brushed percussion + sleigh-bell offbeat shimmer (never sluggish or sleepy!)
 *   - Joyful final cadence with bright bell sparkle
 */
function buildUpbeatHolidayGroove(params: {
  phraseA: RawNote[];
  phraseB?: RawNote[];
  phraseLengthBeats: number;
  chordsA: ChordCycleSpec[];
  chordsB?: ChordCycleSpec[];
  cycles: number;
  meter?: '4/4' | '3/4';
}): {
  totalBeats: number;
  melody: MusicalNoteEvent[];
  chords: ChordPadEvent[];
  percussion: GroovePercussionEvent[];
} {
  const {
    phraseA,
    phraseB,
    phraseLengthBeats,
    chordsA,
    chordsB,
    cycles,
    meter = '4/4'
  } = params;
  const melody: MusicalNoteEvent[] = [];
  const chords: ChordPadEvent[] = [];
  const percussion: GroovePercussionEvent[] = [];

  const barBeats = meter === '3/4' ? 3 : 4;
  const introBeats = barBeats * 2; // Crisp 2-bar pickup intro

  // Intro groove: bright chord bounce + sleigh-bell sparkle
  const introC1 = chordsA[0];
  const introC2 = chordsA[Math.min(1, chordsA.length - 1)];
  chords.push(
    { beat: 0, midis: introC1.midis, duration: barBeats * 0.65, velocity: 0.78 },
    { beat: barBeats, midis: introC2.midis, duration: barBeats * 0.65, velocity: 0.82 }
  );
  melody.push(
    { beat: 0, midi: introC1.bassMidi, duration: barBeats * 0.8, velocity: 0.68, voice: 'bass' },
    { beat: barBeats, midi: introC2.bassMidi, duration: barBeats * 0.8, velocity: 0.72, voice: 'bass' }
  );
  for (let b = 0; b < introBeats; b++) {
    percussion.push({
      beat: b,
      kind: b % barBeats === 0 ? 'kick' : 'sleigh',
      velocity: b % barBeats === 0 ? 0.45 : 0.36
    });
    if (b + 0.5 < introBeats) {
      percussion.push({ beat: b + 0.5, kind: 'shaker', velocity: 0.24 });
    }
  }

  let cursor = introBeats;

  for (let c = 0; c < cycles; c++) {
    const useB = Boolean(phraseB && chordsB && c % 2 === 1);
    const activePhrase = useB && phraseB ? phraseB : phraseA;
    const activeChords = useB && chordsB ? chordsB : chordsA;

    // Lively arrangement arc: bright piano -> full groove -> celesta lift -> octave sparkle reprise
    const isBrightLift = c % 3 === 1;
    const isFullSparkle = c >= 2 && c % 2 === 0;
    const isOutroCycle = c === cycles - 1;

    // 1. Primary melody voice (crisp piano lead + sparkling celesta/glockenspiel doubling on lifts)
    melody.push(
      ...seq(activePhrase, cursor, 'piano', 0, isOutroCycle ? 0.88 : 0.9)
    );

    if (isBrightLift || isFullSparkle) {
      melody.push(
        ...seq(activePhrase, cursor, 'celesta', 12, isFullSparkle ? 0.68 : 0.54)
      );
    }

    // 2. Rhythmic bouncy chord comping + walking/root-fifth bassline
    for (const ch of activeChords) {
      const start = cursor + ch.beatOffset;
      const compDur = Math.min(ch.duration, barBeats);

      // Primary upbeat chord stab
      chords.push({
        beat: start,
        midis: ch.midis,
        duration: Math.max(0.75, compDur * 0.55),
        velocity: isFullSparkle ? 0.84 : 0.76
      });

      // Syncopated rhythmic bounce chord on offbeat for lively swing/groove energy
      if (ch.duration >= 3) {
        const bounceOffset = meter === '3/4' ? 1.5 : 2.0;
        chords.push({
          beat: start + bounceOffset,
          midis: ch.midis,
          duration: Math.min(1.4, ch.duration - bounceOffset),
          velocity: 0.62
        });
      }

      // Bouncy root -> fifth walking bassline (keeps tempo crisp and joyful!)
      melody.push({
        beat: start,
        midi: ch.bassMidi,
        duration: Math.min(1.75, ch.duration * 0.48),
        velocity: 0.76,
        voice: 'bass'
      });

      if (ch.duration >= 3) {
        const midBassBeat = meter === '3/4' ? 2 : 2;
        const fifthMidi = ch.bassMidi + 7 <= 55 ? ch.bassMidi + 7 : ch.bassMidi - 5;
        melody.push({
          beat: start + midBassBeat,
          midi: fifthMidi,
          duration: Math.min(1.5, ch.duration - midBassBeat),
          velocity: 0.66,
          voice: 'bass'
        });
      }
    }

    // 3. Crisp light brushed groove + festive sleigh-bell shimmer every bar
    for (let b = 0; b < phraseLengthBeats; b++) {
      const beatAbs = cursor + b;
      const inBar = b % barBeats;

      if (inBar === 0) {
        percussion.push({ beat: beatAbs, kind: 'kick', velocity: isFullSparkle ? 0.64 : 0.54 });
        percussion.push({ beat: beatAbs, kind: 'shaker', velocity: 0.25 });
      } else if (meter === '4/4' && inBar === 2) {
        percussion.push({ beat: beatAbs, kind: 'kick', velocity: 0.42 });
        percussion.push({ beat: beatAbs, kind: 'sleigh', velocity: isFullSparkle ? 0.56 : 0.44 });
      } else if (inBar === 1 || inBar === 3) {
        percussion.push({ beat: beatAbs, kind: 'sleigh', velocity: isFullSparkle ? 0.52 : 0.42 });
      } else {
        percussion.push({ beat: beatAbs, kind: 'shaker', velocity: 0.32 });
      }

      // Swung eighth-note offbeat brush shimmer for forward momentum
      if (b + 0.5 < phraseLengthBeats) {
        percussion.push({
          beat: beatAbs + 0.5,
          kind: 'shaker',
          velocity: isFullSparkle ? 0.28 : 0.2
        });
      }
    }

    cursor += phraseLengthBeats;
  }

  // Crisp, joyful 1-bar finale cadence
  const endChord = chordsA[0];
  chords.push({
    beat: cursor,
    midis: endChord.midis,
    duration: barBeats,
    velocity: 0.85
  });
  melody.push({
    beat: cursor,
    midi: endChord.bassMidi,
    duration: barBeats,
    velocity: 0.72,
    voice: 'bass'
  });
  endChord.midis.forEach((m, i) => {
    melody.push({
      beat: cursor + i * 0.35,
      midi: m + 24,
      duration: 2.2,
      velocity: 0.55 - i * 0.05,
      voice: 'celesta'
    });
  });
  percussion.push(
    { beat: cursor, kind: 'kick', velocity: 0.62 },
    { beat: cursor, kind: 'sleigh', velocity: 0.6 }
  );

  const totalBeats = cursor + barBeats;
  melody.sort((a, b) => a.beat - b.beat);
  chords.sort((a, b) => a.beat - b.beat);
  percussion.sort((a, b) => a.beat - b.beat);

  return { totalBeats, melody, chords, percussion };
}

// ============================================================================
// 6 Lively, Upbeat, Joyful Holiday Groove Classics (112–126 BPM · All > 2 Min!)
// ============================================================================

const jingleBellsSwingArr = buildUpbeatHolidayGroove({
  phraseLengthBeats: 32,
  cycles: 8, // 8 + 256 + 4 = 268 beats @ 122 BPM = 2:12
  meter: '4/4',
  phraseA: [
    // Iconic upbeat Chorus: E E E- | E E E- | E G C. D | E - - -
    [64, 1, 0.86], [64, 1, 0.82], [64, 2, 0.9],
    [64, 1, 0.86], [64, 1, 0.82], [64, 2, 0.9],
    [64, 1, 0.88], [67, 1, 0.92], [60, 1.5, 0.84], [62, 0.5, 0.8],
    [64, 3.5, 0.9], [0, 0.5],
    // F F F. F | F E E E E | G G F D | C - - -
    [65, 1, 0.88], [65, 1, 0.84], [65, 1.5, 0.88], [65, 0.5, 0.82],
    [65, 1, 0.86], [64, 1, 0.84], [64, 1, 0.82], [64, 0.5, 0.8], [64, 0.5, 0.82],
    [67, 1, 0.92], [67, 1, 0.88], [65, 1, 0.84], [62, 1, 0.82],
    [60, 3.5, 0.88], [0, 0.5]
  ],
  phraseB: [
    // Bouncy Verse: "Dashing through the snow..."
    [55, 1, 0.78], [64, 1, 0.88], [62, 1, 0.84], [60, 1, 0.82],
    [55, 2.5, 0.78], [55, 0.5, 0.74], [55, 1, 0.78],
    [55, 1, 0.78], [64, 1, 0.88], [62, 1, 0.84], [60, 1, 0.82],
    [57, 3.5, 0.82], [0, 0.5],
    [57, 1, 0.82], [65, 1, 0.9], [64, 1, 0.86], [62, 1, 0.84],
    [67, 1, 0.92], [67, 1, 0.88], [67, 1, 0.86], [67, 1, 0.88],
    [69, 1, 0.92], [67, 1, 0.88], [65, 1, 0.86], [62, 1, 0.84],
    [64, 3.5, 0.88], [0, 0.5]
  ],
  chordsA: [
    { beatOffset: 0, midis: [48, 52, 55, 59], duration: 4, bassMidi: 36 },
    { beatOffset: 4, midis: [48, 52, 55, 62], duration: 4, bassMidi: 36 },
    { beatOffset: 8, midis: [48, 52, 55, 59], duration: 4, bassMidi: 40 },
    { beatOffset: 12, midis: [45, 48, 52, 57], duration: 4, bassMidi: 45 },
    { beatOffset: 16, midis: [45, 53, 57, 60], duration: 4, bassMidi: 41 },
    { beatOffset: 20, midis: [48, 52, 55, 59], duration: 4, bassMidi: 36 },
    { beatOffset: 24, midis: [43, 47, 50, 53], duration: 4, bassMidi: 43 },
    { beatOffset: 28, midis: [48, 52, 55, 62], duration: 4, bassMidi: 36 }
  ],
  chordsB: [
    { beatOffset: 0, midis: [48, 52, 55, 59], duration: 4, bassMidi: 36 },
    { beatOffset: 4, midis: [48, 52, 55, 62], duration: 4, bassMidi: 36 },
    { beatOffset: 8, midis: [48, 52, 55, 59], duration: 4, bassMidi: 40 },
    { beatOffset: 12, midis: [45, 53, 57, 60], duration: 4, bassMidi: 41 },
    { beatOffset: 16, midis: [50, 53, 57, 60], duration: 4, bassMidi: 38 },
    { beatOffset: 20, midis: [43, 47, 50, 53], duration: 4, bassMidi: 43 },
    { beatOffset: 24, midis: [43, 50, 53, 59], duration: 4, bassMidi: 43 },
    { beatOffset: 28, midis: [48, 52, 55, 59], duration: 4, bassMidi: 36 }
  ]
});

const deckTheHallsGrooveArr = buildUpbeatHolidayGroove({
  phraseLengthBeats: 32,
  cycles: 8, // 8 + 256 + 4 = 268 beats @ 118 BPM = 2:16
  meter: '4/4',
  phraseA: [
    // Classic bright "Deck the halls with boughs of holly, Fa la la la la..." in F Major
    [72, 1.5, 0.9], [70, 0.5, 0.82], [69, 1, 0.86], [67, 1, 0.84],
    [65, 1, 0.84], [67, 1, 0.86], [69, 1, 0.88], [65, 1, 0.84],
    [67, 0.5, 0.84], [69, 0.5, 0.86], [70, 0.5, 0.88], [67, 0.5, 0.84], [69, 1.5, 0.9], [67, 0.5, 0.84],
    [65, 1, 0.86], [64, 1, 0.82], [65, 2, 0.88],
    // Second line
    [72, 1.5, 0.9], [70, 0.5, 0.82], [69, 1, 0.86], [67, 1, 0.84],
    [65, 1, 0.84], [67, 1, 0.86], [69, 1, 0.88], [65, 1, 0.84],
    [67, 0.5, 0.84], [69, 0.5, 0.86], [70, 0.5, 0.88], [67, 0.5, 0.84], [69, 1.5, 0.9], [67, 0.5, 0.84],
    [65, 1, 0.86], [64, 1, 0.82], [65, 2, 0.88]
  ],
  phraseB: [
    // Bridge: "Don we now our gay apparel, Fa la la..."
    [67, 1.5, 0.86], [69, 0.5, 0.84], [70, 1, 0.88], [67, 1, 0.84],
    [69, 1.5, 0.88], [70, 0.5, 0.86], [72, 1, 0.92], [67, 1, 0.84],
    [69, 0.5, 0.86], [71, 0.5, 0.88], [72, 1, 0.92], [74, 0.5, 0.92], [76, 0.5, 0.94], [77, 1, 0.95],
    [76, 1, 0.9], [74, 1, 0.88], [72, 2, 0.9],
    // Finale line
    [72, 1.5, 0.9], [70, 0.5, 0.84], [69, 1, 0.88], [67, 1, 0.84],
    [65, 1, 0.84], [67, 1, 0.86], [69, 1, 0.88], [65, 1, 0.84],
    [74, 0.5, 0.92], [74, 0.5, 0.9], [74, 0.5, 0.9], [74, 0.5, 0.9], [72, 1.5, 0.92], [70, 0.5, 0.86],
    [69, 1, 0.88], [67, 1, 0.84], [65, 2, 0.9]
  ],
  chordsA: [
    { beatOffset: 0, midis: [53, 57, 60, 64], duration: 4, bassMidi: 41 },
    { beatOffset: 4, midis: [53, 57, 60, 62], duration: 4, bassMidi: 41 },
    { beatOffset: 8, midis: [46, 53, 58, 62], duration: 4, bassMidi: 46 },
    { beatOffset: 12, midis: [48, 52, 55, 58], duration: 2, bassMidi: 36 },
    { beatOffset: 14, midis: [53, 57, 60, 64], duration: 2, bassMidi: 41 },
    { beatOffset: 16, midis: [53, 57, 60, 64], duration: 4, bassMidi: 41 },
    { beatOffset: 20, midis: [50, 53, 57, 60], duration: 4, bassMidi: 38 },
    { beatOffset: 24, midis: [46, 53, 58, 62], duration: 4, bassMidi: 46 },
    { beatOffset: 28, midis: [48, 52, 55, 58], duration: 2, bassMidi: 36 },
    { beatOffset: 30, midis: [53, 57, 60, 64], duration: 2, bassMidi: 41 }
  ],
  chordsB: [
    { beatOffset: 0, midis: [48, 52, 55, 58], duration: 4, bassMidi: 36 },
    { beatOffset: 4, midis: [53, 57, 60, 64], duration: 4, bassMidi: 41 },
    { beatOffset: 8, midis: [48, 52, 55, 59], duration: 4, bassMidi: 36 },
    { beatOffset: 12, midis: [43, 47, 50, 53], duration: 2, bassMidi: 43 },
    { beatOffset: 14, midis: [48, 52, 55, 59], duration: 2, bassMidi: 36 },
    { beatOffset: 16, midis: [53, 57, 60, 64], duration: 4, bassMidi: 41 },
    { beatOffset: 20, midis: [50, 53, 57, 60], duration: 4, bassMidi: 38 },
    { beatOffset: 24, midis: [46, 53, 58, 62], duration: 4, bassMidi: 46 },
    { beatOffset: 28, midis: [48, 52, 55, 58], duration: 2, bassMidi: 36 },
    { beatOffset: 30, midis: [53, 57, 60, 64], duration: 2, bassMidi: 41 }
  ]
});

const weWishYouUpbeatArr = buildUpbeatHolidayGroove({
  phraseLengthBeats: 24,
  cycles: 11, // 6 + 264 + 3 = 273 beats @ 126 BPM = 2:10
  meter: '3/4',
  phraseA: [
    [67, 1, 0.82],
    [72, 1, 0.9], [72, 0.5, 0.84], [74, 0.5, 0.86], [72, 0.5, 0.84], [71, 0.5, 0.82],
    [69, 1, 0.86], [69, 1, 0.84], [69, 1, 0.84],
    [74, 1, 0.92], [74, 0.5, 0.86], [76, 0.5, 0.88], [74, 0.5, 0.86], [72, 0.5, 0.84],
    [71, 1, 0.86], [67, 1, 0.82], [67, 1, 0.82],
    [76, 1, 0.94], [76, 0.5, 0.88], [77, 0.5, 0.9], [76, 0.5, 0.88], [74, 0.5, 0.86],
    [72, 1, 0.88], [69, 1, 0.84], [67, 0.5, 0.8], [67, 0.5, 0.8],
    [69, 1, 0.84], [74, 1, 0.9], [71, 1, 0.86],
    [72, 2, 0.9]
  ],
  phraseB: [
    [67, 1, 0.82],
    [72, 1, 0.9], [72, 1, 0.88], [72, 1, 0.88],
    [71, 2, 0.86], [71, 1, 0.84],
    [72, 1, 0.88], [71, 1, 0.86], [69, 1, 0.84],
    [67, 2, 0.82], [74, 1, 0.9],
    [76, 1, 0.92], [74, 1, 0.9], [72, 1, 0.88],
    [79, 1, 0.94], [67, 1, 0.82], [67, 0.5, 0.8], [67, 0.5, 0.8],
    [69, 1, 0.84], [74, 1, 0.9], [71, 1, 0.86],
    [72, 2, 0.9]
  ],
  chordsA: [
    { beatOffset: 1, midis: [48, 52, 55, 59], duration: 3, bassMidi: 36 },
    { beatOffset: 4, midis: [45, 53, 57, 60], duration: 3, bassMidi: 41 },
    { beatOffset: 7, midis: [50, 54, 57, 60], duration: 3, bassMidi: 38 },
    { beatOffset: 10, midis: [43, 47, 50, 55], duration: 3, bassMidi: 43 },
    { beatOffset: 13, midis: [48, 52, 55, 59], duration: 3, bassMidi: 40 },
    { beatOffset: 16, midis: [45, 53, 57, 60], duration: 3, bassMidi: 41 },
    { beatOffset: 19, midis: [43, 50, 53, 59], duration: 3, bassMidi: 43 },
    { beatOffset: 22, midis: [48, 52, 55, 62], duration: 2, bassMidi: 36 }
  ],
  chordsB: [
    { beatOffset: 1, midis: [48, 52, 55, 59], duration: 3, bassMidi: 36 },
    { beatOffset: 4, midis: [43, 47, 50, 55], duration: 3, bassMidi: 43 },
    { beatOffset: 7, midis: [45, 48, 52, 57], duration: 3, bassMidi: 45 },
    { beatOffset: 10, midis: [43, 47, 50, 55], duration: 3, bassMidi: 43 },
    { beatOffset: 13, midis: [48, 52, 55, 59], duration: 3, bassMidi: 36 },
    { beatOffset: 16, midis: [43, 47, 50, 55], duration: 3, bassMidi: 43 },
    { beatOffset: 19, midis: [45, 53, 57, 60], duration: 3, bassMidi: 41 },
    { beatOffset: 22, midis: [48, 52, 55, 62], duration: 2, bassMidi: 36 }
  ]
});

const joyToTheWorldGrooveArr = buildUpbeatHolidayGroove({
  phraseLengthBeats: 32,
  cycles: 8, // 8 + 256 + 4 = 268 beats @ 112 BPM = 2:23
  meter: '4/4',
  phraseA: [
    // Radiant upbeat Joy to the World in C Major!
    [72, 2, 0.94], [71, 1.5, 0.88], [69, 0.5, 0.84],
    [67, 3, 0.9], [65, 1, 0.84],
    [64, 2, 0.86], [62, 2, 0.84],
    [60, 3, 0.88], [67, 1, 0.86],
    [69, 3, 0.9], [69, 1, 0.86],
    [71, 3, 0.92], [71, 1, 0.88],
    [72, 3.5, 0.95], [0, 0.5],
    [72, 1, 0.9], [72, 1, 0.88], [71, 1, 0.86], [69, 1, 0.84]
  ],
  phraseB: [
    // Uplifting second half ("And heaven and nature sing...")
    [67, 1.5, 0.88], [65, 0.5, 0.82], [64, 1, 0.86], [72, 1, 0.92],
    [72, 1, 0.9], [71, 1, 0.86], [69, 1, 0.84], [67, 1, 0.86],
    [67, 1.5, 0.88], [65, 0.5, 0.82], [64, 1, 0.86], [64, 1, 0.84],
    [64, 1, 0.86], [64, 1, 0.86], [64, 1, 0.88], [64, 0.5, 0.84], [65, 0.5, 0.86],
    [67, 3, 0.92], [65, 0.5, 0.84], [64, 0.5, 0.84],
    [62, 1, 0.84], [62, 1, 0.84], [62, 1, 0.86], [62, 0.5, 0.82], [64, 0.5, 0.84],
    [65, 3, 0.9], [64, 0.5, 0.84], [62, 0.5, 0.82],
    [64, 1, 0.88], [72, 1, 0.94], [69, 1, 0.88], [67, 1, 0.86]
  ],
  chordsA: [
    { beatOffset: 0, midis: [48, 52, 55, 59], duration: 4, bassMidi: 36 },
    { beatOffset: 4, midis: [43, 47, 50, 55], duration: 4, bassMidi: 43 },
    { beatOffset: 8, midis: [48, 52, 55, 62], duration: 4, bassMidi: 40 },
    { beatOffset: 12, midis: [48, 52, 55, 59], duration: 4, bassMidi: 36 },
    { beatOffset: 16, midis: [45, 53, 57, 60], duration: 4, bassMidi: 41 },
    { beatOffset: 20, midis: [43, 47, 50, 53], duration: 4, bassMidi: 43 },
    { beatOffset: 24, midis: [48, 52, 55, 59], duration: 4, bassMidi: 36 },
    { beatOffset: 28, midis: [45, 48, 52, 57], duration: 4, bassMidi: 45 }
  ],
  chordsB: [
    { beatOffset: 0, midis: [48, 52, 55, 59], duration: 4, bassMidi: 36 },
    { beatOffset: 4, midis: [45, 53, 57, 60], duration: 4, bassMidi: 41 },
    { beatOffset: 8, midis: [48, 52, 55, 62], duration: 4, bassMidi: 36 },
    { beatOffset: 12, midis: [45, 48, 52, 57], duration: 4, bassMidi: 45 },
    { beatOffset: 16, midis: [43, 47, 50, 55], duration: 4, bassMidi: 43 },
    { beatOffset: 20, midis: [50, 53, 57, 60], duration: 4, bassMidi: 38 },
    { beatOffset: 24, midis: [43, 50, 53, 59], duration: 4, bassMidi: 43 },
    { beatOffset: 28, midis: [48, 52, 55, 59], duration: 4, bassMidi: 36 }
  ]
});

const winterCafeSwingArr = buildUpbeatHolidayGroove({
  phraseLengthBeats: 32,
  cycles: 8, // 8 + 256 + 4 = 268 beats @ 116 BPM = 2:18
  meter: '4/4',
  phraseA: [
    // Playful jazzy holiday swing tune (bright, syncopated café winter vibe!)
    [67, 0.5, 0.82], [69, 0.5, 0.84], [72, 1, 0.9], [76, 1, 0.92], [74, 1, 0.86],
    [72, 1.5, 0.88], [69, 0.5, 0.82], [67, 2, 0.84],
    [69, 0.5, 0.84], [72, 0.5, 0.88], [74, 1, 0.9], [76, 1, 0.92], [79, 1, 0.95],
    [76, 1.5, 0.9], [74, 0.5, 0.84], [72, 2, 0.88],
    [77, 1, 0.92], [76, 1, 0.88], [74, 1, 0.86], [72, 1, 0.86],
    [74, 1, 0.9], [72, 1, 0.86], [69, 1, 0.84], [67, 1, 0.82],
    [69, 1, 0.86], [72, 1, 0.88], [74, 1, 0.9], [71, 1, 0.86],
    [72, 3.5, 0.9], [0, 0.5]
  ],
  phraseB: [
    // Bouncy jazz bridge in Fmaj7 -> G7 -> Em7 -> Am7 -> Dm7 -> G7 -> Cmaj7
    [77, 1.5, 0.92], [76, 0.5, 0.86], [74, 1, 0.88], [72, 1, 0.86],
    [74, 1.5, 0.9], [72, 0.5, 0.84], [71, 2, 0.86],
    [76, 1.5, 0.92], [74, 0.5, 0.86], [72, 1, 0.88], [69, 1, 0.84],
    [72, 1.5, 0.88], [71, 0.5, 0.84], [69, 2, 0.84],
    [74, 1, 0.9], [72, 0.5, 0.86], [74, 0.5, 0.88], [76, 1, 0.92], [77, 1, 0.94],
    [79, 1.5, 0.95], [76, 0.5, 0.88], [74, 2, 0.88],
    [72, 1, 0.9], [74, 1, 0.9], [76, 1, 0.92], [74, 1, 0.88],
    [72, 3.5, 0.9], [0, 0.5]
  ],
  chordsA: [
    { beatOffset: 0, midis: [48, 52, 55, 59], duration: 4, bassMidi: 36 },
    { beatOffset: 4, midis: [45, 48, 52, 57], duration: 4, bassMidi: 45 },
    { beatOffset: 8, midis: [50, 53, 57, 60], duration: 4, bassMidi: 38 },
    { beatOffset: 12, midis: [43, 47, 50, 53], duration: 4, bassMidi: 43 },
    { beatOffset: 16, midis: [45, 53, 57, 60], duration: 4, bassMidi: 41 },
    { beatOffset: 20, midis: [48, 52, 55, 59], duration: 4, bassMidi: 36 },
    { beatOffset: 24, midis: [50, 53, 57, 60], duration: 2, bassMidi: 38 },
    { beatOffset: 26, midis: [43, 47, 50, 53], duration: 2, bassMidi: 43 },
    { beatOffset: 28, midis: [48, 52, 55, 62], duration: 4, bassMidi: 36 }
  ],
  chordsB: [
    { beatOffset: 0, midis: [45, 53, 57, 60], duration: 4, bassMidi: 41 },
    { beatOffset: 4, midis: [43, 47, 50, 53], duration: 4, bassMidi: 43 },
    { beatOffset: 8, midis: [47, 52, 55, 59], duration: 4, bassMidi: 40 },
    { beatOffset: 12, midis: [45, 48, 52, 57], duration: 4, bassMidi: 45 },
    { beatOffset: 16, midis: [50, 53, 57, 60], duration: 4, bassMidi: 38 },
    { beatOffset: 20, midis: [43, 50, 53, 59], duration: 4, bassMidi: 43 },
    { beatOffset: 24, midis: [48, 52, 55, 59], duration: 4, bassMidi: 36 },
    { beatOffset: 28, midis: [48, 52, 55, 62], duration: 4, bassMidi: 36 }
  ]
});

const upOnTheHousetopArr = buildUpbeatHolidayGroove({
  phraseLengthBeats: 32,
  cycles: 8, // 8 + 256 + 4 = 268 beats @ 120 BPM = 2:14
  meter: '4/4',
  phraseA: [
    // Super catchy upbeat "Up on the Housetop" in C Major!
    [67, 1, 0.88], [67, 0.5, 0.84], [69, 0.5, 0.86], [67, 1, 0.86], [64, 1, 0.84],
    [60, 1, 0.84], [69, 1, 0.88], [67, 2, 0.88],
    [65, 1, 0.86], [65, 1, 0.84], [64, 1, 0.86], [64, 1, 0.84],
    [62, 1, 0.84], [62, 1, 0.84], [67, 2, 0.88],
    [67, 1, 0.88], [67, 0.5, 0.84], [69, 0.5, 0.86], [67, 1, 0.86], [64, 1, 0.84],
    [60, 1, 0.84], [69, 1, 0.88], [67, 2, 0.88],
    [65, 1, 0.88], [65, 0.5, 0.84], [67, 0.5, 0.86], [64, 1, 0.86], [60, 1, 0.84],
    [62, 1, 0.84], [67, 1, 0.88], [60, 2, 0.9]
  ],
  phraseB: [
    // Chorus: "Ho, ho, ho! Who wouldn't go! Click, click, click..."
    [65, 1, 0.9], [65, 1, 0.88], [69, 2, 0.92],
    [67, 1, 0.9], [67, 0.5, 0.86], [64, 0.5, 0.84], [60, 2, 0.86],
    [62, 1, 0.86], [62, 1, 0.86], [65, 2, 0.9],
    [64, 1, 0.88], [64, 1, 0.86], [67, 2, 0.9],
    [67, 1, 0.9], [67, 0.5, 0.86], [69, 0.5, 0.88], [67, 1, 0.88], [64, 1, 0.86],
    [60, 1, 0.86], [69, 1, 0.9], [67, 1.5, 0.9], [67, 0.5, 0.86],
    [65, 1, 0.88], [65, 0.5, 0.86], [67, 0.5, 0.88], [64, 1, 0.88], [60, 1, 0.86],
    [62, 1, 0.86], [67, 1, 0.9], [60, 2, 0.92]
  ],
  chordsA: [
    { beatOffset: 0, midis: [48, 52, 55, 59], duration: 4, bassMidi: 36 },
    { beatOffset: 4, midis: [45, 53, 57, 60], duration: 2, bassMidi: 41 },
    { beatOffset: 6, midis: [48, 52, 55, 59], duration: 2, bassMidi: 36 },
    { beatOffset: 8, midis: [45, 53, 57, 60], duration: 2, bassMidi: 41 },
    { beatOffset: 10, midis: [48, 52, 55, 59], duration: 2, bassMidi: 40 },
    { beatOffset: 12, midis: [43, 47, 50, 53], duration: 4, bassMidi: 43 },
    { beatOffset: 16, midis: [48, 52, 55, 59], duration: 4, bassMidi: 36 },
    { beatOffset: 20, midis: [45, 53, 57, 60], duration: 2, bassMidi: 41 },
    { beatOffset: 22, midis: [48, 52, 55, 59], duration: 2, bassMidi: 36 },
    { beatOffset: 24, midis: [45, 53, 57, 60], duration: 2, bassMidi: 41 },
    { beatOffset: 26, midis: [48, 52, 55, 59], duration: 2, bassMidi: 40 },
    { beatOffset: 28, midis: [43, 47, 50, 53], duration: 2, bassMidi: 43 },
    { beatOffset: 30, midis: [48, 52, 55, 62], duration: 2, bassMidi: 36 }
  ],
  chordsB: [
    { beatOffset: 0, midis: [45, 53, 57, 60], duration: 4, bassMidi: 41 },
    { beatOffset: 4, midis: [48, 52, 55, 59], duration: 4, bassMidi: 36 },
    { beatOffset: 8, midis: [50, 53, 57, 60], duration: 4, bassMidi: 38 },
    { beatOffset: 12, midis: [48, 52, 55, 59], duration: 2, bassMidi: 36 },
    { beatOffset: 14, midis: [43, 47, 50, 53], duration: 2, bassMidi: 43 },
    { beatOffset: 16, midis: [48, 52, 55, 59], duration: 4, bassMidi: 36 },
    { beatOffset: 20, midis: [45, 53, 57, 60], duration: 2, bassMidi: 41 },
    { beatOffset: 22, midis: [48, 52, 55, 59], duration: 2, bassMidi: 36 },
    { beatOffset: 24, midis: [45, 53, 57, 60], duration: 2, bassMidi: 41 },
    { beatOffset: 26, midis: [48, 52, 55, 59], duration: 2, bassMidi: 40 },
    { beatOffset: 28, midis: [43, 47, 50, 53], duration: 2, bassMidi: 43 },
    { beatOffset: 30, midis: [48, 52, 55, 62], duration: 2, bassMidi: 36 }
  ]
});

/**
 * 6 Upbeat, Joyful, Full-Length (> 2 Minutes Each) Holiday Groove & Jazz-Swing Classics.
 */
export const CHRISTMAS_INSTRUMENTAL_PLAYLIST: ChristmasInstrumentalTrack[] = [
  {
    id: 'jingle-bells-swing',
    title: 'Jingle Bells (Festive Swing)',
    vietnameseSubtitle: 'Jazz-Swing sôi động · Nhịp chuông tuyết rộn ràng',
    origin: 'James Lord Pierpont',
    bpm: 122,
    ...jingleBellsSwingArr
  },
  {
    id: 'deck-the-halls-groove',
    title: 'Deck the Halls (Holiday Bounce)',
    vietnameseSubtitle: 'Upbeat Piano Groove · Tươi vui & giàu năng lượng',
    origin: 'Truyền thống Giáng sinh',
    bpm: 118,
    ...deckTheHallsGrooveArr
  },
  {
    id: 'we-wish-you-jazz',
    title: 'We Wish You a Merry Christmas',
    vietnameseSubtitle: 'Upbeat Jazz Waltz · Rộn rã đón lễ hội',
    origin: 'Truyền thống Anh quốc',
    bpm: 126,
    ...weWishYouUpbeatArr
  },
  {
    id: 'joy-to-the-world-groove',
    title: 'Joy to the World (Acoustic Groove)',
    vietnameseSubtitle: 'Bright Holiday Pop · Sáng bừng không khí Giáng sinh',
    origin: 'Lowell Mason / G. F. Handel',
    bpm: 112,
    ...joyToTheWorldGrooveArr
  },
  {
    id: 'winter-cafe-swing',
    title: 'Winter Café Swing (Stuttgart Vibes)',
    vietnameseSubtitle: 'Festive Coffeehouse Jazz · Nhịp đi bộ vui tươi',
    origin: 'Hòa âm Jazz Giáng sinh',
    bpm: 116,
    ...winterCafeSwingArr
  },
  {
    id: 'up-on-the-housetop',
    title: 'Up on the Housetop (Express Groove)',
    vietnameseSubtitle: 'Bouncy Sleigh-Bell Pop · Vui nhộn & bắt tai',
    origin: 'Benjamin Hanby',
    bpm: 120,
    ...upOnTheHousetopArr
  }
];

/**
 * Self-contained Upbeat Studio Holiday Groove Web Audio API Engine:
 * - Bright Rhodes / Acoustic Piano lead with crisp hammer tine
 * - Sparkling Celesta / Glockenspiel holiday lift
 * - Bouncy Upright / Pluck Walking Bassline
 * - Soft Groove Kick + Crisp Brushed Shaker & Festive Sleigh-Bell Pulse
 * - Studio Stereo Delay/Reverb Send + Gentle Compressor
 * Zero external audio URLs -> 100% reliable, lively, instant playback.
 */
export class ChristmasMusicBoxEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private dryBus: GainNode | null = null;
  private reverbSend: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private timerId: number | null = null;
  private trackIndex = 0;
  private playing = false;
  private volume = 0.5;
  private muted = false;
  private trackStartedAtCtxTime = 0;
  private pausedOffsetSec = 0;
  private scheduledMelodyIdx = 0;
  private scheduledChordIdx = 0;
  private scheduledPercIdx = 0;
  private onTrackEndCallback: (() => void) | null = null;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      const ctx = new AudioCtx();
      this.ctx = ctx;

      // Pre-build short crisp white-noise buffer for brushed shaker & sleigh-bell shimmer
      const bufferLen = Math.floor(ctx.sampleRate * 0.25);
      const buffer = ctx.createBuffer(1, bufferLen, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferLen; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -14;
      compressor.knee.value = 16;
      compressor.ratio.value = 3.2;
      compressor.attack.value = 0.01;
      compressor.release.value = 0.18;

      const toneFilter = ctx.createBiquadFilter();
      toneFilter.type = 'lowpass';
      toneFilter.frequency.value = 6800;

      const masterGain = ctx.createGain();
      masterGain.gain.value = this.muted ? 0 : this.volume;

      const dryBus = ctx.createGain();
      dryBus.gain.value = 0.94;

      // Crisp studio room shimmer reverb (short, tight so fast upbeat grooves stay punchy!)
      const reverbSend = ctx.createGain();
      reverbSend.gain.value = 0.24;

      const delay1 = ctx.createDelay(1.0);
      delay1.delayTime.value = 0.22;
      const delay2 = ctx.createDelay(1.0);
      delay2.delayTime.value = 0.34;

      const dampFilter = ctx.createBiquadFilter();
      dampFilter.type = 'lowpass';
      dampFilter.frequency.value = 2400;

      const feedback = ctx.createGain();
      feedback.gain.value = 0.22;

      reverbSend.connect(delay1);
      delay1.connect(dampFilter);
      dampFilter.connect(delay2);
      delay2.connect(feedback);
      feedback.connect(delay1);

      const wetReturn = ctx.createGain();
      wetReturn.gain.value = 0.34;
      dampFilter.connect(wetReturn);
      delay2.connect(wetReturn);

      dryBus.connect(compressor);
      wetReturn.connect(compressor);
      compressor.connect(toneFilter);
      toneFilter.connect(masterGain);
      masterGain.connect(ctx.destination);

      this.dryBus = dryBus;
      this.reverbSend = reverbSend;
      this.masterGain = masterGain;
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {
        // Ignore resume rejection if triggered outside user gesture
      });
    }
    return this.ctx;
  }

  public setOnTrackEnd(cb: (() => void) | null): void {
    this.onTrackEndCallback = cb;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.muted ? 0 : this.volume,
        this.ctx.currentTime,
        0.04
      );
    }
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.muted ? 0 : this.volume,
        this.ctx.currentTime,
        0.04
      );
    }
  }

  public getCurrentElapsedSeconds(): number {
    const track = CHRISTMAS_INSTRUMENTAL_PLAYLIST[this.trackIndex];
    const maxSec = getTrackDurationSeconds(track);
    if (!this.playing || !this.ctx) {
      return Math.max(0, Math.min(maxSec, this.pausedOffsetSec));
    }
    return Math.max(0, Math.min(maxSec, this.ctx.currentTime - this.trackStartedAtCtxTime));
  }

  public playTrack(index: number, startOffsetSec = 0): boolean {
    const ctx = this.ensureContext();
    if (!ctx) return false;

    this.stopSchedulerOnly();
    this.trackIndex =
      ((index % CHRISTMAS_INSTRUMENTAL_PLAYLIST.length) +
        CHRISTMAS_INSTRUMENTAL_PLAYLIST.length) %
      CHRISTMAS_INSTRUMENTAL_PLAYLIST.length;

    const track = CHRISTMAS_INSTRUMENTAL_PLAYLIST[this.trackIndex];
    const totalSec = getTrackDurationSeconds(track);
    const safeOffset = Math.max(0, Math.min(totalSec - 0.5, startOffsetSec));
    const secPerBeat = 60 / track.bpm;
    const startBeat = safeOffset / secPerBeat;

    this.playing = true;
    this.pausedOffsetSec = safeOffset;
    this.trackStartedAtCtxTime = ctx.currentTime - safeOffset + 0.05;

    this.scheduledMelodyIdx = track.melody.findIndex((n) => n.beat >= startBeat - 0.01);
    if (this.scheduledMelodyIdx === -1) this.scheduledMelodyIdx = track.melody.length;

    this.scheduledChordIdx = track.chords.findIndex((c) => c.beat >= startBeat - 0.01);
    if (this.scheduledChordIdx === -1) this.scheduledChordIdx = track.chords.length;

    this.scheduledPercIdx = track.percussion.findIndex((p) => p.beat >= startBeat - 0.01);
    if (this.scheduledPercIdx === -1) this.scheduledPercIdx = track.percussion.length;

    this.scheduleAhead();
    this.timerId = window.setInterval(() => this.scheduleAhead(), 85);
    return true;
  }

  public seekTo(seconds: number): boolean {
    const track = CHRISTMAS_INSTRUMENTAL_PLAYLIST[this.trackIndex];
    const safeSec = Math.max(0, Math.min(getTrackDurationSeconds(track), seconds));
    this.pausedOffsetSec = safeSec;
    if (this.playing) {
      return this.playTrack(this.trackIndex, safeSec);
    }
    return true;
  }

  public resumeCurrent(): boolean {
    return this.playTrack(this.trackIndex, this.pausedOffsetSec);
  }

  public pause(): void {
    if (this.playing && this.ctx) {
      this.pausedOffsetSec = this.getCurrentElapsedSeconds();
    }
    this.playing = false;
    this.stopSchedulerOnly();
  }

  public dispose(): void {
    this.pause();
    if (this.ctx) {
      this.ctx.close().catch(() => {
        // Ignore close errors
      });
      this.ctx = null;
      this.masterGain = null;
      this.dryBus = null;
      this.reverbSend = null;
      this.noiseBuffer = null;
    }
  }

  private stopSchedulerOnly(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private scheduleAhead(): void {
    if (!this.playing || !this.ctx || !this.dryBus) return;
    const track = CHRISTMAS_INSTRUMENTAL_PLAYLIST[this.trackIndex];
    const secPerBeat = 60 / track.bpm;
    const lookAheadSec = 0.28;
    const horizon = this.ctx.currentTime + lookAheadSec;

    // 1. Melody, bright celesta sparkle & bouncy walking bass
    while (this.scheduledMelodyIdx < track.melody.length) {
      const note = track.melody[this.scheduledMelodyIdx];
      const noteTime = this.trackStartedAtCtxTime + note.beat * secPerBeat;
      if (noteTime > horizon) break;
      if (noteTime >= this.ctx.currentTime - 0.04) {
        const freq = midiToFrequency(note.midi);
        const start = Math.max(this.ctx.currentTime, noteTime);
        const dur = note.duration * secPerBeat;
        const vel = note.velocity ?? 0.84;

        if (note.voice === 'bass') {
          this.playBouncyBassNote(freq, start, dur, vel);
        } else if (note.voice === 'celesta') {
          this.playBrightBellNote(freq, start, dur, vel);
        } else {
          this.playBrightPianoNote(freq, start, dur, vel);
        }
      }
      this.scheduledMelodyIdx++;
    }

    // 2. Rhythmic upbeat piano chord comping
    while (this.scheduledChordIdx < track.chords.length) {
      const chord = track.chords[this.scheduledChordIdx];
      const chordTime = this.trackStartedAtCtxTime + chord.beat * secPerBeat;
      if (chordTime > horizon) break;
      if (chordTime >= this.ctx.currentTime - 0.04) {
        const start = Math.max(this.ctx.currentTime, chordTime);
        const dur = chord.duration * secPerBeat;
        const vel = chord.velocity ?? 0.78;
        chord.midis.forEach((midi, idx) => {
          this.playRhythmicCompNote(midiToFrequency(midi), start + idx * 0.008, dur, vel);
        });
      }
      this.scheduledChordIdx++;
    }

    // 3. Soft groove kick, brushed shaker & festive sleigh-bell shimmer
    while (this.scheduledPercIdx < track.percussion.length) {
      const hit = track.percussion[this.scheduledPercIdx];
      const hitTime = this.trackStartedAtCtxTime + hit.beat * secPerBeat;
      if (hitTime > horizon) break;
      if (hitTime >= this.ctx.currentTime - 0.04) {
        const start = Math.max(this.ctx.currentTime, hitTime);
        const vel = hit.velocity ?? 0.45;
        if (hit.kind === 'kick') {
          this.playSoftGrooveKick(start, vel);
        } else if (hit.kind === 'sleigh') {
          this.playSleighBellPulse(start, vel);
        } else {
          this.playBrushedShaker(start, vel);
        }
      }
      this.scheduledPercIdx++;
    }

    // Smooth auto-advance to next upbeat track
    const trackEndTime = this.trackStartedAtCtxTime + track.totalBeats * secPerBeat + 0.35;
    if (this.ctx.currentTime >= trackEndTime) {
      this.pausedOffsetSec = 0;
      if (this.onTrackEndCallback) {
        this.onTrackEndCallback();
      } else {
        this.playTrack(this.trackIndex + 1, 0);
      }
    }
  }

  /**
   * Bright, crisp Holiday Electric/Acoustic Piano lead (snappy attack for lively articulation).
   */
  private playBrightPianoNote(
    freq: number,
    startTime: number,
    durationSec: number,
    velocity: number
  ): void {
    if (!this.ctx || !this.dryBus || !this.reverbSend) return;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3400 + velocity * 1100, startTime);
    filter.frequency.exponentialRampToValueAtTime(1150, startTime + Math.min(0.95, durationSec + 0.25));

    const env = this.ctx.createGain();
    const peak = 0.22 * velocity;
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(peak, startTime + 0.01);
    env.gain.exponentialRampToValueAtTime(
      Math.max(0.001, peak * 0.44),
      startTime + Math.max(0.1, durationSec * 0.6)
    );
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec + 0.32);

    const oscA = this.ctx.createOscillator();
    oscA.type = 'triangle';
    oscA.frequency.setValueAtTime(freq, startTime);
    oscA.detune.setValueAtTime(-2.0, startTime);

    const oscB = this.ctx.createOscillator();
    oscB.type = 'sine';
    oscB.frequency.setValueAtTime(freq, startTime);
    oscB.detune.setValueAtTime(2.0, startTime);

    const tine = this.ctx.createOscillator();
    tine.type = 'sine';
    tine.frequency.setValueAtTime(freq * 2, startTime);
    const tineGain = this.ctx.createGain();
    tineGain.gain.setValueAtTime(0.22 * velocity, startTime);
    tineGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.18);

    oscA.connect(filter);
    oscB.connect(filter);
    tine.connect(tineGain);
    tineGain.connect(filter);

    filter.connect(env);
    env.connect(this.dryBus);
    env.connect(this.reverbSend);

    const stopAt = startTime + durationSec + 0.38;
    oscA.start(startTime);
    oscB.start(startTime);
    tine.start(startTime);
    oscA.stop(stopAt);
    oscB.stop(stopAt);
    tine.stop(stopAt);
  }

  /**
   * Sparkling Holiday Celesta / Glockenspiel shimmer voice.
   */
  private playBrightBellNote(
    freq: number,
    startTime: number,
    durationSec: number,
    velocity: number
  ): void {
    if (!this.ctx || !this.dryBus || !this.reverbSend) return;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(4200, startTime);

    const env = this.ctx.createGain();
    const peak = 0.14 * velocity;
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(peak, startTime + 0.008);
    env.gain.exponentialRampToValueAtTime(
      Math.max(0.0008, peak * 0.24),
      startTime + Math.max(0.09, durationSec * 0.55)
    );
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec + 0.38);

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, startTime);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, startTime);
    const overtoneGain = this.ctx.createGain();
    overtoneGain.gain.setValueAtTime(0.26, startTime);
    overtoneGain.gain.exponentialRampToValueAtTime(0.012, startTime + 0.2);

    osc1.connect(filter);
    osc2.connect(overtoneGain);
    overtoneGain.connect(filter);
    filter.connect(env);
    env.connect(this.dryBus);
    env.connect(this.reverbSend);

    const stopAt = startTime + durationSec + 0.44;
    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(stopAt);
    osc2.stop(stopAt);
  }

  /**
   * Bouncy plucked upright / jazz walking bass.
   */
  private playBouncyBassNote(
    freq: number,
    startTime: number,
    durationSec: number,
    velocity: number
  ): void {
    if (!this.ctx || !this.dryBus) return;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(520, startTime);
    filter.frequency.exponentialRampToValueAtTime(220, startTime + Math.min(0.4, durationSec));

    const env = this.ctx.createGain();
    const peak = 0.21 * velocity;
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(peak, startTime + 0.016);
    env.gain.exponentialRampToValueAtTime(
      Math.max(0.001, peak * 0.42),
      startTime + Math.max(0.12, durationSec * 0.7)
    );
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec + 0.14);

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    osc.connect(filter);
    filter.connect(env);
    env.connect(this.dryBus);

    osc.start(startTime);
    osc.stop(startTime + durationSec + 0.18);
  }

  /**
   * Snappy rhythmic Rhodes chord comping (keeps harmony buoyant instead of muddy/slow).
   */
  private playRhythmicCompNote(
    freq: number,
    startTime: number,
    durationSec: number,
    velocity: number
  ): void {
    if (!this.ctx || !this.dryBus || !this.reverbSend) return;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1450, startTime);
    filter.frequency.exponentialRampToValueAtTime(620, startTime + Math.min(0.6, durationSec));

    const env = this.ctx.createGain();
    const peak = 0.056 * velocity;
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(peak, startTime + 0.025);
    env.gain.exponentialRampToValueAtTime(
      Math.max(0.0008, peak * 0.35),
      startTime + Math.max(0.14, durationSec * 0.72)
    );
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec + 0.22);

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    osc.connect(filter);
    filter.connect(env);
    env.connect(this.dryBus);
    env.connect(this.reverbSend);

    osc.start(startTime);
    osc.stop(startTime + durationSec + 0.26);
  }

  /**
   * Soft warm acoustic jazz kick pulse (subtle bounce, never booming).
   */
  private playSoftGrooveKick(startTime: number, velocity: number): void {
    if (!this.ctx || !this.dryBus) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(118, startTime);
    osc.frequency.exponentialRampToValueAtTime(48, startTime + 0.095);

    const env = this.ctx.createGain();
    const peak = 0.16 * velocity;
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(peak, startTime + 0.006);
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.14);

    osc.connect(env);
    env.connect(this.dryBus);
    osc.start(startTime);
    osc.stop(startTime + 0.16);
  }

  /**
   * Delicate festive sleigh-bell pulse (bandpass shimmer + metallic bell overtone).
   */
  private playSleighBellPulse(startTime: number, velocity: number): void {
    if (!this.ctx || !this.dryBus || !this.noiseBuffer) return;

    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const hp = this.ctx.createBiquadFilter();
    hp.type = 'bandpass';
    hp.frequency.setValueAtTime(6200, startTime);
    hp.Q.value = 3.2;

    const env = this.ctx.createGain();
    const peak = 0.075 * velocity;
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(peak, startTime + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.11);

    src.connect(hp);
    hp.connect(env);
    env.connect(this.dryBus);

    src.start(startTime);
    src.stop(startTime + 0.12);
  }

  /**
   * Light brushed jazz shaker for crisp offbeat swing feel.
   */
  private playBrushedShaker(startTime: number, velocity: number): void {
    if (!this.ctx || !this.dryBus || !this.noiseBuffer) return;

    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'highpass';
    bp.frequency.setValueAtTime(4800, startTime);

    const env = this.ctx.createGain();
    const peak = 0.042 * velocity;
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(peak, startTime + 0.006);
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.055);

    src.connect(bp);
    bp.connect(env);
    env.connect(this.dryBus);

    src.start(startTime);
    src.stop(startTime + 0.065);
  }
}
