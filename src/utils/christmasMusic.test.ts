/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHRISTMAS_INSTRUMENTAL_PLAYLIST,
  formatTrackTime,
  getNextTrackIndex,
  getPrevTrackIndex,
  getTrackDurationSeconds,
  midiToFrequency
} from './christmasMusic';

test('1. Christmas instrumental playlist contains 6 upbeat (>2 min, >=110 BPM) holiday groove tracks', () => {
  assert.equal(CHRISTMAS_INSTRUMENTAL_PLAYLIST.length, 6);
  const titles = CHRISTMAS_INSTRUMENTAL_PLAYLIST.map((t) => t.title);
  assert.ok(titles.some((t) => t.includes('Jingle Bells')));
  assert.ok(titles.some((t) => t.includes('Deck the Halls')));
  assert.ok(titles.some((t) => t.includes('We Wish You')));
  assert.ok(titles.some((t) => t.includes('Joy to the World')));

  for (const track of CHRISTMAS_INSTRUMENTAL_PLAYLIST) {
    assert.ok(
      track.bpm >= 110 && track.bpm <= 135,
      `${track.title} should have lively upbeat BPM (got ${track.bpm})`
    );
    assert.ok(track.melody.length >= 120, `${track.title} should have full multi-section melody`);
    assert.ok(track.chords.length >= 30, `${track.title} should have rhythmic chord comping`);
    assert.ok(track.percussion.length >= 60, `${track.title} should have upbeat groove percussion`);
    const dur = getTrackDurationSeconds(track);
    assert.ok(
      dur >= 125 && dur <= 165,
      `${track.title} duration should be > 2 minutes (got ${dur.toFixed(1)}s)`
    );
  }
});

test('2. midiToFrequency matches A4=440Hz and middle C4≈261.63Hz accurately', () => {
  assert.equal(Math.round(midiToFrequency(69) * 100) / 100, 440);
  assert.equal(Math.round(midiToFrequency(60) * 100) / 100, 261.63);
});

test('3. Playlist navigation and time formatting wrap and pad cleanly', () => {
  assert.equal(getNextTrackIndex(5, 6), 0);
  assert.equal(getNextTrackIndex(0, 6), 1);
  assert.equal(getPrevTrackIndex(0, 6), 5);
  assert.equal(getPrevTrackIndex(3, 6), 2);
  assert.equal(formatTrackTime(0), '0:00');
  assert.equal(formatTrackTime(9), '0:09');
  assert.equal(formatTrackTime(134), '2:14');
});
