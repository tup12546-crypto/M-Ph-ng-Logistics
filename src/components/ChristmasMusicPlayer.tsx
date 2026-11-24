/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  CHRISTMAS_INSTRUMENTAL_PLAYLIST,
  ChristmasMusicBoxEngine,
  formatTrackTime,
  getNextTrackIndex,
  getPrevTrackIndex,
  getTrackDurationSeconds
} from '../utils/christmasMusic';
import {
  ChevronDown,
  ChevronUp,
  ListMusic,
  Music2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX
} from 'lucide-react';

interface ChristmasMusicPlayerProps {
  /** Player only appears after unlocking Round 2 (Round 1 -> Round 2 transition) */
  visible: boolean;
  /** Incremented on the Round 1 -> Round 2 transition button click to auto-start playback */
  autoPlaySignal: number;
  isDark: boolean;
  isFestive: boolean;
}

/**
 * Sleek, inline, non-overlapping Chill Christmas Instrumental Player.
 * Appears smoothly upon transitioning from Round 1 -> Round 2 with 6 full-length (>2m)
 * chill arrangements, seekable progress bar, and zero content overlap.
 */
export const ChristmasMusicPlayer: React.FC<ChristmasMusicPlayerProps> = ({
  visible,
  autoPlaySignal,
  isDark,
  isFestive
}) => {
  const engineRef = useRef<ChristmasMusicBoxEngine | null>(null);
  const [trackIndex, setTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.5);
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [showPlaylist, setShowPlaylist] = useState<boolean>(false);

  const trackIndexRef = useRef(trackIndex);
  trackIndexRef.current = trackIndex;

  const getEngine = () => {
    if (!engineRef.current) {
      engineRef.current = new ChristmasMusicBoxEngine();
    }
    return engineRef.current;
  };

  useEffect(() => {
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      engineRef.current?.pause();
      setIsPlaying(false);
      setElapsedSec(0);
      setShowPlaylist(false);
      return;
    }

    const engine = getEngine();
    engine.setOnTrackEnd(() => {
      const nextIdx = getNextTrackIndex(
        trackIndexRef.current,
        CHRISTMAS_INSTRUMENTAL_PLAYLIST.length
      );
      setTrackIndex(nextIdx);
      setElapsedSec(0);
      engine.playTrack(nextIdx, 0);
    });
  }, [visible]);

  useEffect(() => {
    if (!visible || autoPlaySignal <= 0) return;
    const engine = getEngine();
    engine.setVolume(volume);
    engine.setMuted(isMuted);
    const started = engine.playTrack(0, 0);
    setTrackIndex(0);
    setElapsedSec(0);
    setIsPlaying(started);
  }, [autoPlaySignal, visible]);

  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => {
      if (engineRef.current) {
        setElapsedSec(engineRef.current.getCurrentElapsedSeconds());
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [isPlaying]);

  if (!visible) return null;

  const currentTrack = CHRISTMAS_INSTRUMENTAL_PLAYLIST[trackIndex];
  const totalSec = getTrackDurationSeconds(currentTrack);
  const progressPct = totalSec > 0 ? Math.min(100, (elapsedSec / totalSec) * 100) : 0;

  const handleTogglePlay = () => {
    const engine = getEngine();
    if (isPlaying) {
      engine.pause();
      setIsPlaying(false);
    } else {
      engine.setVolume(volume);
      engine.setMuted(isMuted);
      const ok = engine.resumeCurrent();
      setIsPlaying(ok);
    }
  };

  const handleSelectTrack = (idx: number) => {
    const engine = getEngine();
    engine.setVolume(volume);
    engine.setMuted(isMuted);
    setTrackIndex(idx);
    setElapsedSec(0);
    const ok = engine.playTrack(idx, 0);
    setIsPlaying(ok);
  };

  const handlePrev = () => {
    const prevIdx = getPrevTrackIndex(trackIndex, CHRISTMAS_INSTRUMENTAL_PLAYLIST.length);
    handleSelectTrack(prevIdx);
  };

  const handleNext = () => {
    const nextIdx = getNextTrackIndex(trackIndex, CHRISTMAS_INSTRUMENTAL_PLAYLIST.length);
    handleSelectTrack(nextIdx);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextSec = Number(e.target.value);
    setElapsedSec(nextSec);
    getEngine().seekTo(nextSec);
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    engineRef.current?.setMuted(nextMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVol = Number(e.target.value);
    setVolume(nextVol);
    if (nextVol > 0 && isMuted) {
      setIsMuted(false);
      engineRef.current?.setMuted(false);
    }
    engineRef.current?.setVolume(nextVol);
  };

  const containerStyle = isDark
    ? isFestive
      ? 'bg-gradient-to-r from-slate-900/95 via-slate-900/95 to-amber-950/30 border-amber-500/35 text-slate-100'
      : 'bg-slate-900 border-slate-800 text-slate-100'
    : isFestive
    ? 'bg-gradient-to-r from-white via-sky-50/45 to-rose-50/35 border-sky-200/90 text-slate-900'
    : 'bg-white border-slate-200 text-slate-900';

  const iconBtnClass = `p-2 rounded-lg border transition-colors cursor-pointer shrink-0 ${
    isDark
      ? 'border-slate-700/90 bg-slate-950/60 hover:bg-slate-800 text-slate-200'
      : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
  }`;

  return (
    <section
      aria-label="Trình phát nhạc Giáng sinh không lời sôi động"
      data-testid="christmas-music-player"
      data-playing={isPlaying ? 'true' : 'false'}
      className={`rounded-2xl border overflow-hidden transition-all duration-500 festive-toast-in ${containerStyle}`}
    >
      {/* Main Compact 1-Row Control Strip */}
      <div className="px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Cute Animated Equalizer + Track Meta & Seek Bar */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-colors duration-300 ${
              isDark
                ? isFestive
                  ? 'bg-amber-950/50 border-amber-400/40 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
                : isFestive
                ? 'bg-rose-50 border-rose-200 text-rose-600'
                : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            {isPlaying ? (
              <div className="flex items-end gap-[2.5px] h-4" aria-hidden="true">
                <span className="w-[3px] rounded-full bg-current festive-eq-bar-1" />
                <span className="w-[3px] rounded-full bg-current festive-eq-bar-2" />
                <span className="w-[3px] rounded-full bg-current festive-eq-bar-3" />
              </div>
            ) : (
              <Music2 className="w-4 h-4" aria-hidden="true" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold tracking-tight text-slate-900 dark:text-white truncate">
                {currentTrack.title}
              </span>
              <span aria-hidden="true" className="text-xs text-slate-400">
                ·
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {currentTrack.vietnameseSubtitle} ({trackIndex + 1}/{CHRISTMAS_INSTRUMENTAL_PLAYLIST.length})
              </span>
            </div>

            <div className="mt-1.5 flex items-center gap-2.5">
              <div className="relative flex-1 max-w-xs flex items-center">
                <div
                  className={`h-1.5 w-full rounded-full overflow-hidden ${
                    isDark ? 'bg-slate-800' : 'bg-slate-200/80'
                  }`}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-200 ${
                      isDark
                        ? isFestive
                          ? 'bg-amber-400'
                          : 'bg-sky-400'
                        : isFestive
                        ? 'bg-rose-500'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.floor(totalSec)}
                  step={1}
                  value={Math.floor(elapsedSec)}
                  onChange={handleSeek}
                  aria-label="Tua thời gian bản nhạc Giáng sinh"
                  data-testid="music-seek-slider"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                {formatTrackTime(elapsedSec)} / {formatTrackTime(totalSec)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Playback + Volume + Playlist Drawer Toggle */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Bài Giáng sinh trước"
              data-testid="music-prev-btn"
              className={iconBtnClass}
            >
              <SkipBack className="w-3.5 h-3.5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={handleTogglePlay}
              aria-label={isPlaying ? 'Tạm dừng nhạc Giáng sinh' : 'Phát nhạc Giáng sinh'}
              data-testid="music-play-toggle-btn"
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isDark
                  ? isFestive
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                  : isFestive
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Tạm dừng</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Phát nhạc</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleNext}
              aria-label="Bài Giáng sinh tiếp theo"
              data-testid="music-next-btn"
              className={iconBtnClass}
            >
              <SkipForward className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 pl-1">
            <button
              type="button"
              onClick={handleToggleMute}
              aria-label={isMuted ? 'Bật âm thanh nhạc Giáng sinh' : 'Tắt tiếng nhạc Giáng sinh'}
              data-testid="music-mute-btn"
              className={iconBtnClass}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              aria-label="Âm lượng nhạc Giáng sinh"
              className="w-16 sm:w-20 accent-rose-600 dark:accent-amber-400 cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowPlaylist((v) => !v)}
            aria-expanded={showPlaylist}
            data-testid="music-playlist-toggle-btn"
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              showPlaylist
                ? isDark
                  ? 'border-amber-400/50 bg-amber-950/50 text-amber-200'
                  : 'border-rose-300 bg-rose-50 text-rose-800'
                : isDark
                ? 'border-slate-700 bg-slate-950/60 hover:bg-slate-800 text-slate-200'
                : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Danh sách ({CHRISTMAS_INSTRUMENTAL_PLAYLIST.length})</span>
            {showPlaylist ? (
              <ChevronUp className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Inline Expandable Playlist (6 Full-Length >2min Chill Classics) */}
      {showPlaylist && (
        <div
          data-testid="christmas-music-playlist"
          className={`border-t px-4 py-3 ${
            isDark
              ? 'border-slate-800 bg-slate-950/50'
              : 'border-slate-200/80 bg-slate-50/70'
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {CHRISTMAS_INSTRUMENTAL_PLAYLIST.map((track, idx) => {
              const isActive = idx === trackIndex;
              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => handleSelectTrack(idx)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                    isActive
                      ? isDark
                        ? 'bg-amber-950/40 border-amber-400/50 text-amber-100'
                        : 'bg-rose-50/80 border-rose-300 text-rose-950'
                      : isDark
                      ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700 text-slate-200'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">
                      {idx + 1}. {track.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {track.vietnameseSubtitle}
                    </div>
                  </div>
                  <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                    {formatTrackTime(getTrackDurationSeconds(track))}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
