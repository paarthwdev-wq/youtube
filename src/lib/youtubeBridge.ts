import { CommandExecutionResult, ConnectionStatus, ParsedCommand, PlayerState } from '../types';

export type StateListener = (state: PlayerState, connection: ConnectionStatus) => void;

class YouTubeBridge {
  private playerState: PlayerState = {
    detected: false,
    playbackState: 'none',
    volume: 80,
    muted: false,
    playbackRate: 1.0,
    currentTime: 0,
    duration: 180,
    videoTitle: 'No video playing',
    source: 'disconnected',
    lastUpdated: Date.now()
  };

  private connectionStatus: ConnectionStatus = {
    systemReady: true,
    extensionInstalled: false,
    youtubeTabConnected: false,
    playerDetected: false,
    youtubeTabCount: 0,
    activeMode: 'embedded'
  };

  private listeners: Set<StateListener> = new Set();
  private pendingRequests = new Map<string, { resolve: (res: any) => void; reject: (err: any) => void; timer: any }>();
  private embeddedVideoElement: HTMLVideoElement | null = null;
  private pingInterval: any = null;

  constructor() {
    this.initMessageBridge();
    this.startHeartbeat();
  }

  private initMessageBridge() {
    if (typeof window === 'undefined') return;

    window.addEventListener('message', (event) => {
      if (!event.data || typeof event.data !== 'object') return;

      const { type, installed, youtubeConnected, youtubeTabCount, playerState, tabTitle, requestId, result } = event.data;

      // Extension response
      if (type === 'VOICETUBE_EXTENSION_PONG' || type === 'VOICETUBE_EXTENSION_STATUS') {
        const wasInstalled = this.connectionStatus.extensionInstalled;
        this.connectionStatus.extensionInstalled = Boolean(installed);
        this.connectionStatus.youtubeTabConnected = Boolean(youtubeConnected);
        this.connectionStatus.youtubeTabCount = youtubeTabCount || 0;
        if (tabTitle) this.connectionStatus.activeTabTitle = tabTitle;

        if (playerState) {
          this.playerState = {
            ...this.playerState,
            ...playerState,
            detected: Boolean(youtubeConnected),
            source: youtubeConnected ? 'extension' : (this.embeddedVideoElement ? 'embedded' : 'disconnected'),
            lastUpdated: Date.now()
          };
          this.connectionStatus.playerDetected = Boolean(this.playerState.detected);
        }

        if (youtubeConnected) {
          this.connectionStatus.activeMode = 'extension';
        }

        this.notifyListeners();
      }

      if (type === 'VOICETUBE_STATE_UPDATE') {
        if (event.data.state) {
          this.playerState = {
            ...this.playerState,
            ...event.data.state,
            detected: true,
            source: 'extension',
            lastUpdated: Date.now()
          };
          this.connectionStatus.playerDetected = true;
          this.connectionStatus.youtubeTabConnected = true;
          this.notifyListeners();
        }
      }

      if (type === 'VOICETUBE_COMMAND_RESULT' && requestId) {
        const pending = this.pendingRequests.get(requestId);
        if (pending) {
          clearTimeout(pending.timer);
          this.pendingRequests.delete(requestId);
          pending.resolve(result);
        }
      }
    });

    // Custom event listener from content script
    window.addEventListener('voicetube:extension-ready', () => {
      this.connectionStatus.extensionInstalled = true;
      this.notifyListeners();
      this.pingExtension();
    });
  }

  private startHeartbeat() {
    if (typeof window === 'undefined') return;
    this.pingExtension();
    this.pingInterval = setInterval(() => {
      this.pingExtension();
    }, 2500);
  }

  public pingExtension() {
    if (typeof window === 'undefined') return;
    window.postMessage({ type: 'VOICETUBE_EXTENSION_PING' }, '*');
  }

  public registerEmbeddedVideo(video: HTMLVideoElement | null) {
    this.embeddedVideoElement = video;
    if (video) {
      this.syncEmbeddedState();
      video.onplay = () => this.syncEmbeddedState();
      video.onpause = () => this.syncEmbeddedState();
      video.onvolumechange = () => this.syncEmbeddedState();
      video.onratechange = () => this.syncEmbeddedState();
      video.ontimeupdate = () => {
        this.playerState.currentTime = Math.round(video.currentTime);
        this.playerState.duration = Math.round(video.duration || 0);
      };
    }
  }

  public syncEmbeddedState() {
    if (!this.embeddedVideoElement) return;
    const v = this.embeddedVideoElement;
    // If not currently receiving extension live state, use embedded video state
    if (!this.connectionStatus.youtubeTabConnected) {
      this.playerState = {
        detected: true,
        playbackState: v.paused ? 'paused' : 'playing',
        volume: Math.round(v.volume * 100),
        muted: v.muted,
        playbackRate: v.playbackRate,
        currentTime: Math.round(v.currentTime),
        duration: Math.round(v.duration || 180),
        videoTitle: 'VoiceTube Live Interactive Video Demo',
        source: 'embedded',
        lastUpdated: Date.now()
      };
      this.connectionStatus.playerDetected = true;
      this.notifyListeners();
    }
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.playerState, this.connectionStatus);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(l => l(this.playerState, this.connectionStatus));
  }

  public getPlayerState(): PlayerState {
    return this.playerState;
  }

  public getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Executes a parsed command across the active target (Extension tab or Embedded player).
   */
  public async executeCommand(parsed: ParsedCommand): Promise<CommandExecutionResult> {
    const { intent, value, amount, rawText } = parsed;
    const cmdId = 'cmd_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    // If extension is connected to external YouTube tab, route to extension!
    if (this.connectionStatus.extensionInstalled && this.connectionStatus.youtubeTabConnected) {
      try {
        const extResult = await this.sendToExtension({ intent, value, amount });
        if (extResult && extResult.success) {
          if (extResult.state) {
            this.playerState = {
              ...this.playerState,
              ...extResult.state,
              detected: true,
              source: 'extension',
              lastUpdated: Date.now()
            };
            this.notifyListeners();
          }
          return {
            id: cmdId,
            intent,
            rawCommand: rawText,
            actionDescription: extResult.action || this.describeAction(intent, value, amount),
            success: true,
            timestamp: Date.now(),
            resultingState: this.playerState
          };
        } else {
          return {
            id: cmdId,
            intent,
            rawCommand: rawText,
            actionDescription: extResult?.error || 'Command execution failed on YouTube tab.',
            success: false,
            error: extResult?.error || 'YouTube tab execution error',
            timestamp: Date.now()
          };
        }
      } catch (err: any) {
        // Fall back to embedded if available
        console.warn('[YouTubeBridge] Extension communication error, falling back:', err);
      }
    }

    // Otherwise, execute on Embedded player
    if (this.embeddedVideoElement) {
      const result = this.executeOnEmbedded(parsed);
      return {
        id: cmdId,
        intent,
        rawCommand: rawText,
        actionDescription: result.action,
        success: result.success,
        error: result.error,
        timestamp: Date.now(),
        resultingState: this.playerState
      };
    }

    // No target connected
    return {
      id: cmdId,
      intent,
      rawCommand: rawText,
      actionDescription: 'No YouTube player or extension connected.',
      success: false,
      error: 'Extension not installed and embedded player not active.',
      timestamp: Date.now()
    };
  }

  private sendToExtension(payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestId = 'req_' + Math.random().toString(36).substring(2, 9);
      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Extension timeout'));
      }, 3000);

      this.pendingRequests.set(requestId, { resolve, reject, timer });
      window.postMessage({
        type: 'VOICETUBE_EXECUTE_COMMAND',
        requestId,
        payload
      }, '*');
    });
  }

  private executeOnEmbedded(parsed: ParsedCommand): { success: boolean; action: string; error?: string } {
    const v = this.embeddedVideoElement;
    if (!v) {
      return { success: false, action: 'Player not found', error: 'No video element' };
    }

    const { intent, value, amount } = parsed;

    switch (intent) {
      case 'PLAY':
        v.play().catch(() => {});
        this.syncEmbeddedState();
        return { success: true, action: 'YouTube playing' };

      case 'PAUSE':
        v.pause();
        this.syncEmbeddedState();
        return { success: true, action: 'YouTube paused' };

      case 'MUTE':
        v.muted = true;
        this.syncEmbeddedState();
        return { success: true, action: 'YouTube muted' };

      case 'UNMUTE':
        v.muted = false;
        if (v.volume === 0) v.volume = 0.5;
        this.syncEmbeddedState();
        return { success: true, action: 'YouTube unmuted' };

      case 'VOLUME_UP': {
        const step = (amount !== undefined ? amount : 10) / 100;
        const newVol = Math.min(1.0, Math.max(0, v.volume + step));
        v.volume = Number(newVol.toFixed(2));
        if (v.muted) v.muted = false;
        this.syncEmbeddedState();
        return { success: true, action: `Volume increased to ${Math.round(v.volume * 100)}%` };
      }

      case 'VOLUME_DOWN': {
        const step = (amount !== undefined ? amount : 10) / 100;
        const newVol = Math.max(0, v.volume - step);
        v.volume = Number(newVol.toFixed(2));
        this.syncEmbeddedState();
        return { success: true, action: `Volume decreased to ${Math.round(v.volume * 100)}%` };
      }

      case 'SET_VOLUME': {
        const target = Math.min(100, Math.max(0, Number(value)));
        v.volume = target / 100;
        if (v.muted && target > 0) v.muted = false;
        this.syncEmbeddedState();
        return { success: true, action: `Volume set to ${target}%` };
      }

      case 'SPEED_UP': {
        const step = amount !== undefined ? amount : 0.25;
        const currentSpeed = v.playbackRate || 1.0;
        const newSpeed = Number((currentSpeed + step).toFixed(2));
        if (newSpeed > 4.0) {
          return {
            success: false,
            action: 'Speed limit reached',
            error: 'Maximum playback speed is 4.0x'
          };
        }
        v.playbackRate = newSpeed;
        this.syncEmbeddedState();
        return { success: true, action: `Speed increased to ${newSpeed}x` };
      }

      case 'SPEED_DOWN': {
        const step = amount !== undefined ? amount : 0.25;
        const currentSpeed = v.playbackRate || 1.0;
        const newSpeed = Number(Math.max(0.25, currentSpeed - step).toFixed(2));
        v.playbackRate = newSpeed;
        this.syncEmbeddedState();
        return { success: true, action: `Speed decreased to ${newSpeed}x` };
      }

      case 'SET_SPEED': {
        const targetSpeed = Number(value);
        if (isNaN(targetSpeed) || targetSpeed < 0.1 || targetSpeed > 4.0) {
          return {
            success: false,
            action: 'Unsupported speed',
            error: `${targetSpeed}x is not supported by this player.`
          };
        }
        v.playbackRate = targetSpeed;
        this.syncEmbeddedState();
        return { success: true, action: `Playback speed set to ${targetSpeed}x` };
      }

      default:
        return { success: false, action: 'Command not recognized', error: 'Unknown intent' };
    }
  }

  private describeAction(intent: string, value?: number, amount?: number): string {
    switch (intent) {
      case 'PLAY': return 'YouTube playing';
      case 'PAUSE': return 'YouTube paused';
      case 'MUTE': return 'YouTube muted';
      case 'UNMUTE': return 'YouTube unmuted';
      case 'VOLUME_UP': return `Volume increased (+${amount || 10}%)`;
      case 'VOLUME_DOWN': return `Volume decreased (-${amount || 10}%)`;
      case 'SET_VOLUME': return `Volume set to ${value}%`;
      case 'SPEED_UP': return `Speed increased (+${amount || 0.25}x)`;
      case 'SPEED_DOWN': return `Speed decreased (-${amount || 0.25}x)`;
      case 'SET_SPEED': return `Playback speed set to ${value}x`;
      default: return 'Action executed';
    }
  }
}

export const youtubeBridge = new YouTubeBridge();
