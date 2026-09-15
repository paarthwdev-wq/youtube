import { VoiceLanguage } from '../types';

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
  private isManualStop = false;
  private pulseInterval: any = null;

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const win = window as any;
    return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
  }

  public isInIframe(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }

  public setLanguage(lang: VoiceLanguage) {
    this.currentLanguage = lang;
  }

  public setCallbacks(callbacks: SpeechCallbacks) {
    this.callbacks = callbacks;
  }

  private getRecognitionLanguage(): string {
    switch (this.currentLanguage) {
      case 'hi':
        return 'hi-IN';
      case 'en':
        return 'en-US';
      case 'hinglish':
      case 'all':
      default:
        return 'hi-IN';
    }
  }

  public async startListening(): Promise<boolean> {
    if (!this.isSupported()) {
      this.callbacks?.onStatusChange(
        'unsupported',
        'Speech recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or a Chromium-based browser.'
      );
      return false;
    }

    this.isManualStop = false;
    this.isListeningRequested = true;
    clearTimeout(this.restartTimeout);

    // Stop any existing instance cleanly
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {}
      this.recognition = null;
    }

    const win = window as unknown as IWindow;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    try {
      this.recognition = new SpeechRec();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 3;
      this.recognition.lang = this.getRecognitionLanguage();

      this.recognition.onstart = () => {
        this.isRecognitionRunning = true;
        if (!this.isSpeakingFeedback) {
          this.callbacks?.onStatusChange('listening');
        }
        this.startPulse();
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

        if (this.callbacks?.onSoundLevel) {
          this.callbacks.onSoundLevel(0.8);
        }

        if (finalTranscript.trim() && this.callbacks) {
          this.callbacks.onResult(finalTranscript.trim(), true);
        } else if (interimTranscript.trim() && this.callbacks) {
          this.callbacks.onResult(interimTranscript.trim(), false);
        }
      };

      this.recognition.onerror = (event: any) => {
        const err = event.error;
        console.warn('[SpeechService] Recognition error:', err);

        if (err === 'not-allowed' || err === 'service-not-allowed') {
          this.isListeningRequested = false;
          this.isRecognitionRunning = false;
          this.stopPulse();
          this.callbacks?.onStatusChange(
            'permission_denied',
            'Microphone access was blocked by the browser. Please check microphone permissions or open in a new standalone tab.'
          );
          return;
        }

        if (err === 'audio-capture') {
          this.isListeningRequested = false;
          this.isRecognitionRunning = false;
          this.stopPulse();
          this.callbacks?.onStatusChange('error', 'No microphone detected or audio capture failed.');
          return;
        }

        if (err === 'network') {
          // In some iframe environments Google speech server throws network error
          this.callbacks?.onStatusChange(
            'error',
            'Speech server connection issue. Please check your internet connection or open the app in a new tab.'
          );
          return;
        }

        // no-speech or aborted are benign timeouts
      };

      this.recognition.onend = () => {
        this.isRecognitionRunning = false;

        if (this.isManualStop || !this.isListeningRequested) {
          this.stopPulse();
          this.callbacks?.onStatusChange('idle');
          return;
        }

        // Restart with safe backoff if still requested
        if (this.isListeningRequested && !this.isSpeakingFeedback) {
          clearTimeout(this.restartTimeout);
          this.restartTimeout = setTimeout(() => {
            if (this.isListeningRequested && !this.isRecognitionRunning && !this.isManualStop) {
              try {
                this.recognition?.start();
              } catch (e: any) {
                // If it fails to restart directly, trigger full startListening
                this.startListening();
              }
            }
          }, 350);
        }
      };

      this.recognition.start();
      this.callbacks?.onStatusChange('listening');
      this.startPulse();
      return true;
    } catch (err: any) {
      console.error('[SpeechService] startListening exception:', err);
      this.isRecognitionRunning = false;

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.isListeningRequested = false;
        this.stopPulse();
        this.callbacks?.onStatusChange(
          'permission_denied',
          'Microphone permission was denied by your browser.'
        );
        return false;
      }

      this.callbacks?.onStatusChange(
        'error',
        'Could not start voice recognition directly. Please open in a new tab or use manual controls.'
      );
      return false;
    }
  }

  public stopListening() {
    this.isManualStop = true;
    this.isListeningRequested = false;
    this.isRecognitionRunning = false;
    clearTimeout(this.restartTimeout);
    this.stopPulse();

    if (this.recognition) {
      try {
        this.recognition.stop();
        this.recognition.abort();
      } catch (e) {}
      this.recognition = null;
    }

    this.callbacks?.onStatusChange('idle');
  }

  public getIsListening(): boolean {
    return this.isListeningRequested;
  }

  private startPulse() {
    this.stopPulse();
    let phase = 0;
    this.pulseInterval = setInterval(() => {
      if (!this.isListeningRequested) {
        this.stopPulse();
        return;
      }
      phase += 0.18;
      const level = 0.2 + Math.sin(phase) * 0.15;
      this.callbacks?.onSoundLevel?.(level);
    }, 80);
  }

  private stopPulse() {
    if (this.pulseInterval) {
      clearInterval(this.pulseInterval);
      this.pulseInterval = null;
    }
    this.callbacks?.onSoundLevel?.(0);
  }

  public speakFeedback(text: string) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 0.85;

      this.isSpeakingFeedback = true;

      const resume = () => {
        setTimeout(() => {
          this.isSpeakingFeedback = false;
          if (this.isListeningRequested && !this.isRecognitionRunning && !this.isManualStop) {
            try {
              this.recognition?.start();
            } catch (e) {}
          }
        }, 200);
      };

      utterance.onend = resume;
      utterance.onerror = resume;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      this.isSpeakingFeedback = false;
    }
  }
}

export const speechService = new SpeechService();
