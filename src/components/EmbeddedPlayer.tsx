import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Zap, MonitorPlay, Maximize2 } from 'lucide-react';
import { PlayerState } from '../types';
import { youtubeBridge } from '../lib/youtubeBridge';

interface EmbeddedPlayerProps {
  playerState: PlayerState;
  onStateUpdate?: () => void;
}

export const EmbeddedPlayer: React.FC<EmbeddedPlayerProps> = ({ playerState }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      youtubeBridge.registerEmbeddedVideo(videoRef.current);
    }
    return () => {
      youtubeBridge.registerEmbeddedVideo(null);
    };
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      id="interactive-player-preview"
      className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6 shadow-xl"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MonitorPlay className="w-4 h-4 text-red-500" />
          <h2 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-zinc-300">
            Interactive Video Test Stage
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800/40">
            Real Audio & Speed Responsive
          </span>
        </div>
      </div>

      <p className="text-xs text-zinc-400 mb-3">
        Test all voice commands locally (Play, Pause, Mute, Volume, Speed 0.25x – 3.0x). When the Chrome Extension is linked, external YouTube tabs take precedence automatically.
      </p>

      {/* Video Container */}
      <div
        className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-zinc-800 group shadow-2xl"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <video
          ref={videoRef}
          src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
          playsInline
          loop
          className="w-full h-full object-cover"
        />

        {/* Big Center Play/Pause indicator overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {playerState.playbackState === 'paused' && (
            <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg animate-pulse">
              <Pause className="w-6 h-6 fill-white" />
            </div>
          )}
        </div>

        {/* Live HUD Badges on top of video */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-bold text-amber-400 font-mono shadow">
              ⚡ {playerState.playbackRate}x
            </span>
            <span className="px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-medium text-white shadow flex items-center gap-1">
              {playerState.muted ? (
                <>
                  <VolumeX className="w-3 h-3 text-red-400" /> Muted
                </>
              ) : (
                <>
                  <Volume2 className="w-3 h-3 text-emerald-400" /> {playerState.volume}%
                </>
              )}
            </span>
          </div>

          <span
            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
              playerState.playbackState === 'playing'
                ? 'bg-emerald-500/80 text-white'
                : 'bg-zinc-800/80 text-zinc-300'
            }`}
          >
            {playerState.playbackState === 'playing' ? 'LIVE' : 'PAUSED'}
          </span>
        </div>

        {/* Bottom Control Bar Overlay */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 flex items-center justify-between text-xs text-white">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (videoRef.current) {
                  if (videoRef.current.paused) videoRef.current.play();
                  else videoRef.current.pause();
                }
              }}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
              aria-label="Toggle Play/Pause"
            >
              {playerState.playbackState === 'playing' ? (
                <Pause className="w-4 h-4 fill-white" />
              ) : (
                <Play className="w-4 h-4 fill-white" />
              )}
            </button>

            <span className="font-mono text-[11px] text-zinc-300">
              {formatTime(playerState.currentTime)} / {formatTime(playerState.duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.muted = !videoRef.current.muted;
                }
              }}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
              aria-label="Toggle Mute"
            >
              {playerState.muted ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>

            <button
              onClick={() => {
                if (videoRef.current) {
                  if (document.fullscreenElement) {
                    document.exitFullscreen();
                  } else {
                    videoRef.current.requestFullscreen();
                  }
                }
              }}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
              aria-label="Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5 text-zinc-300" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
