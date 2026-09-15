import React, { useState } from 'react';
import { Mic, MicOff, AlertCircle, RefreshCw, Volume2, ExternalLink, Send, Sparkles } from 'lucide-react';
import { SpeechStatus } from '../lib/speechService';

interface MicrophoneControlProps {
  isListening: boolean;
  speechStatus: SpeechStatus;
  soundLevel: number;
  interimTranscript: string;
  errorMessage?: string;
  onToggleListening: () => void;
  onRequestPermission: () => void;
  onExecuteCustomPhrase?: (phrase: string) => void;
}

export const MicrophoneControl: React.FC<MicrophoneControlProps> = ({
  isListening,
  speechStatus,
  soundLevel,
  interimTranscript,
  errorMessage,
  onToggleListening,
  onRequestPermission,
  onExecuteCustomPhrase,
}) => {
  const [typedCommand, setTypedCommand] = useState('');
  const isPermissionDenied = speechStatus === 'permission_denied';
  const isUnsupported = speechStatus === 'unsupported';
  const isError = speechStatus === 'error';

  const handleOpenStandaloneTab = () => {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  };

  const handleSendTypedCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedCommand.trim() || !onExecuteCustomPhrase) return;
    onExecuteCustomPhrase(typedCommand.trim());
    setTypedCommand('');
  };

  const sampleVoiceChips = [
    { label: 'चलाओ (Play)', command: 'चलाओ' },
    { label: 'रुको (Pause)', command: 'रुको' },
    { label: 'म्यूट (Mute)', command: 'म्यूट' },
    { label: 'आवाज बढ़ाओ', command: 'आवाज बढ़ाओ' },
    { label: '2.5 स्पीड', command: '2.5 स्पीड' },
    { label: '1.5x speed', command: '1.5 speed' },
  ];

  return (
    <div className="w-full space-y-4">
      {/* Main Microphone Card */}
      <div
        id="microphone-card"
        className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
          isListening
            ? 'border-red-500/50 bg-gradient-to-b from-red-950/30 via-zinc-900/95 to-zinc-950 shadow-2xl shadow-red-950/40 ring-1 ring-red-500/30'
            : isError
            ? 'border-red-900/70 bg-zinc-900/80 shadow-xl'
            : 'border-zinc-800 bg-zinc-900/70 hover:border-zinc-700 shadow-xl'
        } p-6 sm:p-8 text-center`}
      >
        {/* Glow ambient circle when listening */}
        {isListening && (
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-all duration-75"
            style={{
              width: `${260 + soundLevel * 160}px`,
              height: `${260 + soundLevel * 160}px`,
              background: 'radial-gradient(circle, rgba(239, 68, 68, 0.22) 0%, rgba(220, 38, 38, 0.08) 50%, transparent 70%)',
            }}
          />
        )}

        {/* Large Central Button */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          <button
            id="main-mic-toggle-btn"
            type="button"
            onClick={onToggleListening}
            className={`group relative flex items-center justify-center rounded-full transition-all duration-300 focus:outline-none focus:ring-4 cursor-pointer select-none ${
              isListening
                ? 'w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-tr from-red-600 via-rose-500 to-red-600 text-white shadow-xl shadow-red-600/50 focus:ring-red-500/40 scale-105'
                : isError
                ? 'w-24 h-24 sm:w-28 sm:h-28 bg-zinc-800 hover:bg-zinc-750 text-red-400 border-2 border-red-800/80 hover:border-red-500 focus:ring-red-900/40 shadow-md'
                : 'w-24 h-24 sm:w-28 sm:h-28 bg-zinc-800 hover:bg-zinc-750 text-zinc-100 border-2 border-zinc-700/90 hover:border-red-500/70 focus:ring-zinc-700 shadow-lg active:scale-95'
            }`}
            aria-label={isListening ? 'Stop Voice Control' : 'Start Voice Control'}
          >
            {/* Animated Wave Rings when listening */}
            {isListening && (
              <>
                <span
                  className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-40"
                  style={{ animationDuration: '1.8s' }}
                />
                <span
                  className="absolute -inset-2.5 rounded-full border border-red-500/50"
                  style={{
                    transform: `scale(${1 + soundLevel * 0.35})`,
                    transition: 'transform 0.08s ease-out',
                  }}
                />
              </>
            )}

            {/* Mic Icon */}
            {isListening ? (
              <div className="flex flex-col items-center justify-center">
                <span className="w-3.5 h-3.5 rounded-full bg-white animate-pulse mb-1"></span>
                <Mic className="w-8 h-8 sm:w-9 sm:h-9 text-white" />
              </div>
            ) : isError ? (
              <MicOff className="w-9 h-9 sm:w-10 sm:h-10 text-red-400 group-hover:scale-105 transition-transform" />
            ) : (
              <Mic className="w-9 h-9 sm:w-10 sm:h-10 text-zinc-200 group-hover:text-red-400 transition-colors" />
            )}
          </button>

          {/* Button Text Label */}
          <div className="mt-4">
            <h2 className="text-base sm:text-lg font-bold tracking-wider uppercase text-white flex items-center justify-center gap-2">
              {isListening ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                  <span className="text-red-400">MIC LISTENING LIVE</span>
                </>
              ) : isError ? (
                <span className="text-red-400">CLICK TO ACTIVATE MIC</span>
              ) : (
                <span>START VOICE CONTROL</span>
              )}
            </h2>
            <p className="mt-1 text-xs text-zinc-400 max-w-md mx-auto">
              {isListening
                ? 'Speak now: "चलाओ", "रुको", "म्यूट", "आवाज बढ़ाओ", or "2.5 speed".'
                : 'Click the red button above to start hands-free voice control.'}
            </p>
          </div>

          {/* Real-time speech transcript banner */}
          {isListening && interimTranscript && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-950/90 border border-red-500/40 text-xs text-zinc-200 shadow-inner max-w-lg">
              <Volume2 className="w-3.5 h-3.5 text-red-400 animate-pulse flex-shrink-0" />
              <span className="text-zinc-400">Heard:</span>
              <span className="font-semibold text-white truncate italic">"{interimTranscript}"</span>
            </div>
          )}

          {/* Error Banner with Open In New Tab Option */}
          {isError && (
            <div className="mt-4 flex flex-col sm:flex-row items-center gap-2.5 p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-xs text-red-200 max-w-xl text-left">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <div className="flex-1">
                <span>{errorMessage || 'Browser speech recognition encountered an issue.'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenStandaloneTab}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-xs font-medium text-white flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open Full Tab</span>
                </button>
                <button
                  type="button"
                  onClick={onRequestPermission}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-500 rounded text-xs font-semibold text-white flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              </div>
            </div>
          )}

          {/* Permission Denied Banner with New Tab helper */}
          {isPermissionDenied && (
            <div className="mt-4 flex flex-col gap-2.5 p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-xs text-red-200 max-w-xl text-left">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold text-white block mb-0.5">Microphone Permission Notice</span>
                  <p className="text-zinc-300 leading-relaxed">
                    Browser security blocks microphone inside preview iframes. Open this app in a standalone tab or allow microphone permissions.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-1">
                <button
                  type="button"
                  onClick={handleOpenStandaloneTab}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-medium text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open in Standalone Tab</span>
                </button>
                <button
                  type="button"
                  onClick={onRequestPermission}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-xs font-semibold text-white cursor-pointer"
                >
                  Grant Permission
                </button>
              </div>
            </div>
          )}

          {/* Unsupported Browser Banner */}
          {isUnsupported && (
            <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-950/70 border border-amber-800/70 text-xs text-amber-200 max-w-md">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="text-left">
                Speech recognition works on Google Chrome, Microsoft Edge, and Brave browsers.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Instant Voice Simulator & Test Console (Works 100% anytime) */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-red-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Instant Command Tester & Voice Simulator
            </span>
          </div>
          <span className="text-[11px] text-zinc-500 hidden sm:inline">
            Click any phrase or type below to test immediately
          </span>
        </div>

        {/* Quick Voice Phrase Chips */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {sampleVoiceChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onExecuteCustomPhrase?.(chip.command)}
              className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950/80 hover:bg-zinc-800 hover:border-red-500/50 text-zinc-300 hover:text-white text-xs font-medium transition cursor-pointer active:scale-95"
            >
              "{chip.label}"
            </button>
          ))}
        </div>

        {/* Custom Phrase Form */}
        <form onSubmit={handleSendTypedCommand} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={typedCommand}
              onChange={(e) => setTypedCommand(e.target.value)}
              placeholder="Type any Hindi/English command (e.g., 'भाई वीडियो चला दो', 'आवाज 60 करो', '2.5 speed')..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-red-500/70 focus:ring-1 focus:ring-red-500/50"
            />
          </div>
          <button
            type="submit"
            disabled={!typedCommand.trim()}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:hover:bg-red-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Execute</span>
          </button>
        </form>
      </div>
    </div>
  );
};
