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

  // Loop & crash prevention
  private consecutiveErrors = 0;
  private lastStartTime = 0;
  private isManualStop = false;

  constructor() {
    this.initRecognition();
  }

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const win = window as any;
    return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;
    const win = window as unknown as IWindow;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRec) {
      return;
    }

    try {
      if (this.recognition) {
        try {
          this.recognition.abort();
        } catch (e) {}
        this.recognition = null;
      }

      this.recognition = new SpeechRec();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 3;

      this.updateRecognitionLanguage();

      this.recognition.onstart = () => {
        this.isRecognitionRunning = true;
        this.lastStartTime = Date.now();
        // Reset error count if it starts successfully
        if (this.consecutiveErrors > 0) {
          this.consecutiveErrors = 0;
        }

        if (this.callbacks && !this.isSpeakingFeedback) {
          this.callbacks.onStatusChange('listening');
        }
        this.startVisualPulse();
      };

      this.recognition.onresult = (event: any) => {
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

        // Brief spike in visual pulse when audio/speech is recognized
        if (this.callbacks?.onSoundLevel) {
          this.callbacks.onSoundLevel(0.85);
        }

        if (finalTranscript.trim() && this.callbacks) {
          this.callbacks.onResult(finalTranscript.trim(), true);
        } else if (interimTranscript.trim() && this.callbacks) {
          this.callbacks.onResult(interimTranscript.trim(), false);
        }
      };

      this.recognition.onerror = (event: any) => {
        const error = event.error;
        const now = Date.now();
        const runDuration = now - this.lastStartTime;
        console.warn(`[SpeechService] Error: "${error}" after ${runDuration}ms`);

        // Critical permissions or audio block errors -> STOP loop immediately
        if (
          error === 'not-allowed' ||
          error === 'service-not-allowed' ||
          error === 'audio-capture'
        ) {
          this.isListeningRequested = false;
          this.isRecognitionRunning = false;
          this.stopVisualPulse();
          if (this.callbacks) {
            this.callbacks.onStatusChange(
              'permission_denied',
              error === 'audio-capture'
                ? 'Microphone is unavailable or being used by another application.'
                : 'Microphone permission was denied. Please allow microphone access in your browser settings.'
            );
          }
          return;
        }

        // Normal silent lifecycle events
        if (error === 'no-speech' || error === 'aborted') {
          // Normal timeout by browser when no one speaks for a while.
          return;
        }

        // Network or other speech service error
        this.consecutiveErrors++;

        if (this.consecutiveErrors >= 3) {
          // Stop tight loop and inform user gracefully
          this.isListeningRequested = false;
          this.isRecognitionRunning = false;
          this.stopVisualPulse();
          if (this.callbacks) {
            this.callbacks.onStatusChange(
              'error',
              error === 'network'
                ? 'Speech recognition service is unreachable (network error). Please check your internet connection or try again.'
                : `Speech recognition error: ${error}`
            );
          }
        }
      };

      this.recognition.onend = () => {
        this.isRecognitionRunning = false;

        if (this.isManualStop || !this.isListeningRequested) {
          this.stopVisualPulse();
          if (this.callbacks) {
            this.callbacks.onStatusChange('idle');
          }
          return;
        }

        // If listening is requested, schedule a safe throttled restart
        if (this.isListeningRequested && !this.isSpeakingFeedback) {
          // If errors happened, back off gracefully (800ms - 2000ms) to prevent rapid start/stop flickering
          const delay = this.consecutiveErrors > 0 ? Math.min(2000, 600 * this.consecutiveErrors) : 400;
          this.scheduleRestart(delay);
        }
      };
    } catch (e) {
      console.error('[SpeechService] Initialization error:', e);
    }
  }

  private scheduleRestart(delayMs = 400) {
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
          if (!this.recognition) {
            this.initRecognition();
          }
          this.recognition?.start();
        } catch (e: any) {
          if (e.name !== 'InvalidStateError') {
            console.warn('[SpeechService] Safe restart attempt info:', e);
          }
        }
      }
    }, delayMs);
  }

  private updateRecognitionLanguage() {
    if (!this.recognition) return;
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

  public setLanguage(lang: VoiceLanguage) {
    this.currentLanguage = lang;
    this.updateRecognitionLanguage();
    if (this.isListeningRequested && this.recognition && this.isRecognitionRunning) {
      try {
        this.recognition.stop();
      } catch (e) {}
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
          'Voice recognition is not supported in this browser. Please use Chrome, Edge, or a Chromium-based browser.'
        );
      }
      return false;
    }

    this.isManualStop = false;
    this.isListeningRequested = true;
    this.consecutiveErrors = 0;
    clearTimeout(this.restartTimeout);

    if (!this.recognition) {
      this.initRecognition();
    }

    if (!this.isRecognitionRunning) {
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
        console.warn('[SpeechService] Start listening fallback:', err);
        this.scheduleRestart(500);
        return true;
      }
    } else {
      if (this.callbacks) {
        this.callbacks.onStatusChange('listening');
      }
      this.startVisualPulse();
      return true;
    }
  }

  public stopListening() {
    this.isManualStop = true;
    this.isListeningRequested = false;
    this.consecutiveErrors = 0;
    clearTimeout(this.restartTimeout);

    this.stopVisualPulse();

    if (this.recognition && this.isRecognitionRunning) {
      try {
        this.recognition.stop();
      } catch (e) {}
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
      phase += 0.15;
      const level = 0.25 + Math.sin(phase) * 0.15;
      if (this.callbacks?.onSoundLevel) {
        this.callbacks.onSoundLevel(level);
      }
    }, 80);
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
