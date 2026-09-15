import React from 'react';
import { Play, Pause, Volume2, VolumeX, Zap, Activity } from 'lucide-react';
import { PlayerState } from '../types';

interface CurrentPlayerStateProps {
  playerState: PlayerState;
  onSetSpeed: (speed: number) => void;
  onSetVolume: (volume: number) => void;
  onToggleMute: () => void;
  onTogglePlay: () => void;
}

export const CurrentPlayerState: React.FC<CurrentPlayerStateProps> = ({
  playerState,
  onSetSpeed,
  onSetVolume,
  onToggleMute,
  onTogglePlay,
}) => {
  const isPlaying = playerState.playbackState === 'playing';
  const supportedSpeeds = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0];

  return (
    <div
      id="current-player-state-panel"
      className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6 shadow-xl"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-red-500" />
          <h2 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-zinc-300">
            Current Player State
          </h2>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
          {playerState.source === 'extension' ? 'Live YouTube Tab' : 'In-App Active Player'}
        </span>
      </div>

      {/* Grid of 4 Live State Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. PLAYBACK STATE */}
        <div
          onClick={onTogglePlay}
          className="cursor-pointer group flex flex-col justify-between p-4 rounded-xl border border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-700 transition"
        >
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">
            Playback
          </span>
          <div className="mt-2 flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                isPlaying
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
              }`}
            >
              {isPlaying ? <Play className="w-4 h-4 fill-emerald-400" /> : <Pause className="w-4 h-4 fill-zinc-400" />}
            </div>
            <span className={`text-base sm:text-lg font-bold ${isPlaying ? 'text-emerald-400' : 'text-zinc-300'}`}>
              {isPlaying ? '▶ Playing' : '⏸ Paused'}
            </span>
          </div>
        </div>

        {/* 2. VOLUME STATE */}
        <div className="flex flex-col justify-between p-4 rounded-xl border border-zinc-800/80 bg-zinc-950/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">
              Volume
            </span>
            <span className="text-xs font-mono font-bold text-zinc-200">
              {playerState.volume}%
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 border border-zinc-700">
              <Volume2 className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex-1">
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden border border-zinc-700/50">
                <div
                  className="bg-gradient-to-r from-red-600 to-rose-500 h-full rounded-full transition-all duration-200"
                  style={{ width: `${playerState.volume}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. MUTE STATE */}
        <div
          onClick={onToggleMute}
          className="cursor-pointer group flex flex-col justify-between p-4 rounded-xl border border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-700 transition"
        >
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">
            Audio Status
          </span>
          <div className="mt-2 flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                playerState.muted
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {playerState.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </div>
            <span
              className={`text-base sm:text-lg font-bold ${
                playerState.muted ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {playerState.muted ? '🔇 Muted' : '🔊 Active'}
            </span>
          </div>
        </div>

        {/* 4. SPEED STATE */}
        <div className="flex flex-col justify-between p-4 rounded-xl border border-zinc-800/80 bg-zinc-950/60">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">
            Playback Speed
          </span>
          <div className="mt-2 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Zap className="w-4 h-4 fill-amber-400" />
            </div>
            <span className="text-base sm:text-lg font-bold text-amber-300 font-mono">
              ⚡ {playerState.playbackRate}x
            </span>
          </div>
        </div>
      </div>

      {/* Quick Speed Chips */}
      <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] text-zinc-500 mr-1 whitespace-nowrap">Speeds:</span>
        {supportedSpeeds.map((spd) => (
          <button
            key={spd}
            onClick={() => onSetSpeed(spd)}
            className={`px-2.5 py-1 rounded-lg font-mono text-xs transition whitespace-nowrap ${
              playerState.playbackRate === spd
                ? 'bg-red-600 text-white font-bold shadow-sm'
                : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/50'
            }`}
          >
            {spd}x
          </button>
        ))}
      </div>
    </div>
  );
};
