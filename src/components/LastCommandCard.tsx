import React from 'react';
import { Sparkles, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { CommandExecutionResult, PlayerState } from '../types';

interface LastCommandCardProps {
  lastCommand: CommandExecutionResult | null;
  playerState: PlayerState;
}

export const LastCommandCard: React.FC<LastCommandCardProps> = ({
  lastCommand,
  playerState,
}) => {
  if (!lastCommand) {
    return (
      <div
        id="last-command-card"
        className="w-full rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 text-center"
      >
        <div className="flex items-center justify-center gap-2 text-zinc-400 text-xs uppercase tracking-wider font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
          <span>Last Command</span>
        </div>
        <p className="text-xs text-zinc-500 italic">
          No voice commands executed yet. Turn on Voice Control and speak a command.
        </p>
      </div>
    );
  }

  const isSuccess = lastCommand.success;

  return (
    <div
      id="last-command-card"
      className={`w-full rounded-2xl border p-5 sm:p-6 transition-all ${
        isSuccess
          ? 'border-zinc-800 bg-zinc-900/60 shadow-lg'
          : 'border-red-900/50 bg-red-950/20'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300">
          <Sparkles className="w-4 h-4 text-red-500" />
          <span>Last Command</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {isSuccess ? (
            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Executed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-red-400 font-medium">
              <XCircle className="w-3.5 h-3.5" /> Failed
            </span>
          )}
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400 font-mono text-[11px]">
            {new Date(lastCommand.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. You Said */}
        <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide block mb-1">
            You said:
          </span>
          <span className="text-sm sm:text-base font-semibold text-white">
            "{lastCommand.rawCommand}"
          </span>
        </div>

        {/* 2. Action */}
        <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide block mb-1">
            Action:
          </span>
          <span
            className={`text-sm sm:text-base font-semibold ${
              isSuccess ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {lastCommand.actionDescription}
          </span>
        </div>

        {/* 3. Current State */}
        <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide block mb-1">
            Current State:
          </span>
          <div className="text-sm sm:text-base font-semibold text-zinc-200 flex items-center gap-2">
            <span>{playerState.playbackState === 'playing' ? '▶ Playing' : '⏸ Paused'}</span>
            <span className="text-zinc-600">•</span>
            <span>⚡ {playerState.playbackRate}x</span>
            <span className="text-zinc-600">•</span>
            <span>🔊 {playerState.volume}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
