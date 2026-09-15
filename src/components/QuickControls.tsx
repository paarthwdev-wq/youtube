import React from 'react';
import { Play, Pause, VolumeX, Volume2, Volume1, Zap, Sliders } from 'lucide-react';
import { CommandIntent } from '../types';

interface QuickControlsProps {
  onExecuteIntent: (intent: CommandIntent, value?: number, amount?: number, label?: string) => void;
}

export const QuickControls: React.FC<QuickControlsProps> = ({ onExecuteIntent }) => {
  return (
    <div
      id="quick-controls-panel"
      className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6 shadow-xl"
    >
      <div className="flex items-center gap-2 mb-4">
        <Sliders className="w-4 h-4 text-red-500" />
        <h2 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-zinc-300">
          Quick Controls
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {/* 1. Play */}
        <button
          id="btn-quick-play"
          onClick={() => onExecuteIntent('PLAY', undefined, undefined, 'Play button')}
          className="flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-800 bg-zinc-950/70 hover:bg-zinc-800 hover:border-emerald-500/50 text-zinc-200 hover:text-white transition active:scale-95 group"
        >
          <Play className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition fill-emerald-400/20" />
          <span className="mt-1.5 text-xs font-semibold">▶ Play</span>
        </button>

        {/* 2. Pause */}
        <button
          id="btn-quick-pause"
          onClick={() => onExecuteIntent('PAUSE', undefined, undefined, 'Pause button')}
          className="flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-800 bg-zinc-950/70 hover:bg-zinc-800 hover:border-amber-500/50 text-zinc-200 hover:text-white transition active:scale-95 group"
        >
          <Pause className="w-5 h-5 text-amber-400 group-hover:scale-110 transition fill-amber-400/20" />
          <span className="mt-1.5 text-xs font-semibold">⏸ Pause</span>
        </button>

        {/* 3. Mute */}
        <button
          id="btn-quick-mute"
          onClick={() => onExecuteIntent('MUTE', undefined, undefined, 'Mute button')}
          className="flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-800 bg-zinc-950/70 hover:bg-zinc-800 hover:border-red-500/50 text-zinc-200 hover:text-white transition active:scale-95 group"
        >
          <VolumeX className="w-5 h-5 text-red-400 group-hover:scale-110 transition" />
          <span className="mt-1.5 text-xs font-semibold">🔇 Mute</span>
        </button>

        {/* 4. Unmute */}
        <button
          id="btn-quick-unmute"
          onClick={() => onExecuteIntent('UNMUTE', undefined, undefined, 'Unmute button')}
          className="flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-800 bg-zinc-950/70 hover:bg-zinc-800 hover:border-emerald-500/50 text-zinc-200 hover:text-white transition active:scale-95 group"
        >
          <Volume2 className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition" />
          <span className="mt-1.5 text-xs font-semibold">🔊 Unmute</span>
        </button>

        {/* 5. Volume - */}
        <button
          id="btn-quick-vol-down"
          onClick={() => onExecuteIntent('VOLUME_DOWN', undefined, 10, 'Volume - button')}
          className="flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-800 bg-zinc-950/70 hover:bg-zinc-800 hover:border-zinc-600 text-zinc-200 hover:text-white transition active:scale-95 group"
        >
          <Volume1 className="w-5 h-5 text-zinc-400 group-hover:text-red-400 group-hover:scale-110 transition" />
          <span className="mt-1.5 text-xs font-semibold">🔉 Vol -</span>
        </button>

        {/* 6. Volume + */}
        <button
          id="btn-quick-vol-up"
          onClick={() => onExecuteIntent('VOLUME_UP', undefined, 10, 'Volume + button')}
          className="flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-800 bg-zinc-950/70 hover:bg-zinc-800 hover:border-zinc-600 text-zinc-200 hover:text-white transition active:scale-95 group"
        >
          <Volume2 className="w-5 h-5 text-zinc-300 group-hover:text-red-400 group-hover:scale-110 transition" />
          <span className="mt-1.5 text-xs font-semibold">🔊 Vol +</span>
        </button>

        {/* 7. Speed - */}
        <button
          id="btn-quick-speed-down"
          onClick={() => onExecuteIntent('SPEED_DOWN', undefined, 0.25, 'Speed - button')}
          className="flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-800 bg-zinc-950/70 hover:bg-zinc-800 hover:border-amber-500/50 text-zinc-200 hover:text-white transition active:scale-95 group"
        >
          <Zap className="w-5 h-5 text-amber-400/80 group-hover:text-amber-400 group-hover:scale-110 transition" />
          <span className="mt-1.5 text-xs font-semibold">⚡ Spd -</span>
        </button>

        {/* 8. Speed + */}
        <button
          id="btn-quick-speed-up"
          onClick={() => onExecuteIntent('SPEED_UP', undefined, 0.25, 'Speed + button')}
          className="flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-800 bg-zinc-950/70 hover:bg-zinc-800 hover:border-amber-500/50 text-zinc-200 hover:text-white transition active:scale-95 group"
        >
          <Zap className="w-5 h-5 text-amber-400 group-hover:scale-110 transition fill-amber-400/20" />
          <span className="mt-1.5 text-xs font-semibold">⚡ Spd +</span>
        </button>
      </div>
    </div>
  );
};
