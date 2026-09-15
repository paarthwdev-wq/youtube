import React from 'react';
import { Radio, Tv, CheckCircle2, XCircle, AlertCircle, Laptop, Globe } from 'lucide-react';
import { ConnectionStatus, VoiceLanguage } from '../types';
import { SpeechStatus } from '../lib/speechService';

interface StatusCardsProps {
  speechStatus: SpeechStatus;
  isListening: boolean;
  connection: ConnectionStatus;
  currentLanguage: VoiceLanguage;
  onOpenExtensionGuide: () => void;
}

export const StatusCards: React.FC<StatusCardsProps> = ({
  speechStatus,
  isListening,
  connection,
  currentLanguage,
  onOpenExtensionGuide,
}) => {
  // Voice Status presentation
  let voiceStatusBadge = {
    color: 'bg-zinc-600',
    textColor: 'text-zinc-400',
    borderColor: 'border-zinc-800',
    label: '⚪ Inactive',
    description: 'Voice control paused',
  };

  if (isListening) {
    voiceStatusBadge = {
      color: 'bg-emerald-500',
      textColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/30 bg-emerald-950/20',
      label: '🟢 Listening',
      description: 'Listening for voice commands',
    };
  } else if (speechStatus === 'permission_denied') {
    voiceStatusBadge = {
      color: 'bg-red-500',
      textColor: 'text-red-400',
      borderColor: 'border-red-500/30 bg-red-950/20',
      label: '🔴 Permission Denied',
      description: 'Microphone access blocked',
    };
  } else if (speechStatus === 'unsupported') {
    voiceStatusBadge = {
      color: 'bg-amber-500',
      textColor: 'text-amber-400',
      borderColor: 'border-amber-500/30 bg-amber-950/20',
      label: '🟡 Unsupported Browser',
      description: 'Use Chromium browser',
    };
  }

  // YouTube Connection presentation
  let ytStatusBadge = {
    color: 'bg-red-500',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/30 bg-red-950/20',
    label: '🔴 Not Connected',
    description: 'No active player or extension found',
  };

  if (connection.extensionInstalled && connection.youtubeTabConnected) {
    ytStatusBadge = {
      color: 'bg-emerald-500',
      textColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/30 bg-emerald-950/20',
      label: '🟢 Connected',
      description: connection.activeTabTitle ? `Tab: ${connection.activeTabTitle.slice(0, 24)}...` : 'External YouTube tab active',
    };
  } else if (connection.extensionInstalled && !connection.youtubeTabConnected) {
    ytStatusBadge = {
      color: 'bg-amber-500',
      textColor: 'text-amber-400',
      borderColor: 'border-amber-500/30 bg-amber-950/20',
      label: '🟡 Waiting for YouTube',
      description: 'Open youtube.com in Chrome',
    };
  } else if (connection.playerDetected) {
    ytStatusBadge = {
      color: 'bg-emerald-500',
      textColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/30 bg-emerald-950/20',
      label: '🟢 In-App Player Ready',
      description: 'Built-in interactive video active',
    };
  }

  const langLabelMap: Record<VoiceLanguage, string> = {
    all: 'English & Hindi (Auto)',
    hi: 'हिन्दी (Hindi)',
    en: 'English (US)',
    hinglish: 'Hinglish',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {/* 1. VOICE STATUS CARD */}
      <div
        id="voice-status-card"
        className={`rounded-2xl border p-4 sm:p-5 bg-zinc-900/70 backdrop-blur-sm transition ${voiceStatusBadge.borderColor}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-zinc-300 font-semibold text-xs tracking-wider uppercase">
            <Radio className="w-3.5 h-3.5 text-red-500" />
            <span>Voice Status</span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700/60 text-zinc-400">
            {langLabelMap[currentLanguage]}
          </span>
        </div>

        <div className="flex items-baseline gap-2 mt-1">
          <span className={`text-base sm:text-lg font-bold ${voiceStatusBadge.textColor}`}>
            {voiceStatusBadge.label}
          </span>
        </div>
        <p className="text-xs text-zinc-400 mt-1">{voiceStatusBadge.description}</p>
      </div>

      {/* 2. YOUTUBE CONNECTION CARD */}
      <div
        id="youtube-connection-card"
        className={`rounded-2xl border p-4 sm:p-5 bg-zinc-900/70 backdrop-blur-sm transition ${ytStatusBadge.borderColor}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-zinc-300 font-semibold text-xs tracking-wider uppercase">
            <Tv className="w-3.5 h-3.5 text-red-500" />
            <span>YouTube Connection</span>
          </div>
          <button
            onClick={onOpenExtensionGuide}
            className="text-[11px] text-red-400 hover:text-red-300 hover:underline transition"
          >
            Bridge Setup
          </button>
        </div>

        <div className="flex items-baseline gap-2 mt-1">
          <span className={`text-base sm:text-lg font-bold ${ytStatusBadge.textColor}`}>
            {ytStatusBadge.label}
          </span>
        </div>

        {/* Detailed Connection Sub-indicators */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-zinc-800/80 text-[11px]">
          <div>
            <span className="text-zinc-500 block">YouTube Tab:</span>
            <span
              className={`font-medium inline-flex items-center gap-1 ${
                connection.youtubeTabConnected ? 'text-emerald-400' : 'text-zinc-400'
              }`}
            >
              {connection.youtubeTabConnected ? '● Connected' : '○ Not Connected'}
            </span>
          </div>

          <div>
            <span className="text-zinc-500 block">Extension:</span>
            <span
              className={`font-medium inline-flex items-center gap-1 ${
                connection.extensionInstalled ? 'text-emerald-400' : 'text-zinc-400'
              }`}
            >
              {connection.extensionInstalled ? '● Connected' : '○ Not Installed'}
            </span>
          </div>

          <div>
            <span className="text-zinc-500 block">Player:</span>
            <span
              className={`font-medium inline-flex items-center gap-1 ${
                connection.playerDetected ? 'text-emerald-400' : 'text-zinc-400'
              }`}
            >
              {connection.playerDetected ? '● Detected' : '○ Not Detected'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
