/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkshopRound } from '../types/logistics';

export type SnowIntensityMode = 'OFF' | 'BURST' | 'GENTLE';
export type SnowDepthLayer = 'far' | 'mid' | 'near';

export interface SnowStateInput {
  isFestiveEnabled: boolean;
  viewingRound: WorkshopRound;
  isBurstActive: boolean;
  prefersReducedMotion: boolean;
}

export interface SnowModeConfig {
  mode: SnowIntensityMode;
  targetCount: number;
  speedMultiplier: number;
  opacityScale: number;
  accumulationRate: number;
}

export interface SnowflakeParticle {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  driftAmplitude: number;
  driftFrequency: number;
  secondaryDriftAmp: number;
  phase: number;
  shimmerPhase: number;
  baseOpacity: number;
  kind: 'dot' | 'crystal' | 'bokeh';
  depthLayer: SnowDepthLayer;
  rotation: number;
  rotationSpeed: number;
  windVx: number;
}

/**
 * Pure state machine deciding snowfall density & velocity based on workshop round,
 * festive toggle, Round 1 -> Round 2 burst transition, and accessibility preferences.
 * Multi-layered depth counts are calibrated for lush, silky-smooth 60fps snowfall
 * without ever degrading readability.
 */
export function resolveSnowMode(input: SnowStateInput): SnowModeConfig {
  if (!input.isFestiveEnabled || input.prefersReducedMotion) {
    return {
      mode: 'OFF',
      targetCount: 0,
      speedMultiplier: 0,
      opacityScale: 0,
      accumulationRate: 0
    };
  }

  if (input.isBurstActive) {
    return {
      mode: 'BURST',
      targetCount: 160,
      speedMultiplier: 1.28,
      opacityScale: 1.0,
      accumulationRate: 0.14
    };
  }

  if (input.viewingRound === 2) {
    return {
      mode: 'GENTLE',
      targetCount: 105,
      speedMultiplier: 0.88,
      opacityScale: 0.82,
      accumulationRate: 0.065
    };
  }

  return {
    mode: 'OFF',
    targetCount: 0,
    speedMultiplier: 0,
    opacityScale: 0,
    accumulationRate: 0
  };
}

/**
 * Content-safe corridor attenuation:
 * Keeps the central dashboard/text column crisp and completely unobstructed
 * while allowing rich, multi-layered depth snowfall along left & right edges.
 */
export function computeContentSafeOpacity(
  xNormalized: number,
  baseOpacity: number,
  mode: SnowIntensityMode,
  depthLayer: SnowDepthLayer = 'mid'
): number {
  if (mode === 'OFF') return 0;

  const clampedX = Math.max(0, Math.min(1, xNormalized));
  const distFromEdge = Math.min(clampedX, 1 - clampedX);

  // Near foreground flakes attenuate more gracefully in center so they never block numbers
  const centerFloor =
    depthLayer === 'near'
      ? mode === 'BURST'
        ? 0.34
        : 0.24
      : depthLayer === 'mid'
      ? mode === 'BURST'
        ? 0.52
        : 0.38
      : mode === 'BURST'
      ? 0.62
      : 0.46;

  let corridorFactor: number;
  if (distFromEdge <= 0.13) {
    corridorFactor = 1.0;
  } else if (distFromEdge >= 0.26) {
    corridorFactor = centerFloor;
  } else {
    const t = (distFromEdge - 0.13) / (0.26 - 0.13);
    // Smoothstep easing across corridor boundary
    const smoothT = t * t * (3 - 2 * t);
    corridorFactor = 1.0 - smoothT * (1.0 - centerFloor);
  }

  const maxCap = mode === 'BURST' ? 0.92 : 0.78;
  return Math.max(0, Math.min(maxCap, baseOpacity * corridorFactor));
}

/**
 * Smoothly advances snow accumulation progress (0..1) along the bottom edges
 * of important content cards. Builds gently when snowing and melts gracefully when OFF.
 */
export function stepSnowAccumulation(
  currentLevel: number,
  dtSec: number,
  mode: SnowIntensityMode,
  accumulationRate: number
): number {
  const safeDt = Math.max(0, Math.min(dtSec, 0.1));
  if (mode === 'OFF') {
    return Math.max(0, currentLevel - safeDt * 0.55);
  }
  return Math.min(1, currentLevel + safeDt * accumulationRate);
}

/**
 * Deterministic-friendly 3-layer depth parallax particle factory.
 * - far  (44%): delicate distant winter snow mist
 * - mid  (38%): crisp snow orbs and medium 6-point ice crystals
 * - near (18%): luminous foreground crystals and subtle edge bokeh flakes
 */
export function createSnowflakeParticle(
  width: number,
  height: number,
  spawnAtTop: boolean,
  rng: () => number = Math.random
): SnowflakeParticle {
  const layerRoll = rng();
  const depthLayer: SnowDepthLayer =
    layerRoll < 0.44 ? 'far' : layerRoll < 0.82 ? 'mid' : 'near';

  let kind: SnowflakeParticle['kind'];
  let radius: number;
  let speedY: number;
  let driftAmplitude: number;
  let baseOpacity: number;

  if (depthLayer === 'far') {
    kind = 'dot';
    radius = 1.05 + rng() * 1.15;
    speedY = 16 + rng() * 14;
    driftAmplitude = 7 + rng() * 10;
    baseOpacity = 0.36 + rng() * 0.24;
  } else if (depthLayer === 'mid') {
    kind = rng() < 0.34 ? 'crystal' : 'dot';
    radius = kind === 'crystal' ? 3.2 + rng() * 2.1 : 1.9 + rng() * 1.5;
    speedY = 28 + rng() * 20;
    driftAmplitude = 14 + rng() * 16;
    baseOpacity = kind === 'crystal' ? 0.62 + rng() * 0.25 : 0.52 + rng() * 0.28;
  } else {
    kind = rng() < 0.58 ? 'crystal' : 'bokeh';
    radius = kind === 'crystal' ? 4.8 + rng() * 2.6 : 3.6 + rng() * 2.4;
    speedY = 44 + rng() * 26;
    driftAmplitude = 20 + rng() * 22;
    baseOpacity = kind === 'crystal' ? 0.68 + rng() * 0.24 : 0.38 + rng() * 0.24;
  }

  return {
    x: rng() * Math.max(1, width),
    y: spawnAtTop ? -radius - rng() * 110 : rng() * Math.max(1, height),
    radius,
    speedY,
    driftAmplitude,
    driftFrequency: 0.35 + rng() * 0.55,
    secondaryDriftAmp: 4 + rng() * 8,
    phase: rng() * Math.PI * 2,
    shimmerPhase: rng() * Math.PI * 2,
    baseOpacity,
    kind,
    depthLayer,
    rotation: rng() * Math.PI * 2,
    rotationSpeed: (rng() - 0.5) * (depthLayer === 'near' ? 0.85 : 0.55),
    windVx: 0
  };
}

/**
 * Advances a snowflake particle by dtSec with layered dual-harmonic breeze,
 * optional gentle cursor wind push, and clean boundary wrap-around.
 */
export function stepSnowflakeParticle(
  flake: SnowflakeParticle,
  dtSec: number,
  width: number,
  height: number,
  elapsedSec: number,
  speedMultiplier: number,
  globalWindBias = 0
): SnowflakeParticle {
  const safeDt = Math.max(0, Math.min(dtSec, 0.08));
  const safeW = Math.max(1, width);
  const safeH = Math.max(1, height);

  const depthFactor =
    flake.depthLayer === 'near' ? 1.15 : flake.depthLayer === 'mid' ? 0.9 : 0.55;

  // Dual-harmonic breeze feels organic and silky rather than robotic
  const primarySway =
    Math.sin(elapsedSec * flake.driftFrequency + flake.phase) * flake.driftAmplitude;
  const gustSway =
    Math.cos(elapsedSec * 0.27 + flake.phase * 1.7) * flake.secondaryDriftAmp;

  const targetWind = globalWindBias * depthFactor;
  const nextWindVx = flake.windVx + (targetWind - flake.windVx) * Math.min(1, safeDt * 3.5);

  let nextX = flake.x + (primarySway + gustSway + nextWindVx) * safeDt;
  let nextY = flake.y + flake.speedY * speedMultiplier * safeDt;
  const nextRotation = flake.rotation + flake.rotationSpeed * safeDt;

  if (nextX < -22) {
    nextX = safeW + 18;
  } else if (nextX > safeW + 22) {
    nextX = -18;
  }

  if (nextY > safeH + 22) {
    nextY = -flake.radius - 12;
  }

  return {
    ...flake,
    x: nextX,
    y: nextY,
    rotation: nextRotation,
    windVx: nextWindVx
  };
}
