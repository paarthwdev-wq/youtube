import React, { useState } from 'react';
import { X, Globe, Volume2, Mic, Play, Send, Zap, HelpCircle } from 'lucide-react';
import { AppSettings, CommandIntent, VoiceLanguage } from '../types';
import { parseVoiceCommand } from '../lib/commandParser';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onSimulateCommand: (text: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onSimulateCommand,
}) => {
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testInput.trim()) return;
    const parsed = parseVoiceCommand(testInput);
    if (parsed.intent !== 'UNKNOWN') {
      setTestResult(`✓ Recognized: ${parsed.intent} (val: ${parsed.value ?? 'none'}, amt: ${parsed.amount ?? 'none'})`);
      onSimulateCommand(testInput);
    } else {
      setTestResult(`✗ Unrecognized phrase: "${testInput}"`);
    }
  };

  const samplePhrases = [
    { label: 'Play', phrase: 'चलाओ' },
    { label: 'Pause', phrase: 'रुको' },
    { label: 'Mute', phrase: 'म्यूट' },
    { label: 'Unmute', phrase: 'आवाज चालू करो' },
    { label: 'Volume Up', phrase: 'आवाज बढ़ाओ' },
    { label: 'Volume 70%', phrase: 'आवाज 70 करो' },
    { label: 'Speed 1.5x', phrase: '1.5' },
    { label: 'Speed 2.5x', phrase: '2.5 स्पीड' },
    { label: 'Speed Up', phrase: 'speed थोड़ी बढ़ाओ' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        id="settings-modal"
        className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-zinc-100 relative my-8 max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          aria-label="Close Settings"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <h3 className="text-base sm:text-lg font-bold text-white mb-1">
          Settings & Command Simulator
        </h3>
        <p className="text-xs text-zinc-400 mb-5">
          Configure recognition language, audio feedback, and test voice phrases.
        </p>

        <div className="space-y-5">
          {/* 1. Language Preference */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5 mb-2">
              <Globe className="w-3.5 h-3.5 text-red-500" />
              <span>Voice Recognition Language</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'all', label: 'Hindi & English (Auto)' },
                { id: 'hi', label: 'हिन्दी (Hindi)' },
                { id: 'hinglish', label: 'Hinglish (Colloquial)' },
                { id: 'en', label: 'English (US)' },
              ].map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => onUpdateSettings({ language: lang.id as VoiceLanguage })}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-left transition ${
                    settings.language === lang.id
                      ? 'border-red-500 bg-red-950/40 text-white font-bold'
                      : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Toggles */}
          <div className="space-y-3 pt-3 border-t border-zinc-800">
            {/* Audio Feedback */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
              <div className="flex items-center gap-2.5">
                <Volume2 className="w-4 h-4 text-zinc-400" />
                <div>
                  <span className="text-xs font-semibold text-white block">
                    Spoken Audio Confirmation
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Voice speaks brief confirmation after executing commands
                  </span>
                </div>
              </div>
              <button
                onClick={() => onUpdateSettings({ voiceFeedback: !settings.voiceFeedback })}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  settings.voiceFeedback ? 'bg-red-600' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    settings.voiceFeedback ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Auto Start Listening */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
              <div className="flex items-center gap-2.5">
                <Mic className="w-4 h-4 text-zinc-400" />
                <div>
                  <span className="text-xs font-semibold text-white block">
                    Continuous Listening Mode
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Auto-restarts voice recognition seamlessly across pauses
                  </span>
                </div>
              </div>
              <button
                onClick={() => onUpdateSettings({ autoListen: !settings.autoListen })}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  settings.autoListen ? 'bg-red-600' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    settings.autoListen ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 3. Live Command Simulator */}
          <div className="pt-3 border-t border-zinc-800">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5 mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Voice Command Simulator</span>
            </label>
            <p className="text-[11px] text-zinc-400 mb-2">
              Type or tap any voice phrase to simulate recognition instantly:
            </p>

            <form onSubmit={handleTestSubmit} className="flex gap-2 mb-2">
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder='e.g. "2.5 स्पीड" or "volume up"'
                className="flex-1 rounded-xl bg-zinc-950 border border-zinc-700 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white transition flex items-center gap-1"
              >
                <Send className="w-3 h-3" />
                <span>Test</span>
              </button>
            </form>

            {testResult && (
              <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300 font-mono mb-2">
                {testResult}
              </div>
            )}

            {/* Quick Sample Clickers */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {samplePhrases.map((item) => (
                <button
                  key={item.phrase}
                  type="button"
                  onClick={() => {
                    setTestInput(item.phrase);
                    onSimulateCommand(item.phrase);
                  }}
                  className="px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-[11px] text-zinc-300 hover:text-white transition"
                >
                  "{item.phrase}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
};
