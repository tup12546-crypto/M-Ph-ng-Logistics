/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeContentSafeOpacity,
  createSnowflakeParticle,
  resolveSnowMode,
  stepSnowflakeParticle
} from './festiveSnow';

test('1. resolveSnowMode stays OFF in Round 1 and switches to rich multi-layer BURST/GENTLE in Round 2', () => {
  const r1Idle = resolveSnowMode({
    isFestiveEnabled: true,
    viewingRound: 1,
    isBurstActive: false,
    prefersReducedMotion: false
  });
  assert.equal(r1Idle.mode, 'OFF');
  assert.equal(r1Idle.targetCount, 0);

  const r1ToR2Burst = resolveSnowMode({
    isFestiveEnabled: true,
    viewingRound: 2,
    isBurstActive: true,
    prefersReducedMotion: false
  });
  assert.equal(r1ToR2Burst.mode, 'BURST');
  assert.ok(r1ToR2Burst.targetCount >= 140);

  const r2Gentle = resolveSnowMode({
    isFestiveEnabled: true,
    viewingRound: 2,
    isBurstActive: false,
    prefersReducedMotion: false
  });
  assert.equal(r2Gentle.mode, 'GENTLE');
  assert.ok(r2Gentle.targetCount >= 90 && r2Gentle.targetCount < r1ToR2Burst.targetCount);
});

test('2. resolveSnowMode respects festive toggle OFF and prefers-reduced-motion', () => {
  const disabled = resolveSnowMode({
    isFestiveEnabled: false,
    viewingRound: 2,
    isBurstActive: true,
    prefersReducedMotion: false
  });
  assert.equal(disabled.mode, 'OFF');
  assert.equal(disabled.targetCount, 0);

  const reduced = resolveSnowMode({
    isFestiveEnabled: true,
    viewingRound: 2,
    isBurstActive: true,
    prefersReducedMotion: true
  });
  assert.equal(reduced.mode, 'OFF');
  assert.equal(reduced.targetCount, 0);
});

test('3. computeContentSafeOpacity attenuates center reading column more strongly than outer edges', () => {
  const edgeGentle = computeContentSafeOpacity(0.05, 0.7, 'GENTLE', 'mid');
  const centerGentle = computeContentSafeOpacity(0.5, 0.7, 'GENTLE', 'mid');
  assert.ok(edgeGentle > centerGentle, 'Edge opacity should exceed center reading opacity');
  assert.ok(centerGentle <= 0.35, 'Center opacity in gentle mode should stay subtle for legibility');

  const centerNear = computeContentSafeOpacity(0.5, 0.75, 'GENTLE', 'near');
  assert.ok(centerNear <= 0.25, 'Near foreground flakes should attenuate strongly over center text');

  const centerBurst = computeContentSafeOpacity(0.5, 0.8, 'BURST', 'mid');
  assert.ok(centerBurst > centerGentle, 'Burst mode should feel livelier than gentle mode');
  assert.ok(centerBurst <= 0.5, 'Even during burst, center reading opacity must not obscure text');

  assert.equal(computeContentSafeOpacity(0.1, 0.8, 'OFF'), 0);
});

test('4. createSnowflakeParticle generates all 3 depth layers and steps/wraps smoothly', () => {
  let seed = 0.2;
  const deterministicRng = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const layers = new Set<string>();
  for (let i = 0; i < 40; i++) {
    layers.add(createSnowflakeParticle(1440, 900, false, deterministicRng).depthLayer);
  }
  assert.deepEqual(Array.from(layers).sort(), ['far', 'mid', 'near']);

  const flake = createSnowflakeParticle(1440, 900, false, deterministicRng);
  const moved = stepSnowflakeParticle(flake, 0.05, 1440, 900, 1.0, 1.0, 12);
  assert.ok(moved.y > flake.y);

  // Force near bottom edge -> should wrap cleanly above top edge
  const bottomFlake = { ...flake, y: 925 };
  const wrapped = stepSnowflakeParticle(bottomFlake, 0.05, 1440, 900, 1.0, 1.0);
  assert.ok(wrapped.y < 0);

  // Force past right edge -> should wrap cleanly to left side
  const rightFlake = { ...flake, x: 1470, driftAmplitude: 0, secondaryDriftAmp: 0 };
  const wrappedX = stepSnowflakeParticle(rightFlake, 0.05, 1440, 900, 1.0, 1.0);
  assert.ok(wrappedX.x < 0);
});
