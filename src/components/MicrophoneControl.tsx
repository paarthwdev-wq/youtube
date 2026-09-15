import React from 'react';
import { Mic, MicOff, AlertCircle, RefreshCw, Volume2 } from 'lucide-react';
import { SpeechStatus } from '../lib/speechService';

interface MicrophoneControlProps {
  isListening: boolean;
  speechStatus: SpeechStatus;
  soundLevel: number;
  interimTranscript: string;
  errorMessage?: string;
  onToggleListening: () => void;
  onRequestPermission: () => void;
}

export const MicrophoneControl: React.FC<MicrophoneControlProps> = ({
  isListening,
  speechStatus,
  soundLevel,
  interimTranscript,
  errorMessage,
  onToggleListening,
  onRequestPermission,
}) => {
  const isPermissionDenied = speechStatus === 'permission_denied';
  const isUnsupported = speechStatus === 'unsupported';
  const isError = speechStatus === 'error';

  return (
    <div className="w-full relative">
      {/* Outer Card with subtle dark border */}
      <div
        id="microphone-card"
        className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
          isListening
            ? 'border-red-500/50 bg-gradient-to-b from-red-950/20 via-zinc-900/90 to-zinc-950 shadow-2xl shadow-red-950/30'
            : isError
            ? 'border-red-900/60 bg-zinc-900/70 shadow-xl'
            : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 shadow-xl'
        } p-6 sm:p-8 text-center`}
      >
        {/* Glow ambient circle when listening */}
        {isListening && (
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-all duration-75"
            style={{
              width: `${240 + soundLevel * 140}px`,
              height: `${240 + soundLevel * 140}px`,
              background: 'radial-gradient(circle, rgba(239, 68, 68, 0.18) 0%, rgba(220, 38, 38, 0.05) 50%, transparent 70%)',
            }}
          />
        )}

        {/* Large Central Button */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          <button
            id="main-mic-toggle-btn"
            onClick={isPermissionDenied || isError ? onRequestPermission : onToggleListening}
            className={`group relative flex items-center justify-center rounded-full transition-all duration-300 focus:outline-none focus:ring-4 ${
              isListening
                ? 'w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-lg shadow-red-600/40 focus:ring-red-500/40'
                : isError
                ? 'w-24 h-24 sm:w-28 sm:h-28 bg-zinc-800 hover:bg-zinc-750 text-red-400 border-2 border-red-800/80 hover:border-red-500 focus:ring-red-900/40 shadow-md'
                : 'w-24 h-24 sm:w-28 sm:h-28 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border-2 border-zinc-700/80 hover:border-red-500/60 focus:ring-zinc-700 shadow-md'
            }`}
            aria-label={isListening ? 'Stop Voice Control' : 'Start Voice Control'}
          >
            {/* Animated Wave Rings when listening */}
            {isListening && (
              <>
                <span
                  className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-30"
                  style={{ animationDuration: '2s' }}
                />
                <span
                  className="absolute -inset-2 rounded-full border border-red-500/40"
                  style={{
                    transform: `scale(${1 + soundLevel * 0.3})`,
                    transition: 'transform 0.1s ease-out',
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
              <Mic className="w-9 h-9 sm:w-10 sm:h-10 text-zinc-300 group-hover:text-red-400 transition-colors" />
            )}
          </button>

          {/* Button Text Label */}
          <div className="mt-4">
            <h2 className="text-sm sm:text-base font-bold tracking-wide uppercase text-white flex items-center justify-center gap-2">
              {isListening ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  <span className="text-red-400">LISTENING...</span>
                </>
              ) : isError ? (
                <span className="text-red-400">VOICE CONTROL PAUSED</span>
              ) : (
                <span>START VOICE CONTROL</span>
              )}
            </h2>
            <p className="mt-1 text-xs text-zinc-400 max-w-md mx-auto">
              {isListening
                ? 'Say "चलाओ", "रुको", "म्यूट", "आवाज बढ़ाओ", or a speed number like "2.5".'
                : isError
                ? 'Click the button or Retry below to reactivate voice commands.'
                : 'Click to start hands-free voice control for YouTube.'}
            </p>
          </div>

          {/* Real-time speech transcript banner */}
          {isListening && interimTranscript && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-950/80 border border-red-500/30 text-xs text-zinc-200 shadow-inner max-w-lg">
              <Volume2 className="w-3.5 h-3.5 text-red-400 animate-pulse flex-shrink-0" />
              <span className="text-zinc-400">Heard:</span>
              <span className="font-semibold text-white truncate italic">"{interimTranscript}"</span>
            </div>
          )}

          {/* Error Banner */}
          {isError && errorMessage && (
            <div className="mt-4 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-red-950/70 border border-red-800/80 text-xs text-red-300 max-w-md">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <div className="text-left flex-1">
                <span className="font-semibold block">Notice</span>
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={onRequestPermission}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-500 rounded text-xs font-semibold text-white whitespace-nowrap flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Permission Denied Banner */}
          {isPermissionDenied && (
            <div className="mt-4 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-red-950/70 border border-red-800/80 text-xs text-red-300 max-w-md">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <div className="text-left flex-1">
                <span className="font-semibold block">Microphone permission required</span>
                <span>Please allow microphone access in your browser to use voice control.</span>
              </div>
              <button
                onClick={onRequestPermission}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-500 rounded text-xs font-semibold text-white whitespace-nowrap"
              >
                Allow
              </button>
            </div>
          )}

          {/* Unsupported Browser Banner */}
          {isUnsupported && (
            <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-950/70 border border-amber-800/70 text-xs text-amber-200 max-w-md">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="text-left">
                Voice recognition is not supported in this browser. Please use Chrome, Edge, or Brave.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
