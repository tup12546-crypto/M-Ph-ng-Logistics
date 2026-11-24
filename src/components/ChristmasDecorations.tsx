/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { WorkshopRound } from '../types/logistics';
import {
  SnowflakeParticle,
  computeContentSafeOpacity,
  createSnowflakeParticle,
  resolveSnowMode,
  stepSnowflakeParticle
} from '../utils/festiveSnow';
import { X } from 'lucide-react';

/**
 * 0. Breakthrough Editorial Winter Atmosphere Backdrop (Non-Cheesy, Zero Overlap):
 * - DARK MODE: Ethereal slow-breathing Northern Lights (Aurora Borealis) veil across the top sky
 *   with crisp polar pin-stars along outer margins.
 * - LIGHT MODE: Crisp Nordic glacier-sky frost glow & subtle diagonal winter morning sunbeams.
 * Strictly pointer-events-none and sits behind all content (`z-0`).
 */
export const FestiveAmbientBackdrop: React.FC<{
  enabled: boolean;
  isDark: boolean;
  isRound2: boolean;
}> = ({ enabled, isDark, isRound2 }) => {
  if (!enabled) return null;

  return (
    <div
      aria-hidden="true"
      data-testid="festive-ambient-backdrop"
      className="pointer-events-none select-none fixed inset-x-0 top-0 h-[380px] z-0 overflow-hidden transition-opacity duration-700"
    >
      {/* DARK MODE: Ethereal Nordic Aurora Veil */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          isDark ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div
          className="absolute -top-24 left-[8%] w-[46%] h-[270px] rounded-full blur-[90px] festive-aurora-wave"
          style={{
            background: isRound2
              ? 'radial-gradient(ellipse at center, rgba(56,189,248,0.22) 0%, rgba(16,185,129,0.12) 48%, rgba(15,23,42,0) 76%)'
              : 'radial-gradient(ellipse at center, rgba(16,185,129,0.16) 0%, rgba(56,189,248,0.1) 52%, rgba(15,23,42,0) 76%)'
          }}
        />
        <div
          className="absolute -top-20 right-[6%] w-[44%] h-[260px] rounded-full blur-[95px] festive-aurora-wave"
          style={{
            animationDelay: '3.2s',
            background: isRound2
              ? 'radial-gradient(ellipse at center, rgba(129,140,248,0.2) 0%, rgba(251,191,36,0.1) 46%, rgba(15,23,42,0) 76%)'
              : 'radial-gradient(ellipse at center, rgba(251,191,36,0.13) 0%, rgba(99,102,241,0.11) 50%, rgba(15,23,42,0) 76%)'
          }}
        />
      </div>

      {/* LIGHT MODE: Crisp Nordic Glacier-Sky Morning Glow */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          isDark ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div
          className="absolute -top-28 left-[10%] w-[45%] h-[250px] rounded-full blur-[80px] festive-aurora-wave"
          style={{
            background: isRound2
              ? 'radial-gradient(ellipse at center, rgba(56,189,248,0.16) 0%, rgba(186,230,253,0.1) 52%, rgba(248,250,252,0) 78%)'
              : 'radial-gradient(ellipse at center, rgba(14,165,233,0.11) 0%, rgba(224,242,254,0.12) 55%, rgba(248,250,252,0) 78%)'
          }}
        />
        <div
          className="absolute -top-24 right-[8%] w-[42%] h-[240px] rounded-full blur-[85px] festive-aurora-wave"
          style={{
            animationDelay: '3.6s',
            background:
              'radial-gradient(ellipse at center, rgba(244,63,94,0.06) 0%, rgba(251,191,36,0.08) 48%, rgba(248,250,252,0) 78%)'
          }}
        />
      </div>
    </div>
  );
};

/**
 * 1. Cute miniature Santa hat resting jauntily on the brand Compass icon.
 * Adapts subtly to Light (bright crimson & crisp snow) vs Dark (warm golden rim glow).
 */
export const SantaHatBrandBadge: React.FC<{ enabled: boolean; isDark?: boolean }> = ({
  enabled,
  isDark = false
}) => {
  if (!enabled) return null;

  return (
    <svg
      viewBox="0 0 38 30"
      width="26"
      height="20"
      aria-hidden="true"
      data-testid="christmas-santa-hat"
      className="pointer-events-none select-none absolute -top-2.5 -left-2 z-10 origin-bottom-right festive-hat-sway transition-all duration-500"
      style={{
        filter: isDark
          ? 'drop-shadow(0 0 6px rgba(251, 191, 36, 0.48))'
          : 'drop-shadow(0 1px 2px rgba(15, 23, 42, 0.16))'
      }}
    >
      <path
        d="M5 21 C7 8, 18 3, 29 7.5 C24 11.5, 22 15.5, 23 21 Z"
        fill={isDark ? '#f43f5e' : '#e11d48'}
        stroke={isDark ? '#fb7185' : '#be123c'}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M11.5 16.5 C13 11, 18.5 8, 25 9"
        fill="none"
        stroke={isDark ? '#fde68a' : '#fda4af'}
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity={isDark ? '0.68' : '0.78'}
      />
      <rect
        x="3.2"
        y="18.6"
        width="21.5"
        height="5.6"
        rx="2.8"
        fill="#ffffff"
        stroke={isDark ? '#bae6fd' : '#cbd5e1'}
        strokeWidth="0.9"
      />
      <circle
        cx="31"
        cy="9"
        r="3.6"
        fill="#ffffff"
        stroke={isDark ? '#fde68a' : '#cbd5e1'}
        strokeWidth="0.9"
      />
    </svg>
  );
};

/**
 * 2. Dual-Theme Nordic Header Garland (smooth 500ms Day <-> Night transformation):
 * - LIGHT MODE (Crisp Winter Day): Fresh evergreen pine sprigs, holly berry clusters,
 *   and frosted glass baubles gently swinging along the scalloped garland.
 * - DARK MODE (Cozy Christmas Eve): Warm glowing Edison & fairy lights with soft radial
 *   amber/ruby/emerald/cyan halos and sparkling golden stars.
 */
export const HeaderFairyLights: React.FC<{
  enabled: boolean;
  isDark: boolean;
  isRound2: boolean;
}> = ({ enabled, isDark, isRound2 }) => {
  const ornaments = [
    { x: 40, y: 7.4, color: '#f59e0b', darkColor: '#fbbf24', delay: '0s', kind: 'bulb' },
    { x: 80, y: 10.2, color: '#e11d48', darkColor: '#fb7185', delay: '0.6s', kind: 'bauble' },
    { x: 120, y: 7.4, color: '#15803d', darkColor: '#34d399', delay: '1.2s', kind: 'star' },
    { x: 200, y: 7.4, color: '#0284c7', darkColor: '#38bdf8', delay: '0.3s', kind: 'bulb' },
    { x: 240, y: 10.2, color: '#d97706', darkColor: '#fde68a', delay: '1.7s', kind: 'bauble' },
    { x: 280, y: 7.4, color: '#e11d48', darkColor: '#fb7185', delay: '0.9s', kind: 'bulb' },
    { x: 360, y: 7.4, color: '#15803d', darkColor: '#34d399', delay: '0.2s', kind: 'bulb' },
    { x: 400, y: 10.2, color: '#0284c7', darkColor: '#38bdf8', delay: '1.4s', kind: 'star' },
    { x: 440, y: 7.4, color: '#f59e0b', darkColor: '#fbbf24', delay: '0.8s', kind: 'bulb' },
    { x: 520, y: 7.4, color: '#e11d48', darkColor: '#fb7185', delay: '1.9s', kind: 'bulb' },
    { x: 560, y: 10.2, color: '#d97706', darkColor: '#fde68a', delay: '0.4s', kind: 'bauble' },
    { x: 600, y: 7.4, color: '#15803d', darkColor: '#34d399', delay: '1.1s', kind: 'bulb' },
    { x: 680, y: 7.4, color: '#0284c7', darkColor: '#38bdf8', delay: '0.5s', kind: 'star' },
    { x: 720, y: 10.2, color: '#e11d48', darkColor: '#fb7185', delay: '1.5s', kind: 'bauble' },
    { x: 760, y: 7.4, color: '#f59e0b', darkColor: '#fbbf24', delay: '0.1s', kind: 'bulb' },
    { x: 840, y: 7.4, color: '#15803d', darkColor: '#34d399', delay: '1.3s', kind: 'bulb' },
    { x: 880, y: 10.2, color: '#d97706', darkColor: '#fde68a', delay: '0.7s', kind: 'star' },
    { x: 920, y: 7.4, color: '#0284c7', darkColor: '#38bdf8', delay: '1.8s', kind: 'bulb' },
    { x: 1000, y: 7.4, color: '#e11d48', darkColor: '#fb7185', delay: '0.3s', kind: 'bulb' },
    { x: 1040, y: 10.2, color: '#15803d', darkColor: '#34d399', delay: '1.6s', kind: 'bauble' },
    { x: 1080, y: 7.4, color: '#f59e0b', darkColor: '#fbbf24', delay: '1.0s', kind: 'bulb' },
    { x: 1160, y: 7.4, color: '#0284c7', darkColor: '#38bdf8', delay: '0.4s', kind: 'star' },
    { x: 1200, y: 10.2, color: '#e11d48', darkColor: '#fb7185', delay: '1.2s', kind: 'bauble' },
    { x: 1240, y: 7.4, color: '#d97706', darkColor: '#fde68a', delay: '0.8s', kind: 'bulb' },
    { x: 1320, y: 7.4, color: '#15803d', darkColor: '#34d399', delay: '1.5s', kind: 'bulb' },
    { x: 1360, y: 10.2, color: '#e11d48', darkColor: '#fb7185', delay: '0.2s', kind: 'bauble' },
    { x: 1400, y: 7.4, color: '#0284c7', darkColor: '#38bdf8', delay: '1.1s', kind: 'star' }
  ];

  const hollyPeaks = [160, 320, 480, 640, 800, 960, 1120, 1280];

  const wireStroke = isDark
    ? isRound2
      ? 'rgba(251, 191, 36, 0.42)'
      : 'rgba(148, 163, 184, 0.42)'
    : isRound2
    ? 'rgba(21, 128, 61, 0.44)'
    : 'rgba(100, 116, 139, 0.42)';

  return (
    <div
      aria-hidden="true"
      data-testid="christmas-header-garland"
      data-festive-theme={isDark ? 'night' : 'day'}
      className={`pointer-events-none select-none absolute left-0 right-0 top-full h-[26px] overflow-hidden transition-all duration-500 ${
        enabled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      {enabled && (
        <svg
          viewBox="0 0 1440 26"
          preserveAspectRatio="xMidYMin slice"
          className="w-full h-full"
        >
          <defs>
            <radialGradient id="festiveGlowWarm" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fde68a" stopOpacity="0.92" />
              <stop offset="45%" stopColor="#f59e0b" stopOpacity="0.36" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="festiveGlowCool" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.92" />
              <stop offset="45%" stopColor="#38bdf8" stopOpacity="0.36" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="festiveGlowRuby" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fecdd3" stopOpacity="0.92" />
              <stop offset="45%" stopColor="#f43f5e" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
            </radialGradient>
          </defs>

          <path
            d="M0 1 Q80 18 160 1 Q240 18 320 1 Q400 18 480 1 Q560 18 640 1 Q720 18 800 1 Q880 18 960 1 Q1040 18 1120 1 Q1200 18 1280 1 Q1360 18 1440 1"
            fill="none"
            stroke={wireStroke}
            strokeWidth={isDark ? '1.3' : '1.45'}
            strokeLinecap="round"
            className="transition-all duration-500"
          />

          <path
            d="M0 1.5 Q80 18.5 160 1.5 Q240 18.5 320 1.5 Q400 18.5 480 1.5 Q560 18.5 640 1.5 Q720 18.5 800 1.5 Q880 18.5 960 1.5 Q1040 18.5 1120 1.5 Q1200 18.5 1280 1.5 Q1360 18.5 1440 1.5"
            fill="none"
            stroke="#15803d"
            strokeWidth="2.4"
            strokeDasharray="2 7"
            strokeLinecap="round"
            opacity={isDark ? '0.18' : '0.45'}
            className="transition-opacity duration-500"
          />

          {hollyPeaks.map((px) => (
            <g key={px} transform={`translate(${px}, 2.2)`}>
              <ellipse
                cx="-4.2"
                cy="1.4"
                rx="4.2"
                ry="1.7"
                transform="rotate(-22 -4.2 1.4)"
                fill={isDark ? '#059669' : '#15803d'}
                opacity={isDark ? '0.8' : '0.92'}
              />
              <ellipse
                cx="4.2"
                cy="1.4"
                rx="4.2"
                ry="1.7"
                transform="rotate(22 4.2 1.4)"
                fill={isDark ? '#10b981' : '#16a34a'}
                opacity={isDark ? '0.8' : '0.92'}
              />
              <circle cx="-1.3" cy="2" r="1.45" fill={isDark ? '#fb7185' : '#e11d48'} />
              <circle cx="1.3" cy="2" r="1.45" fill={isDark ? '#fb7185' : '#e11d48'} />
              <circle cx="0" cy="0.7" r="1.35" fill={isDark ? '#fde68a' : '#be123c'} />
            </g>
          ))}

          {ornaments.map((b, idx) => {
            const fill = isDark ? b.darkColor : b.color;
            const glowId =
              b.color === '#0284c7'
                ? 'url(#festiveGlowCool)'
                : b.color === '#e11d48'
                ? 'url(#festiveGlowRuby)'
                : 'url(#festiveGlowWarm)';

            return (
              <g key={idx} transform={`translate(${b.x}, ${b.y})`}>
                <rect
                  x="-1.6"
                  y="-0.9"
                  width="3.2"
                  height="2.3"
                  rx="0.7"
                  fill={isDark ? '#94a3b8' : '#64748b'}
                />
                <g
                  className={
                    b.kind === 'bauble' ? 'festive-ornament-swing' : 'festive-bulb-twinkle'
                  }
                  style={{ animationDelay: b.delay }}
                >
                  <circle
                    cx="0"
                    cy="5.2"
                    r={isDark ? '10.5' : '5.4'}
                    fill={glowId}
                    opacity={isDark ? '0.98' : '0.28'}
                    className="transition-all duration-500"
                  />

                  {b.kind === 'star' ? (
                    <path
                      d="M0 0.7 L1.2 3.4 L4.1 3.7 L1.9 5.5 L2.5 8.3 L0 6.8 L-2.5 8.3 L-1.9 5.5 L-4.1 3.7 L-1.2 3.4 Z"
                      fill={fill}
                    />
                  ) : b.kind === 'bauble' ? (
                    <>
                      <line x1="0" y1="1.2" x2="0" y2="3" stroke={isDark ? '#cbd5e1' : '#64748b'} strokeWidth="0.9" />
                      <circle cx="0" cy="6.2" r="3.4" fill={fill} />
                      <path
                        d="M-3.1 6.2 Q0 7.4 3.1 6.2"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="0.85"
                        opacity="0.78"
                      />
                      <circle cx="-1.1" cy="4.9" r="0.85" fill="#ffffff" opacity="0.92" />
                    </>
                  ) : (
                    <>
                      <ellipse cx="0" cy="5.0" rx="2.5" ry="3.6" fill={fill} />
                      <circle cx="-0.7" cy="3.9" r="0.8" fill="#ffffff" opacity="0.92" />
                    </>
                  )}
                </g>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
};

/**
 * 3. Subtle Festive Corner Accent for the Mission Card.
 * Positioned neatly at top-right outer border corner (`pointer-events-none`, 0px text overlap).
 */
export const MissionCardFestiveAccent: React.FC<{
  enabled: boolean;
  isDark: boolean;
  isRound2: boolean;
}> = ({ enabled, isDark, isRound2 }) => {
  if (!enabled) return null;

  return (
    <div
      aria-hidden="true"
      data-testid="christmas-card-accent"
      className="pointer-events-none select-none absolute -top-2.5 -right-2 hidden sm:block transition-all duration-500"
    >
      <svg viewBox="0 0 64 44" width="56" height="38" className="overflow-visible">
        <circle
          cx="46"
          cy="14"
          r="15"
          fill={isDark ? (isRound2 ? 'rgba(56, 189, 248, 0.24)' : 'rgba(251, 191, 36, 0.24)') : 'rgba(14, 165, 233, 0.08)'}
          className="transition-all duration-500"
        />
        <g transform="translate(46, 13)">
          <ellipse
            cx="-11"
            cy="-2"
            rx="9"
            ry="3.2"
            transform="rotate(-14 -11 -2)"
            fill={isDark ? '#059669' : '#15803d'}
          />
          <ellipse
            cx="2"
            cy="10"
            rx="8.5"
            ry="3"
            transform="rotate(76 2 10)"
            fill={isDark ? '#10b981' : '#16a34a'}
          />
          <ellipse
            cx="-7"
            cy="6"
            rx="7"
            ry="2.6"
            transform="rotate(-48 -7 6)"
            fill={isDark ? '#047857' : '#166534'}
          />
          <circle cx="-2.2" cy="1.8" r="2.6" fill={isDark ? '#fb7185' : '#e11d48'} />
          <circle cx="2.4" cy="2.6" r="2.4" fill={isDark ? '#f43f5e' : '#be123c'} />
          <circle cx="0.2" cy="-1.6" r="2.5" fill={isDark ? '#fbbf24' : '#e11d48'} />
          <circle cx="-2.8" cy="1.1" r="0.7" fill="#ffffff" opacity="0.88" />
          <circle cx="0" cy="-2.2" r="0.7" fill="#ffffff" opacity="0.88" />
        </g>

        <g transform="translate(24, 8)">
          <g className="festive-star-sparkle">
            <path
              d="M0 -4.5 L1.1 -1.1 L4.5 0 L1.1 1.1 L0 4.5 L-1.1 1.1 L-4.5 0 L-1.1 -1.1 Z"
              fill={isDark ? '#fde68a' : '#0ea5e9'}
            />
          </g>
        </g>
        {isRound2 && (
          <g transform="translate(55, 29)">
            <g className="festive-star-sparkle" style={{ animationDelay: '1.1s' }}>
              <path
                d="M0 -3.4 L0.8 -0.8 L3.4 0 L0.8 0.8 L0 3.4 L-0.8 0.8 L-3.4 0 L-0.8 -0.8 Z"
                fill={isDark ? '#7dd3fc' : '#38bdf8'}
              />
            </g>
          </g>
        )}
      </svg>
    </div>
  );
};

/**
 * 4. Brief, silky outer-edge frost shimmer when transitioning Round 1 -> Round 2.
 * Strictly frames the viewport perimeter (inset box-shadow) so central text stays 100% crisp.
 */
export const Round2FrostEdgeShimmer: React.FC<{
  burstKey: number;
  enabled: boolean;
  isDark: boolean;
}> = ({ burstKey, enabled, isDark }) => {
  if (!enabled || burstKey <= 0) return null;

  return (
    <div
      key={burstKey}
      aria-hidden="true"
      className="fixed inset-0 z-20 pointer-events-none festive-frost-edge-flash"
      style={{
        boxShadow: isDark
          ? 'inset 0 0 110px rgba(56, 189, 248, 0.36), inset 0 0 42px rgba(224, 242, 254, 0.24)'
          : 'inset 0 0 96px rgba(56, 189, 248, 0.28), inset 0 0 32px rgba(14, 165, 233, 0.16)'
      }}
    />
  );
};

interface CachedSnowSprites {
  isDark: boolean;
  dotFar: HTMLCanvasElement;
  dotMid: HTMLCanvasElement;
  crystalMid: HTMLCanvasElement;
  crystalNear: HTMLCanvasElement;
  bokehCool: HTMLCanvasElement;
  bokehWarm: HTMLCanvasElement;
}

function createOffscreenSprite(
  sizePx: number,
  draw: (ctx: CanvasRenderingContext2D, cx: number, cy: number) => void
): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = sizePx;
  c.height = sizePx;
  const ctx = c.getContext('2d');
  if (ctx) {
    draw(ctx, sizePx / 2, sizePx / 2);
  }
  return c;
}

function drawSixPointCrystal(
  ctx: CanvasRenderingContext2D,
  radius: number,
  strokeColor: string,
  coreColor: string,
  glowColor?: string
): void {
  if (glowColor) {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = radius * 0.9;
  }
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = Math.max(1.1, radius * 0.15);
  ctx.lineCap = 'round';

  for (let arm = 0; arm < 6; arm++) {
    ctx.save();
    ctx.rotate((arm * Math.PI) / 3);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -radius);
    const b1Y = -radius * 0.52;
    const b1Len = radius * 0.34;
    ctx.moveTo(0, b1Y);
    ctx.lineTo(-b1Len, b1Y - b1Len * 0.72);
    ctx.moveTo(0, b1Y);
    ctx.lineTo(b1Len, b1Y - b1Len * 0.72);
    const b2Y = -radius * 0.78;
    const b2Len = radius * 0.18;
    ctx.moveTo(0, b2Y);
    ctx.lineTo(-b2Len, b2Y - b2Len * 0.7);
    ctx.moveTo(0, b2Y);
    ctx.lineTo(b2Len, b2Y - b2Len * 0.7);
    ctx.stroke();
    ctx.restore();
  }

  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = coreColor;
  ctx.fill();
}

function buildSnowSpriteCache(isDark: boolean): CachedSnowSprites {
  const dotFar = createOffscreenSprite(20, (ctx, cx, cy) => {
    const grad = ctx.createRadialGradient(cx, cy, 0.5, cx, cy, 8);
    if (isDark) {
      grad.addColorStop(0, 'rgba(240, 249, 255, 0.95)');
      grad.addColorStop(0.55, 'rgba(186, 230, 253, 0.55)');
      grad.addColorStop(1, 'rgba(186, 230, 253, 0)');
    } else {
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.96)');
      grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.62)');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fill();
  });

  const dotMid = createOffscreenSprite(28, (ctx, cx, cy) => {
    const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, 11);
    if (isDark) {
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.45, 'rgba(224, 242, 254, 0.82)');
      grad.addColorStop(1, 'rgba(125, 211, 252, 0)');
    } else {
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.42, 'rgba(14, 165, 233, 0.72)');
      grad.addColorStop(1, 'rgba(14, 165, 233, 0)');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 11, 0, Math.PI * 2);
    ctx.fill();
  });

  const crystalMid = createOffscreenSprite(44, (ctx, cx, cy) => {
    ctx.save();
    ctx.translate(cx, cy);
    drawSixPointCrystal(
      ctx,
      15,
      isDark ? '#e0f2fe' : '#0284c7',
      '#ffffff',
      isDark ? 'rgba(186, 230, 253, 0.65)' : 'rgba(56, 189, 248, 0.35)'
    );
    ctx.restore();
  });

  const crystalNear = createOffscreenSprite(64, (ctx, cx, cy) => {
    ctx.save();
    ctx.translate(cx, cy);
    drawSixPointCrystal(
      ctx,
      22,
      isDark ? '#f0f9ff' : '#0ea5e9',
      '#ffffff',
      isDark ? 'rgba(186, 230, 253, 0.85)' : 'rgba(14, 165, 233, 0.42)'
    );
    ctx.restore();
  });

  const bokehCool = createOffscreenSprite(48, (ctx, cx, cy) => {
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 22);
    if (isDark) {
      grad.addColorStop(0, 'rgba(224, 242, 254, 0.65)');
      grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.25)');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    } else {
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.78)');
      grad.addColorStop(0.52, 'rgba(56, 189, 248, 0.3)');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fill();
  });

  const bokehWarm = createOffscreenSprite(48, (ctx, cx, cy) => {
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 22);
    if (isDark) {
      grad.addColorStop(0, 'rgba(254, 243, 199, 0.62)');
      grad.addColorStop(0.5, 'rgba(251, 191, 36, 0.22)');
      grad.addColorStop(1, 'rgba(251, 191, 36, 0)');
    } else {
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.75)');
      grad.addColorStop(0.52, 'rgba(186, 230, 253, 0.34)');
      grad.addColorStop(1, 'rgba(186, 230, 253, 0)');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fill();
  });

  return { isDark, dotFar, dotMid, crystalMid, crystalNear, bokehCool, bokehWarm };
}

/**
 * 5. Breakthrough 60fps Multi-Layer Depth Parallax HTML5 Canvas Snowfall:
 * - Offscreen pre-rendered sprites for locked 60fps with 105–160 silky multi-layer flakes
 *   (distant winter powder, mid-depth 6-point ice crystals, foreground soft bokeh orbs).
 * - Gentle interactive cursor wind breeze (non-blocking passive pointer listener).
 * - Content-safe central reading corridor preserves 100% crisp legibility of numbers & text.
 */
export const ChristmasSnowCanvas: React.FC<{
  isFestiveEnabled: boolean;
  viewingRound: WorkshopRound;
  snowBurstTrigger: number;
  isDark: boolean;
}> = ({ isFestiveEnabled, viewingRound, snowBurstTrigger, isDark }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isBurstActive, setIsBurstActive] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (snowBurstTrigger <= 0 || !isFestiveEnabled) return;
    setIsBurstActive(true);
    const timer = window.setTimeout(() => {
      setIsBurstActive(false);
    }, 5200);
    return () => window.clearTimeout(timer);
  }, [snowBurstTrigger, isFestiveEnabled]);

  const snowConfig = resolveSnowMode({
    isFestiveEnabled,
    viewingRound,
    isBurstActive,
    prefersReducedMotion
  });

  const configRef = useRef(snowConfig);
  configRef.current = snowConfig;
  const isDarkRef = useRef(isDark);
  isDarkRef.current = isDark;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // Passive pointer breeze tracker (makes snowflakes gently respond to cursor glide)
    let windBias = 0;
    let lastMouseX: number | null = null;
    const onMouseMove = (e: MouseEvent) => {
      if (lastMouseX !== null) {
        const dx = e.clientX - lastMouseX;
        windBias = Math.max(-55, Math.min(55, windBias + dx * 0.42));
      }
      lastMouseX = e.clientX;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    let sprites: CachedSnowSprites = buildSnowSpriteCache(isDarkRef.current);
    let particles: SnowflakeParticle[] = [];
    let fadeLevel = 0;
    let lastTime = performance.now();
    let elapsedSec = 0;

    const tick = (now: number) => {
      const dtSec = Math.min((now - lastTime) / 1000, 0.06);
      lastTime = now;
      elapsedSec += dtSec;

      // Decay cursor breeze gently back to calm
      windBias *= Math.pow(0.18, dtSec);

      const cfg = configRef.current;
      const dark = isDarkRef.current;
      if (sprites.isDark !== dark) {
        sprites = buildSnowSpriteCache(dark);
      }

      const targetFade = cfg.mode === 'OFF' ? 0 : 1;
      fadeLevel += (targetFade - fadeLevel) * Math.min(1, dtSec * 3.2);

      // Smoothly ramp particle count up/down
      if (cfg.targetCount > particles.length) {
        const toAdd = Math.min(10, cfg.targetCount - particles.length);
        const spawnAtTop = particles.length > 0 && cfg.mode !== 'BURST';
        for (let i = 0; i < toAdd; i++) {
          const p = createSnowflakeParticle(width, height, spawnAtTop);
          if (cfg.mode === 'BURST' && particles.length < 95) {
            p.y = Math.random() * height * 0.72;
          }
          particles.push(p);
        }
      } else if (cfg.targetCount < particles.length && fadeLevel < 0.04) {
        particles = [];
      } else if (cfg.targetCount < particles.length && particles.length > cfg.targetCount) {
        particles.length = Math.max(cfg.targetCount, particles.length - 2);
      }

      ctx.clearRect(0, 0, width, height);

      if (fadeLevel > 0.01) {
        // Render 3-layer depth parallax snowflakes using offscreen sprite cache
        const activeMode = cfg.mode === 'OFF' ? 'GENTLE' : cfg.mode;
        const speedMult = cfg.speedMultiplier || 0.85;

        for (let i = 0; i < particles.length; i++) {
          const updated = stepSnowflakeParticle(
            particles[i],
            dtSec,
            width,
            height,
            elapsedSec,
            speedMult,
            windBias
          );
          particles[i] = updated;

          const xNorm = updated.x / Math.max(1, width);
          const safeAlpha =
            computeContentSafeOpacity(xNorm, updated.baseOpacity, activeMode, updated.depthLayer) *
            fadeLevel *
            (cfg.opacityScale || 0.8);

          if (safeAlpha <= 0.012) continue;

          // Subtle crystalline shimmer pulse on near/mid crystals
          const shimmer =
            updated.kind === 'crystal'
              ? 0.84 + 0.16 * Math.sin(elapsedSec * 3.1 + updated.shimmerPhase)
              : 1;

          ctx.save();
          ctx.translate(updated.x, updated.y);
          ctx.globalAlpha = Math.min(0.95, safeAlpha * shimmer * (dark ? 1.0 : 1.12));

          if (updated.kind === 'crystal') {
            ctx.rotate(updated.rotation);
            const sprite = updated.depthLayer === 'near' ? sprites.crystalNear : sprites.crystalMid;
            const drawSize = updated.radius * 2.75;
            ctx.drawImage(sprite, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
          } else if (updated.kind === 'bokeh') {
            const sprite = i % 4 === 0 ? sprites.bokehWarm : sprites.bokehCool;
            const drawSize = updated.radius * 3.6;
            ctx.drawImage(sprite, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
          } else {
            const sprite = updated.depthLayer === 'far' ? sprites.dotFar : sprites.dotMid;
            const drawSize = updated.radius * 3.1;
            ctx.drawImage(sprite, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
          }

          ctx.restore();
        }
      }

      if (cfg.mode !== 'OFF' || fadeLevel > 0.015) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, width, height);
        rafId = 0;
      }
    };

    if (snowConfig.mode !== 'OFF' || fadeLevel > 0.015) {
      rafId = window.requestAnimationFrame(tick);
    }

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [snowConfig.mode]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-testid="christmas-snow-canvas"
      data-snow-mode={snowConfig.mode}
      className="fixed inset-0 z-30 pointer-events-none w-full h-full"
    />
  );
};

/**
 * 6. Cute, non-overlapping inline winter arrival ribbon shown above the Mission Card
 * when unlocking Round 2 — guarantees 0px overlap over route cards or details!
 */
export const Round2WinterArrivalBanner: React.FC<{
  visible: boolean;
  isDark: boolean;
  onDismiss: () => void;
}> = ({ visible, isDark, onDismiss }) => {
  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="christmas-round2-toast"
      className={`rounded-xl border px-4 py-2.5 flex items-center justify-between gap-3 festive-toast-in transition-colors duration-500 ${
        isDark
          ? 'bg-gradient-to-r from-sky-950/65 via-slate-900/90 to-amber-950/35 border-sky-500/40 text-sky-100'
          : 'bg-gradient-to-r from-sky-50 via-white to-rose-50/60 border-sky-200 text-slate-900'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-900 border border-sky-200/80 dark:border-sky-700/60 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 36 36" width="26" height="26" aria-hidden="true">
            <circle cx="18" cy="25" r="7.2" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.1" />
            <circle cx="18" cy="14" r="5.2" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.1" />
            <path d="M13.2 18.2 Q18 20.5 22.8 18.2" stroke="#e11d48" strokeWidth="2.6" strokeLinecap="round" fill="none" />
            <path d="M21 19 L23.5 23.5" stroke="#e11d48" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="16.2" cy="13.2" r="0.9" fill="#0f172a" />
            <circle cx="19.8" cy="13.2" r="0.9" fill="#0f172a" />
            <path d="M18 14.3 L21.4 15.1 L18 15.8 Z" fill="#f97316" />
            <path d="M13.2 10.6 C14 6.5 22 6.5 22.8 10.6 Z" fill="#0284c7" />
            <circle cx="18" cy="6.2" r="1.6" fill="#f8fafc" stroke="#94a3b8" strokeWidth="0.6" />
            <g transform="translate(24.5, 23)">
              <line
                x1="0"
                y1="0"
                x2="6"
                y2="-4.5"
                stroke="#78350f"
                strokeWidth="1.3"
                strokeLinecap="round"
                className="festive-wave"
              />
            </g>
          </svg>
        </div>

        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-bold text-sky-800 dark:text-sky-200 leading-snug">
            Tuyết Giáng sinh đã về Stuttgart — Vòng 2 đã mở khóa!
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
            Hãy đối chiếu lại thời gian giao (chậm nhất ngày 30) và tổng phí trong ngân sách 8.000 – 12.000 USD (tối đa 15.000 USD).
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Đóng thông báo Giáng sinh"
        className={`p-1.5 rounded-lg transition-colors shrink-0 cursor-pointer ${
          isDark
            ? 'text-sky-300 hover:bg-sky-900/60'
            : 'text-sky-700 hover:bg-sky-100'
        }`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

/**
 * 7. Subtle rotating Nordic snowflake emblem for Round 2 headings.
 */
export const AnimatedSnowflakeEmblem: React.FC<{ enabled: boolean; className?: string }> = ({
  enabled,
  className = 'w-4 h-4 text-sky-500 dark:text-sky-300 shrink-0'
}) => {
  if (!enabled) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`${className} festive-spin-slow`}
    >
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="3.34" y1="7" x2="20.66" y2="17" />
      <line x1="20.66" y1="7" x2="3.34" y2="17" />
      <polyline points="9.5 4.5 12 7 14.5 4.5" />
      <polyline points="9.5 19.5 12 17 14.5 19.5" />
      <polyline points="4.5 10.5 7 9.5 6.5 7" />
      <polyline points="19.5 13.5 17 14.5 17.5 17" />
      <polyline points="17.5 7 17 9.5 19.5 10.5" />
      <polyline points="6.5 17 7 14.5 4.5 13.5" />
    </svg>
  );
};

/**
 * 8. Exquisite Dual-Theme Nordic Christmas Logistics Diorama sitting cleanly at page bottom.
 */
export const FooterWinterLogisticsScene: React.FC<{
  enabled: boolean;
  isDark: boolean;
}> = ({ enabled, isDark }) => {
  if (!enabled) return null;

  const hillFar = isDark ? '#0f1c30' : '#dbeafe';
  const hillBack = isDark ? '#16253d' : '#e2e8f0';
  const hillFront = isDark ? '#0f172a' : '#f1f5f9';
  const treeDark = isDark ? '#064e3b' : '#15803d';
  const treeLight = isDark ? '#059669' : '#22c55e';
  const snowCap = isDark ? '#e0f2fe' : '#ffffff';

  const nightStars = [
    { x: 110, y: 14, r: 1.4, delay: '0.1s' },
    { x: 220, y: 20, r: 1.1, delay: '1.2s' },
    { x: 350, y: 11, r: 1.7, delay: '0.5s' },
    { x: 515, y: 16, r: 1.2, delay: '1.8s' },
    { x: 675, y: 10, r: 1.6, delay: '0.7s' },
    { x: 810, y: 18, r: 1.2, delay: '1.5s' },
    { x: 960, y: 12, r: 1.5, delay: '0.3s' },
    { x: 1085, y: 15, r: 1.1, delay: '1.0s' }
  ];

  return (
    <div
      aria-hidden="true"
      data-testid="christmas-footer-scene"
      data-festive-theme={isDark ? 'night' : 'day'}
      className="pointer-events-none select-none w-full overflow-hidden transition-all duration-500"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <svg
          viewBox="0 0 1200 80"
          preserveAspectRatio="xMidYMax meet"
          className="w-full h-[68px] sm:h-[82px] block overflow-visible"
        >
          <defs>
            <linearGradient id="festiveAuroraGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
              <stop offset="28%" stopColor="#38bdf8" stopOpacity="0.38" />
              <stop offset="55%" stopColor="#34d399" stopOpacity="0.32" />
              <stop offset="80%" stopColor="#818cf8" stopOpacity="0.26" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
            </linearGradient>

            <radialGradient id="festiveMoonGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.56" />
              <stop offset="55%" stopColor="#fbbf24" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="festiveHeadlight" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity={isDark ? '0.68' : '0.24'} />
              <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* NIGHT LAYER */}
          <g className={`transition-opacity duration-500 ${isDark ? 'opacity-100' : 'opacity-0'}`}>
            <path
              d="M140 28 Q380 4 620 22 T1060 16 L1060 36 Q820 44 600 34 T140 42 Z"
              fill="url(#festiveAuroraGrad)"
              className="festive-aurora-wave"
            />

            <g transform="translate(895, 22)">
              <g className="festive-moon-float">
                <circle cx="0" cy="0" r="20" fill="url(#festiveMoonGlow)" />
                <path
                  d="M4 -9.5 A9.5 9.5 0 1 0 4 9.5 A7.4 7.4 0 1 1 4 -9.5 Z"
                  fill="#fef3c7"
                />
              </g>
            </g>

            {nightStars.map((st, idx) => (
              <g key={idx} transform={`translate(${st.x}, ${st.y})`}>
                <g className="festive-star-sparkle" style={{ animationDelay: st.delay }}>
                  <path
                    d={`M0 -${st.r * 2.1} L${st.r * 0.5} -${st.r * 0.5} L${st.r * 2.1} 0 L${st.r * 0.5} ${st.r * 0.5} L0 ${st.r * 2.1} L-${st.r * 0.5} ${st.r * 0.5} L-${st.r * 2.1} 0 L-${st.r * 0.5} -${st.r * 0.5} Z`}
                    fill={idx % 2 === 0 ? '#fde68a' : '#bae6fd'}
                  />
                </g>
              </g>
            ))}
          </g>

          {/* DAY LAYER */}
          <g className={`transition-opacity duration-500 ${isDark ? 'opacity-0' : 'opacity-100'}`}>
            <g transform="translate(215, 22)">
              <g className="festive-cloud-drift">
                <ellipse cx="0" cy="0" rx="22" ry="6.5" fill="#e0f2fe" opacity="0.85" />
                <circle cx="-8" cy="-3" r="6.5" fill="#f0f9ff" />
                <circle cx="4" cy="-4.5" r="8" fill="#ffffff" />
                <circle cx="14" cy="-1.5" r="5.5" fill="#f0f9ff" />
              </g>
            </g>
            <g transform="translate(740, 18)">
              <g className="festive-cloud-drift" style={{ animationDelay: '4s' }}>
                <ellipse cx="0" cy="0" rx="26" ry="7" fill="#e0f2fe" opacity="0.82" />
                <circle cx="-10" cy="-3" r="7" fill="#f0f9ff" />
                <circle cx="3" cy="-5" r="8.8" fill="#ffffff" />
                <circle cx="15" cy="-2" r="6" fill="#f0f9ff" />
              </g>
            </g>
            <g transform="translate(460, 14)">
              <g className="festive-star-sparkle">
                <circle cx="0" cy="0" r="1.5" fill="#38bdf8" opacity="0.55" />
              </g>
            </g>
            <g transform="translate(950, 16)">
              <g className="festive-star-sparkle" style={{ animationDelay: '1.4s' }}>
                <circle cx="0" cy="0" r="1.5" fill="#0ea5e9" opacity="0.5" />
              </g>
            </g>
          </g>

          {/* Distant Alpine Snowy Mountain Silhouette */}
          <path
            d="M0 80 L95 48 L175 64 L270 40 L370 64 L520 56 L660 66 L795 44 L910 62 L1040 46 L1140 62 L1200 56 L1200 80 Z"
            fill={hillFar}
            opacity={isDark ? '0.62' : '0.52'}
            className="transition-colors duration-500"
          />

          <path
            d="M0 80 Q190 52 390 66 T800 63 T1200 67 L1200 80 Z"
            fill={hillBack}
            className="transition-colors duration-500"
          />
          <path
            d="M0 80 Q270 62 550 71 T1030 66 T1200 73 L1200 80 Z"
            fill={hillFront}
            className="transition-colors duration-500"
          />

          {/* Cozy Stuttgart Winter Alpine Chalet */}
          <g transform="translate(972, 71)">
            <g transform="translate(14, -27)">
              <circle cx="0" cy="0" r="2.2" fill={isDark ? '#cbd5e1' : '#94a3b8'} className="festive-smoke-rise" />
              <circle cx="1.5" cy="-2" r="1.8" fill={isDark ? '#e2e8f0' : '#cbd5e1'} className="festive-smoke-rise" style={{ animationDelay: '1.4s' }} />
              <circle cx="-0.5" cy="-1" r="2" fill={isDark ? '#cbd5e1' : '#94a3b8'} className="festive-smoke-rise" style={{ animationDelay: '2.8s' }} />
            </g>
            <rect x="11" y="-27" width="5.5" height="10" rx="0.8" fill={isDark ? '#475569' : '#94a3b8'} />
            <rect
              x="-18"
              y="-18"
              width="36"
              height="18"
              rx="1.5"
              fill={isDark ? '#1e293b' : '#ffffff'}
              stroke={isDark ? '#475569' : '#cbd5e1'}
              strokeWidth="1"
            />
            <polygon points="-22,-17 0,-32 22,-17" fill={isDark ? '#be123c' : '#e11d48'} />
            <path
              d="M-22 -17 L0 -32 L22 -17"
              fill="none"
              stroke={snowCap}
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect x="-3.5" y="-10" width="7" height="10" rx="1" fill={isDark ? '#78350f' : '#92400e'} />
            <rect
              x="-13.5"
              y="-13"
              width="6.5"
              height="6.5"
              rx="1"
              fill={isDark ? '#fde68a' : '#bae6fd'}
              stroke={isDark ? '#f59e0b' : '#64748b'}
              strokeWidth="0.7"
              className="transition-colors duration-500"
            />
            <rect
              x="7"
              y="-13"
              width="6.5"
              height="6.5"
              rx="1"
              fill={isDark ? '#fde68a' : '#bae6fd'}
              stroke={isDark ? '#f59e0b' : '#64748b'}
              strokeWidth="0.7"
              className="transition-colors duration-500"
            />
            <g className={`transition-opacity duration-500 ${isDark ? 'opacity-80' : 'opacity-0'}`}>
              <circle cx="-10" cy="-9.5" r="9" fill="url(#festiveMoonGlow)" />
              <circle cx="10.2" cy="-9.5" r="9" fill="url(#festiveMoonGlow)" />
            </g>
          </g>

          {/* Left Pine Tree Cluster */}
          <g transform="translate(56, 74)">
            <g className="festive-tree-sway">
              <rect x="-2.2" y="-7.5" width="4.4" height="7.5" fill="#78350f" rx="0.8" />
              <polygon points="0,-42 -14,-16 14,-16" fill={treeDark} />
              <polygon points="0,-29 -16,-6.5 16,-6.5" fill={treeLight} />
              <polygon points="0,-42 -5.2,-31 5.2,-31" fill={snowCap} opacity="0.95" />
              {isDark && <circle cx="0" cy="-43.5" r="6" fill="url(#festiveMoonGlow)" />}
              <circle cx="0" cy="-43.5" r="2.3" fill="#fbbf24" />
              <circle cx="-4.8" cy="-19" r="1.5" fill={isDark ? '#fb7185' : '#e11d48'} />
              <circle cx="5.2" cy="-12" r="1.5" fill="#fbbf24" />
              <circle cx="-1" cy="-26" r="1.35" fill="#38bdf8" />
            </g>
          </g>

          <g transform="translate(96, 75)">
            <g className="festive-tree-sway" style={{ animationDelay: '0.8s' }}>
              <rect x="-1.6" y="-5.5" width="3.2" height="5.5" fill="#78350f" rx="0.6" />
              <polygon points="0,-29 -10.5,-9.5 10.5,-9.5" fill={treeLight} />
              <polygon points="0,-29 -3.8,-21.5 3.8,-21.5" fill={snowCap} opacity="0.92" />
              <circle cx="2.5" cy="-14.5" r="1.35" fill={isDark ? '#7dd3fc' : '#0284c7'} />
              <circle cx="-3" cy="-12" r="1.2" fill="#fbbf24" />
            </g>
          </g>

          <g transform="translate(275, 75)" opacity="0.78">
            <g className="festive-tree-sway" style={{ animationDelay: '1.5s' }}>
              <rect x="-1.4" y="-4.5" width="2.8" height="4.5" fill="#78350f" rx="0.5" />
              <polygon points="0,-23 -8,-7.5 8,-7.5" fill={treeDark} />
              <polygon points="0,-23 -3,-17 3,-17" fill={snowCap} opacity="0.88" />
            </g>
          </g>

          <g transform="translate(860, 75)" opacity="0.78">
            <g className="festive-tree-sway" style={{ animationDelay: '0.5s' }}>
              <rect x="-1.4" y="-4.5" width="2.8" height="4.5" fill="#78350f" rx="0.5" />
              <polygon points="0,-24 -8.5,-7.5 8.5,-7.5" fill={treeDark} />
              <polygon points="0,-24 -3.1,-17.5 3.1,-17.5" fill={snowCap} opacity="0.88" />
            </g>
          </g>

          {/* Express Holiday Delivery Van */}
          <g className="festive-van-glide">
            <g transform="translate(0, 52)">
              <ellipse cx="26" cy="22" rx="23" ry="2.8" fill={isDark ? '#020617' : '#94a3b8'} opacity="0.34" />
              <rect x="6" y="-4.5" width="9.5" height="7.5" rx="1.2" fill="#f59e0b" />
              <line x1="10.75" y1="-4.5" x2="10.75" y2="3" stroke="#ffffff" strokeWidth="1.2" />
              <rect x="17" y="-6.5" width="10.5" height="9.5" rx="1.2" fill="#10b981" />
              <line x1="22.25" y1="-6.5" x2="22.25" y2="3" stroke="#fef3c7" strokeWidth="1.2" />
              <rect x="2" y="3" width="33" height="15.5" rx="3.4" fill={isDark ? '#f43f5e' : '#e11d48'} />
              <path d="M34 6 L44 6 Q48 6 49 11 L50 18.5 L34 18.5 Z" fill={isDark ? '#f43f5e' : '#e11d48'} />
              <path d="M36.5 8 L43.5 8 Q46 8 47 11.8 L36.5 11.8 Z" fill={isDark ? '#fef08a' : '#fef3c7'} />
              <rect x="4" y="13.2" width="44" height="1.9" rx="0.95" fill="#fbbf24" />
              <polygon points="50,13.2 88,6 88,22 50,16.8" fill="url(#festiveHeadlight)" />
              <circle cx="49.5" cy="14.8" r="1.6" fill="#fef08a" />
              <circle cx="13" cy="19" r="3.8" fill="#1e293b" />
              <circle cx="13" cy="19" r="1.6" fill="#cbd5e1" />
              <circle cx="41" cy="19" r="3.8" fill="#1e293b" />
              <circle cx="41" cy="19" r="1.6" fill="#cbd5e1" />
            </g>
          </g>

          {/* Right Waving Snowman & Decorated Pines */}
          <g transform="translate(1054, 75)">
            <circle cx="0" cy="-7.2" r="6.8" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.9" />
            <circle cx="0" cy="-17" r="4.8" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.9" />
            <path d="M-4.4 -13 Q0 -11 4.4 -13" stroke="#e11d48" strokeWidth="2.3" strokeLinecap="round" fill="none" />
            <line x1="2.7" y1="-12.3" x2="5" y2="-8.3" stroke="#e11d48" strokeWidth="1.9" strokeLinecap="round" />
            <circle cx="-1.6" cy="-17.8" r="0.85" fill="#0f172a" />
            <circle cx="1.6" cy="-17.8" r="0.85" fill="#0f172a" />
            <polygon points="0,-16.7 3.6,-16 0,-15.3" fill="#f97316" />
            <rect x="-4.8" y="-22" width="9.6" height="1.6" rx="0.7" fill="#0f172a" />
            <rect x="-3.2" y="-26.8" width="6.4" height="5.2" rx="1" fill="#0f172a" />
            <rect x="-3.2" y="-23.2" width="6.4" height="1.2" fill="#e11d48" />
            <g transform="translate(6, -8.8)">
              <line
                x1="0"
                y1="0"
                x2="5.6"
                y2="-5.2"
                stroke="#78350f"
                strokeWidth="1.3"
                strokeLinecap="round"
                className="festive-wave"
              />
            </g>
          </g>

          <g transform="translate(1108, 74)">
            <g className="festive-tree-sway" style={{ animationDelay: '0.4s' }}>
              <rect x="-2.2" y="-7.5" width="4.4" height="7.5" fill="#78350f" rx="0.8" />
              <polygon points="0,-40 -14,-15 14,-15" fill={treeDark} />
              <polygon points="0,-27 -16,-6.5 16,-6.5" fill={treeLight} />
              <polygon points="0,-40 -4.8,-29.5 4.8,-29.5" fill={snowCap} opacity="0.95" />
              {isDark && <circle cx="0" cy="-41.5" r="6" fill="url(#festiveMoonGlow)" />}
              <circle cx="0" cy="-41.5" r="2.2" fill="#fbbf24" />
              <circle cx="-4.2" cy="-17" r="1.45" fill="#fbbf24" />
              <circle cx="4.8" cy="-12" r="1.45" fill={isDark ? '#fb7185' : '#e11d48'} />
              <circle cx="1" cy="-24" r="1.3" fill="#38bdf8" />
            </g>
          </g>

          <g transform="translate(1152, 75)">
            <g className="festive-tree-sway" style={{ animationDelay: '1.1s' }}>
              <rect x="-1.6" y="-5.5" width="3.2" height="5.5" fill="#78350f" rx="0.6" />
              <polygon points="0,-27 -10,-9 10,-9" fill={treeLight} />
              <polygon points="0,-27 -3.5,-20 3.5,-20" fill={snowCap} opacity="0.92" />
              <circle cx="-2.5" cy="-14" r="1.3" fill={isDark ? '#fb7185' : '#e11d48'} />
              <circle cx="3" cy="-12" r="1.2" fill="#fbbf24" />
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
};
