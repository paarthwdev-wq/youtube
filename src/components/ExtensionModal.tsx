import React, { useState } from 'react';
import { X, Download, Puzzle, CheckCircle2, AlertTriangle, ExternalLink, RefreshCw, Layers } from 'lucide-react';
import JSZip from 'jszip';
import { ConnectionStatus } from '../types';
import { youtubeBridge } from '../lib/youtubeBridge';

interface ExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection: ConnectionStatus;
}

export const ExtensionModal: React.FC<ExtensionModalProps> = ({ isOpen, onClose, connection }) => {
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);

  if (!isOpen) return null;

  const handleDownloadZip = async () => {
    setIsGeneratingZip(true);
    try {
      const zip = new JSZip();
      const extFolder = zip.folder('voicetube-extension');

      // Fetch all extension files from public/extension/
      const files = [
        'manifest.json',
        'background.js',
        'content-youtube.js',
        'content-bridge.js',
        'popup.html',
        'popup.js',
        'icon16.png',
        'icon48.png',
        'icon128.png',
      ];

      for (const file of files) {
        try {
          const res = await fetch(`/extension/${file}`);
          if (res.ok) {
            if (file.endsWith('.png')) {
              const blob = await res.blob();
              extFolder?.file(file, blob);
            } else {
              const text = await res.text();
              extFolder?.file(file, text);
            }
          }
        } catch (e) {
          console.warn(`Failed to fetch /extension/${file}:`, e);
        }
      }

      // Add a README.txt inside the zip
      extFolder?.file(
        'README.txt',
        `VoiceTube Control - Manifest V3 Chrome Extension
------------------------------------------------
Setup Instructions:
1. Unzip this folder to a local directory (e.g. ~/Downloads/voicetube-extension).
2. Open Google Chrome (or Edge / Brave) and navigate to: chrome://extensions
3. Enable "Developer mode" toggle in the top right corner.
4. Click "Load unpacked" in the top left and select this folder.
5. Open any YouTube video tab (https://youtube.com) and reload it once.
6. Return to VoiceTube Control and speak your commands!`
      );

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'voicetube-chrome-extension.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadDone(true);
    } catch (err) {
      console.error('Error bundling extension ZIP:', err);
    } finally {
      setIsGeneratingZip(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        id="extension-modal"
        className="w-full max-w-xl rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-zinc-100 relative my-8"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
            <Puzzle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              Chrome Extension YouTube Bridge
            </h3>
            <p className="text-xs text-zinc-400">
              Control background YouTube tabs hands-free across your desktop
            </p>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="mb-5 p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                connection.extensionInstalled ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <div>
              <span className="text-xs font-semibold block text-white">
                {connection.extensionInstalled
                  ? 'Extension Connected'
                  : 'Extension Not Detected Yet'}
              </span>
              <span className="text-[11px] text-zinc-400">
                {connection.youtubeTabConnected
                  ? `Active tab: ${connection.activeTabTitle || 'YouTube'}`
                  : 'Open a YouTube video in another tab to link.'}
              </span>
            </div>
          </div>
          <button
            onClick={() => youtubeBridge.pingExtension()}
            className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 transition text-xs flex items-center gap-1"
            title="Check Connection"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Check</span>
          </button>
        </div>

        {/* 3 Steps */}
        <div className="space-y-3 mb-6">
          {/* Step 1 */}
          <div className="p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800/80 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-200 flex items-center justify-center flex-shrink-0 mt-0.5">
              1
            </span>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Download the Extension ZIP
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Download and extract the lightweight Manifest V3 extension package.
              </p>
              <button
                id="btn-download-extension-zip"
                onClick={handleDownloadZip}
                disabled={isGeneratingZip}
                className="mt-2.5 inline-flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:opacity-50 px-3.5 py-1.5 text-xs font-semibold text-white shadow transition"
              >
                <Download className="w-3.5 h-3.5" />
                {isGeneratingZip ? 'Bundling ZIP...' : downloadDone ? 'Download Again (.ZIP)' : 'Download Extension (.ZIP)'}
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800/80 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-200 flex items-center justify-center flex-shrink-0 mt-0.5">
              2
            </span>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Open Extensions in Chrome
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Go to <code className="bg-zinc-800 px-1 py-0.5 rounded text-red-400 font-mono">chrome://extensions</code> in your address bar and enable <strong className="text-zinc-200">Developer mode</strong> (top right toggle).
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800/80 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-200 flex items-center justify-center flex-shrink-0 mt-0.5">
              3
            </span>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Load Unpacked
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Click <strong className="text-zinc-200">Load unpacked</strong> (top left) and select the extracted folder. Reload any open YouTube tab.
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">
            Works on Chrome, Brave, Edge, Opera, and Chromium
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
