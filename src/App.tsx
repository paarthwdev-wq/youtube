import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { MicrophoneControl } from './components/MicrophoneControl';
import { StatusCards } from './components/StatusCards';
import { CurrentPlayerState } from './components/CurrentPlayerState';
import { LastCommandCard } from './components/LastCommandCard';
import { QuickControls } from './components/QuickControls';
import { CommandHistoryTable } from './components/CommandHistoryTable';
import { EmbeddedPlayer } from './components/EmbeddedPlayer';
import { ExtensionModal } from './components/ExtensionModal';
import { SettingsModal } from './components/SettingsModal';

import { SpeechStatus, speechService } from './lib/speechService';
import { youtubeBridge } from './lib/youtubeBridge';
import { parseVoiceCommand } from './lib/commandParser';
import {
  AppSettings,
  CommandExecutionResult,
  CommandIntent,
  ConnectionStatus,
  PlayerState,
} from './types';

export function App() {
  // Application settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('voicetube_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      language: 'all',
      voiceFeedback: true,
      autoListen: false,
      feedbackVolume: 0.8,
    };
  });

  // Speech Recognition state
  const [speechStatus, setSpeechStatus] = useState<SpeechStatus>('idle');
  const [isListening, setIsListening] = useState(false);
  const [soundLevel, setSoundLevel] = useState(0);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  // YouTube / Player & Extension State
  const [playerState, setPlayerState] = useState<PlayerState>(youtubeBridge.getPlayerState());
  const [connection, setConnection] = useState<ConnectionStatus>(youtubeBridge.getConnectionStatus());

  // Command logs & Last command
  const [lastCommand, setLastCommand] = useState<CommandExecutionResult | null>(() => {
    try {
      const saved = localStorage.getItem('voicetube_last_command');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const [commandHistory, setCommandHistory] = useState<CommandExecutionResult[]>(() => {
    try {
      const saved = localStorage.getItem('voicetube_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Modals state
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Subscribe to YouTube state updates
  useEffect(() => {
    const unsubscribe = youtubeBridge.subscribe((newState, newConnection) => {
      setPlayerState({ ...newState });
      setConnection({ ...newConnection });
    });
    return () => unsubscribe();
  }, []);

  // Save settings
  const updateSettings = (newPartial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newPartial };
      try {
        localStorage.setItem('voicetube_settings', JSON.stringify(updated));
      } catch (e) {}
      if (newPartial.language) {
        speechService.setLanguage(newPartial.language);
      }
      return updated;
    });
  };

  // Save history to storage
  const recordCommandResult = useCallback((result: CommandExecutionResult) => {
    setLastCommand(result);
    try {
      localStorage.setItem('voicetube_last_command', JSON.stringify(result));
    } catch (e) {}

    setCommandHistory((prev) => {
      const updated = [result, ...prev.slice(0, 9)];
      try {
        localStorage.setItem('voicetube_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  // Central Command Execution Pipeline
  const handleExecuteVoicePhrase = useCallback(
    async (rawText: string) => {
      if (!rawText.trim()) return;

      const parsed = parseVoiceCommand(rawText);

      if (parsed.intent === 'UNKNOWN') {
        const failedResult: CommandExecutionResult = {
          id: 'cmd_' + Date.now(),
          intent: 'UNKNOWN',
          rawCommand: rawText,
          actionDescription: 'Command not recognized',
          success: false,
          error: 'Unrecognized phrase',
          timestamp: Date.now(),
        };
        recordCommandResult(failedResult);
        return;
      }

      // Execute on YouTube Bridge
      const execResult = await youtubeBridge.executeCommand(parsed);
      recordCommandResult(execResult);

      // Speak audio confirmation if enabled
      if (settings.voiceFeedback && execResult.success) {
        speechService.speakFeedback(execResult.actionDescription);
      }
    },
    [recordCommandResult, settings.voiceFeedback]
  );

  // Keep a ref to the latest handleExecuteVoicePhrase so callbacks are stable
  const executePhraseRef = useRef(handleExecuteVoicePhrase);
  useEffect(() => {
    executePhraseRef.current = handleExecuteVoicePhrase;
  }, [handleExecuteVoicePhrase]);

  // Quick Manual Fallback Handler
  const handleQuickIntent = async (
    intent: CommandIntent,
    value?: number,
    amount?: number,
    label?: string
  ) => {
    const rawText = label || intent.toLowerCase().replace('_', ' ');
    const parsed = {
      intent,
      value,
      amount,
      rawText,
      normalizedText: rawText,
      confidence: 1.0,
    };

    const execResult = await youtubeBridge.executeCommand(parsed);
    recordCommandResult(execResult);

    if (settings.voiceFeedback && execResult.success) {
      speechService.speakFeedback(execResult.actionDescription);
    }
  };

  // Wire Speech Service Callbacks once on mount
  useEffect(() => {
    speechService.setLanguage(settings.language);

    speechService.setCallbacks({
      onStatusChange: (status, err) => {
        setSpeechStatus(status);
        setIsListening(status === 'listening' || status === 'processing');
        if (err) setErrorMessage(err);
        else if (status === 'listening') setErrorMessage(undefined);
      },
      onSoundLevel: (level) => {
        setSoundLevel(level);
      },
      onResult: (transcript, isFinal) => {
        setInterimTranscript(transcript);
        if (isFinal) {
          executePhraseRef.current(transcript);
          // Clear interim after short delay
          setTimeout(() => {
            setInterimTranscript('');
          }, 1200);
        }
      },
    });

    if (settings.autoListen) {
      speechService.startListening();
    }

    return () => {
      speechService.stopListening();
    };
  }, []); // Run only once on mount!

  // Update language dynamically without unmounting the speech loop
  useEffect(() => {
    speechService.setLanguage(settings.language);
  }, [settings.language]);

  // Toggle listening
  const handleToggleListening = () => {
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
      setSpeechStatus('idle');
    } else {
      setErrorMessage(undefined);
      speechService.startListening().then((started) => {
        if (started) {
          setIsListening(true);
        }
      });
    }
  };

  const handleRequestMicPermission = () => {
    setErrorMessage(undefined);
    speechService.startListening().then((started) => {
      if (started) {
        setIsListening(true);
      }
    });
  };

  const handleClearHistory = () => {
    setCommandHistory([]);
    try {
      localStorage.removeItem('voicetube_history');
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-red-500 selection:text-white flex flex-col">
      {/* Header */}
      <Header
        speechStatus={speechStatus}
        connection={connection}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenExtensionModal={() => setIsExtensionModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
        {/* Section 1: Main Large Central Microphone Control */}
        <MicrophoneControl
          isListening={isListening}
          speechStatus={speechStatus}
          soundLevel={soundLevel}
          interimTranscript={interimTranscript}
          errorMessage={errorMessage}
          onToggleListening={handleToggleListening}
          onRequestPermission={handleRequestMicPermission}
        />

        {/* Section 2: Two Status Cards Side by Side */}
        <StatusCards
          speechStatus={speechStatus}
          isListening={isListening}
          connection={connection}
          currentLanguage={settings.language}
          onOpenExtensionGuide={() => setIsExtensionModalOpen(true)}
        />

        {/* Section 3: Current Player State */}
        <CurrentPlayerState
          playerState={playerState}
          onSetSpeed={(spd) => handleQuickIntent('SET_SPEED', spd, undefined, `Speed ${spd}x`)}
          onSetVolume={(vol) => handleQuickIntent('SET_VOLUME', vol, undefined, `Volume ${vol}%`)}
          onToggleMute={() =>
            handleQuickIntent(playerState.muted ? 'UNMUTE' : 'MUTE', undefined, undefined, playerState.muted ? 'Unmute' : 'Mute')
          }
          onTogglePlay={() =>
            handleQuickIntent(
              playerState.playbackState === 'playing' ? 'PAUSE' : 'PLAY',
              undefined,
              undefined,
              playerState.playbackState === 'playing' ? 'Pause' : 'Play'
            )
          }
        />

        {/* Section 4: Last Command Card */}
        <LastCommandCard lastCommand={lastCommand} playerState={playerState} />

        {/* Section 5: Quick Controls (Manual Fallbacks) */}
        <QuickControls onExecuteIntent={handleQuickIntent} />

        {/* Section 6: Interactive Built-in Video Test Stage */}
        <EmbeddedPlayer playerState={playerState} />

        {/* Section 7: Command History (Last 10) */}
        <CommandHistoryTable history={commandHistory} onClearHistory={handleClearHistory} />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950/60 py-4 px-4 sm:px-8 text-center text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Voice Tube Control • Hands-free YouTube voice remote</span>
          <span>Supports English, हिन्दी (Hindi), and Hinglish commands</span>
        </div>
      </footer>

      {/* Modals */}
      <ExtensionModal
        isOpen={isExtensionModalOpen}
        onClose={() => setIsExtensionModalOpen(false)}
        connection={connection}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
        onSimulateCommand={handleExecuteVoicePhrase}
      />
    </div>
  );
}

export default App;
