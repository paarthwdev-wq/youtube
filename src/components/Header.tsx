import React from 'react';
import { Settings, Puzzle, Mic, Radio } from 'lucide-react';
import { ConnectionStatus } from '../types';
import { SpeechStatus } from '../lib/speechService';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  speechStatus: SpeechStatus;
  connection: ConnectionStatus;
  onOpenSettings: () => void;
  onOpenExtensionModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  speechStatus,
  connection,
  onOpenSettings,
  onOpenExtensionModal,
}) => {
  // Determine overall system ready state
  let systemBadge = {
    color: 'bg-emerald-500',
    ring: 'border-emerald-500/30 text-emerald-400 bg-emerald-950/40',
    label: 'System Ready',
  };

  if (speechStatus === 'permission_denied' || speechStatus === 'unsupported' || speechStatus === 'error') {
    systemBadge = {
      color: 'bg-red-500',
      ring: 'border-red-500/30 text-red-400 bg-red-950/40',
      label: speechStatus === 'permission_denied' ? 'Mic Blocked' : 'System Error',
    };
  } else if (speechStatus === 'listening' || speechStatus === 'processing') {
    systemBadge = {
      color: 'bg-emerald-400 animate-pulse',
      ring: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/50',
      label: 'System Listening',
    };
  }

  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 p-0.5 shadow-lg shadow-red-900/30 flex items-center justify-center">
            <div className="w-full h-full rounded-[10px] bg-zinc-950/40 flex items-center justify-center">
              <span className="text-xl leading-none">🎙️</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white uppercase">
                Voice Tube Control
              </h1>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800/50">
                PRO
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-normal">
              Control YouTube with your voice
            </p>
          </div>
        </div>

        {/* Action Controls & System Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* System Ready Status Indicator */}
          <div
            id="system-ready-indicator"
            className={`hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${systemBadge.ring}`}
          >
            <span className={`w-2 h-2 rounded-full ${systemBadge.color}`}></span>
            <span>● {systemBadge.label}</span>
          </div>

          {/* Extension Bridge Modal Trigger */}
          <button
            id="extension-setup-btn"
            onClick={onOpenExtensionModal}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
              connection.extensionInstalled
                ? 'border-emerald-800/60 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50'
                : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white'
            }`}
            title="Chrome Extension Bridge"
          >
            <Puzzle className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden md:inline">
              {connection.extensionInstalled ? 'Extension Active' : 'Extension Bridge'}
            </span>
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Settings Trigger */}
          <button
            id="open-settings-btn"
            onClick={onOpenSettings}
            className="p-2 rounded-lg border border-zinc-800 bg-zinc-900/90 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            aria-label="Settings"
            title="Settings & Tester"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
