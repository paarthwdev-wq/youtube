export type CommandIntent =
  | 'PLAY'
  | 'PAUSE'
  | 'MUTE'
  | 'UNMUTE'
  | 'VOLUME_UP'
  | 'VOLUME_DOWN'
  | 'SET_VOLUME'
  | 'SPEED_UP'
  | 'SPEED_DOWN'
  | 'SET_SPEED'
  | 'UNKNOWN';

export interface ParsedCommand {
  intent: CommandIntent;
  rawText: string;
  normalizedText: string;
  value?: number;
  amount?: number;
  confidence?: number;
}

export interface CommandExecutionResult {
  id: string;
  intent: CommandIntent;
  rawCommand: string;
  actionDescription: string;
  success: boolean;
  error?: string;
  timestamp: number;
  resultingState?: Partial<PlayerState>;
}

export interface PlayerState {
  detected: boolean;
  playbackState: 'playing' | 'paused' | 'buffering' | 'none';
  volume: number; // 0 - 100
  muted: boolean;
  playbackRate: number; // 0.25 to 4.0
  currentTime: number;
  duration: number;
  videoTitle: string;
  source: 'extension' | 'embedded' | 'disconnected';
  lastUpdated: number;
}

export interface ConnectionStatus {
  systemReady: boolean;
  extensionInstalled: boolean;
  youtubeTabConnected: boolean;
  playerDetected: boolean;
  youtubeTabCount: number;
  activeTabTitle?: string;
  activeMode: 'extension' | 'embedded';
}

export type VoiceLanguage = 'all' | 'hi' | 'en' | 'hinglish';

export interface AppSettings {
  language: VoiceLanguage;
  voiceFeedback: boolean;
  autoListening: boolean;
  showEmbeddedPlayer: boolean;
}

export interface HistoryItem {
  id: string;
  time: string;
  voiceCommand: string;
  action: string;
  status: 'success' | 'failed' | 'ignored';
  resultingValue?: string;
}
