import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed, hide the button
  if (isInstalled) {
    return (
      <div id="pwa-installed-badge" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-xs text-zinc-400 font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        Installed Desktop App
      </div>
    );
  }

  // Chromium / Desktop flow
  if (isInstallable) {
    return (
      <button
        id="pwa-install-btn"
        onClick={install}
        className="inline-flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-500 active:bg-red-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-500/40"
      >
        <Download className="w-3.5 h-3.5" />
        Install App
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          id="pwa-install-ios-btn"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/90 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition"
        >
          <Smartphone className="w-3.5 h-3.5 text-red-400" />
          Install App
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-zinc-100 relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-semibold text-white">Install VoiceTube Control</h3>
              <p className="mt-3 text-xs leading-relaxed text-zinc-300">
                1. Tap the <strong className="text-white">Share</strong> icon in the Safari toolbar.<br />
                2. Scroll down and select <strong className="text-white">Add to Home Screen</strong>.<br />
                3. Open VoiceTube Control from your home screen.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-zinc-800 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Default desktop manual install tip
  return (
    <button
      id="pwa-install-guide-btn"
      onClick={() => {
        alert('To install VoiceTube Control:\n1. Click the Install icon (⊕ or computer icon) in your browser address bar.\n2. Or click the 3-dot browser menu > "Cast, save, and share" > "Install Voice Tube Control".');
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700/80 bg-zinc-800/80 hover:bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition"
    >
      <Download className="w-3.5 h-3.5 text-zinc-400" />
      Install Desktop App
    </button>
  );
};
