import { VoiceLanguage } from '../types';

// Web Speech API Types
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export type SpeechStatus =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'permission_denied'
  | 'unsupported'
  | 'error';

export interface SpeechCallbacks {
  onResult: (transcript: string, isFinal: boolean) => void;
  onStatusChange: (status: SpeechStatus, errorMessage?: string) => void;
  onSoundLevel?: (level: number) => void;
}

export class SpeechService {
  private recognition: any = null;
  private isListeningRequested = false;
  private isRecognitionRunning = false;
  private currentLanguage: VoiceLanguage = 'all';
  private callbacks: SpeechCallbacks | null = null;
  private restartTimeout: any = null;
  private isSpeakingFeedback = false;

  // Visual pulsation animation
  private animationInterval: any = null;
  private isManualStop = false;

  constructor() {
    // Lazy initialized on first user interaction for maximum browser compliance
  }

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const win = window as any;
    return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
  }

  private createRecognitionInstance(): any {
    if (typeof window === 'undefined') return null;
    const win = window as unknown as IWindow;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRec) {
      return null;
    }

    try {
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 3;

      // Language configuration
      switch (this.currentLanguage) {
        case 'hi':
          rec.lang = 'hi-IN';
          break;
        case 'en':
          rec.lang = 'en-US';
          break;
        case 'hinglish':
        case 'all':
        default:
          rec.lang = 'hi-IN';
          break;
      }

      rec.onstart = () => {
        this.isRecognitionRunning = true;
        if (this.callbacks && !this.isSpeakingFeedback) {
          this.callbacks.onStatusChange('listening');
        }
        this.startVisualPulse();
      };

      rec.onresult = (event: any) => {
        if (this.isSpeakingFeedback) return;

        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          const text = res[0].transcript;
          if (res.isFinal) {
            finalTranscript += text + ' ';
          } else {
            interimTranscript += text;
          }
        }

        // Pulse sound level when speech is received
        if (this.callbacks?.onSoundLevel) {
          this.callbacks.onSoundLevel(0.85);
        }

        if (finalTranscript.trim() && this.callbacks) {
          this.callbacks.onResult(finalTranscript.trim(), true);
        } else if (interimTranscript.trim() && this.callbacks) {
          this.callbacks.onResult(interimTranscript.trim(), false);
        }
      };

      rec.onerror = (event: any) => {
        const error = event.error;
        console.warn('[SpeechService] Event error:', error);

        if (error === 'not-allowed' || error === 'service-not-allowed') {
          this.isListeningRequested = false;
          this.isRecognitionRunning = false;
          this.stopVisualPulse();
          if (this.callbacks) {
            this.callbacks.onStatusChange(
              'permission_denied',
              'Microphone permission was blocked. Please click the lock/camera icon in your browser address bar and set Microphone to Allow, or open the app in a new tab.'
            );
          }
          return;
        }

        if (error === 'no-speech' || error === 'aborted') {
          // Normal lifecycle timeouts in speech API
          return;
        }

        // For transient errors, do not immediately kill requested status; onend will restart gracefully
      };

      rec.onend = () => {
        this.isRecognitionRunning = false;

        if (this.isManualStop || !this.isListeningRequested) {
          this.stopVisualPulse();
          if (this.callbacks) {
            this.callbacks.onStatusChange('idle');
          }
          return;
        }

        // Continuous listening: restart cleanly if still requested
        if (this.isListeningRequested && !this.isSpeakingFeedback) {
          this.scheduleRestart(350);
        }
      };

      return rec;
    } catch (e) {
      console.error('[SpeechService] Failed to construct SpeechRecognition:', e);
      return null;
    }
  }

  private scheduleRestart(delayMs = 350) {
    if (!this.isListeningRequested || this.isSpeakingFeedback || this.isManualStop) return;
    clearTimeout(this.restartTimeout);

    this.restartTimeout = setTimeout(() => {
      if (
        this.isListeningRequested &&
        !this.isSpeakingFeedback &&
        !this.isRecognitionRunning &&
        !this.isManualStop
      ) {
        try {
          // Re-instantiate recognition for fresh connection on every cycle
          this.recognition = this.createRecognitionInstance();
          this.recognition?.start();
        } catch (e: any) {
          if (e.name !== 'InvalidStateError') {
            console.warn('[SpeechService] Restart info:', e);
          }
        }
      }
    }, delayMs);
  }

  public setLanguage(lang: VoiceLanguage) {
    this.currentLanguage = lang;
    if (this.recognition) {
      switch (this.currentLanguage) {
        case 'hi':
          this.recognition.lang = 'hi-IN';
          break;
        case 'en':
          this.recognition.lang = 'en-US';
          break;
        case 'hinglish':
        case 'all':
        default:
          this.recognition.lang = 'hi-IN';
          break;
      }
    }
  }

  public setCallbacks(callbacks: SpeechCallbacks) {
    this.callbacks = callbacks;
  }

  public async startListening(): Promise<boolean> {
    if (!this.isSupported()) {
      if (this.callbacks) {
        this.callbacks.onStatusChange(
          'unsupported',
          'Speech recognition is not supported in this browser. Please use Chrome, Edge, or a Chromium-based browser.'
        );
      }
      return false;
    }

    this.isManualStop = false;
    this.isListeningRequested = true;
    clearTimeout(this.restartTimeout);

    // Prompt user for browser microphone permission explicitly first if needed
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Permission successfully granted! Release this audio stream so SpeechRecognition has sole ownership
        stream.getTracks().forEach((track) => track.stop());
      } catch (err: any) {
        console.warn('[SpeechService] getUserMedia permission check returned:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          this.isListeningRequested = false;
          this.isRecognitionRunning = false;
          this.stopVisualPulse();
          if (this.callbacks) {
            this.callbacks.onStatusChange(
              'permission_denied',
              'Microphone permission was denied. Please allow microphone access in your browser.'
            );
          }
          return false;
        }
      }
    }

    // Abort old instance if any
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {}
      this.recognition = null;
    }

    this.recognition = this.createRecognitionInstance();

    if (!this.recognition) {
      if (this.callbacks) {
        this.callbacks.onStatusChange('unsupported', 'Failed to initialize speech recognition.');
      }
      return false;
    }

    try {
      this.recognition.start();
      if (this.callbacks) {
        this.callbacks.onStatusChange('listening');
      }
      this.startVisualPulse();
      return true;
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.isListeningRequested = false;
        this.stopVisualPulse();
        if (this.callbacks) {
          this.callbacks.onStatusChange('permission_denied', 'Microphone permission was denied.');
        }
        return false;
      }
      if (err.message && err.message.includes('already started')) {
        this.isRecognitionRunning = true;
        if (this.callbacks) {
          this.callbacks.onStatusChange('listening');
        }
        this.startVisualPulse();
        return true;
      }
      console.warn('[SpeechService] start() attempt notice:', err);
      this.scheduleRestart(400);
      return true;
    }
  }

  public stopListening() {
    this.isManualStop = true;
    this.isListeningRequested = false;
    this.isRecognitionRunning = false;
    clearTimeout(this.restartTimeout);

    this.stopVisualPulse();

    if (this.recognition) {
      try {
        this.recognition.stop();
        this.recognition.abort();
      } catch (e) {}
      this.recognition = null;
    }

    if (this.callbacks) {
      this.callbacks.onStatusChange('idle');
    }
  }

  public getIsListening(): boolean {
    return this.isListeningRequested;
  }

  // Smooth ambient breathing visual level animation
  private startVisualPulse() {
    this.stopVisualPulse();
    let phase = 0;
    this.animationInterval = setInterval(() => {
      if (!this.isListeningRequested) {
        this.stopVisualPulse();
        return;
      }
      phase += 0.18;
      const level = 0.22 + Math.sin(phase) * 0.16;
      if (this.callbacks?.onSoundLevel) {
        this.callbacks.onSoundLevel(level);
      }
    }, 75);
  }

  private stopVisualPulse() {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }
    if (this.callbacks?.onSoundLevel) {
      this.callbacks.onSoundLevel(0);
    }
  }

  // Voice Feedback via SpeechSynthesis
  public speakFeedback(text: string) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 0.85;

      this.isSpeakingFeedback = true;

      const resumeRecognitionAfterSpeech = () => {
        setTimeout(() => {
          this.isSpeakingFeedback = false;
          if (this.isListeningRequested && !this.isRecognitionRunning && !this.isManualStop) {
            this.scheduleRestart(250);
          }
        }, 200);
      };

      utterance.onend = () => {
        resumeRecognitionAfterSpeech();
      };

      utterance.onerror = () => {
        resumeRecognitionAfterSpeech();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      this.isSpeakingFeedback = false;
      if (this.isListeningRequested && !this.isRecognitionRunning && !this.isManualStop) {
        this.scheduleRestart(250);
      }
    }
  }
}

export const speechService = new SpeechService();
