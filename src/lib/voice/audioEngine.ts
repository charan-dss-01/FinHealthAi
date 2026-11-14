/**
 * FinHealth AI — Real-time Web Audio Engine
 * Combines MediaRecorder (raw mic audio capture for server STT)
 * with AnalyserNode (60fps visualizer) and Web Speech API (live captions).
 */

export interface AudioEngineCallbacks {
  onAudioEnergy?: (level: number) => void;
  onListeningStateChange?: (isListening: boolean) => void;
  onTranscriptPartial?: (text: string) => void;
  onTranscriptFinal?: (data: { text: string; audioBlob: Blob | null }) => void;
  onInterrupted?: () => void;
  onError?: (err: Error) => void;
}

export class VoiceAudioEngine {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private recognition: any = null;
  private isListening = false;
  private isSpeaking = false;
  private isMuted = false;
  private callbacks: AudioEngineCallbacks = {};
  private speakAnimInterval: any = null;
  private animFrameId: number | null = null;
  private silenceTimer: any = null;
  private accumulatedFinalText = '';

  constructor(callbacks: AudioEngineCallbacks = {}) {
    this.callbacks = callbacks;
  }

  public setCallbacks(callbacks: AudioEngineCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Start listening: captures live mic audio via MediaRecorder & AnalyserNode
   */
  public async startListening(language: string = 'en-IN'): Promise<void> {
    if (this.isSpeaking) {
      this.interrupt();
    }

    this.accumulatedFinalText = '';
    this.recordedChunks = [];
    this.isListening = true;
    this.callbacks.onListeningStateChange?.(true);

    try {
      if (typeof window !== 'undefined' && navigator?.mediaDevices?.getUserMedia) {
        // Request microphone stream
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        // 1. Setup AudioContext and AnalyserNode for 60fps energy visualization
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioCtx();
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }

        this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.4;
        this.sourceNode.connect(this.analyser);

        const updateVisualizer = () => {
          if (!this.analyser || this.isSpeaking || !this.isListening) return;

          const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
          this.analyser.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const normalized = Math.min(1, avg / 60);

          if (!this.isMuted) {
            this.callbacks.onAudioEnergy?.(normalized);
          } else {
            this.callbacks.onAudioEnergy?.(0);
          }

          this.animFrameId = requestAnimationFrame(updateVisualizer);
        };
        this.animFrameId = requestAnimationFrame(updateVisualizer);

        // 2. Setup MediaRecorder to capture actual audio bytes
        try {
          let mimeType = 'audio/webm';
          if (typeof MediaRecorder !== 'undefined') {
            if (MediaRecorder.isTypeSupported('audio/webm')) {
              mimeType = 'audio/webm';
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
              mimeType = 'audio/mp4';
            }
          }

          this.mediaRecorder = new MediaRecorder(this.mediaStream, { mimeType });
          this.mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              this.recordedChunks.push(event.data);
            }
          };
          this.mediaRecorder.start(100); // 100ms slices for guaranteed capture
        } catch (recErr) {
          console.warn('[VoiceAudioEngine] MediaRecorder fallback:', recErr);
        }
      }

      // 3. Setup Web Speech Recognition in parallel for instant client captions
      this.initSpeechRecognition(language);
    } catch (err: any) {
      console.warn('[VoiceAudioEngine] Microphone stream error:', err?.message);
      this.callbacks.onError?.(new Error('Microphone permission blocked or not found. Please allow microphone access in your browser.'));
      this.stopListening();
    }
  }

  /**
   * Stop active listening and return the recorded audio blob + any transcribed text
   */
  public async stopListening(): Promise<{ audioBlob: Blob | null; text: string }> {
    this.isListening = false;
    this.callbacks.onListeningStateChange?.(false);
    this.callbacks.onAudioEnergy?.(0);

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
    }

    // Force flush all recorded audio buffer immediately!
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      try {
        this.mediaRecorder.requestData();
      } catch (e) {}
    }

    // Wait 150ms for ondataavailable to deliver the flushed chunk
    await new Promise((r) => setTimeout(r, 150));

    const finalText = this.accumulatedFinalText.trim();
    const mime = this.mediaRecorder?.mimeType || 'audio/webm';
    let blob: Blob | null = null;

    if (this.recordedChunks && this.recordedChunks.length > 0) {
      blob = new Blob(this.recordedChunks, { type: mime });
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {}
    }

    this.cleanupStreams();

    return { audioBlob: blob, text: finalText };
  }

  private cleanupStreams() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
  }

  /**
   * Initialize Web Speech Recognition
   */
  private initSpeechRecognition(language: string) {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    try {
      if (this.recognition) {
        try {
          this.recognition.abort();
        } catch {}
      }

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;

      const langMap: Record<string, string> = {
        en: 'en-IN',
        hi: 'hi-IN',
        te: 'te-IN',
      };
      this.recognition.lang = langMap[language] || 'en-IN';

      this.recognition.onresult = (event: any) => {
        let interimText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            this.accumulatedFinalText += ' ' + transcript;
          } else {
            interimText += transcript;
          }
        }

        const currentLiveText = (this.accumulatedFinalText + ' ' + interimText).trim();

        if (currentLiveText) {
          this.callbacks.onTranscriptPartial?.(currentLiveText);

          // Clear previous silence timer
          if (this.silenceTimer) clearTimeout(this.silenceTimer);

          // Auto-trigger query after 1.5 seconds of silence
          this.silenceTimer = setTimeout(async () => {
            const queryToSend = (this.accumulatedFinalText + ' ' + interimText).trim();
            if (queryToSend.length > 2) {
              this.accumulatedFinalText = '';
              const { audioBlob } = await this.stopListening();
              this.callbacks.onTranscriptFinal?.({ text: queryToSend, audioBlob });
            }
          }, 1500);
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn('[VoiceAudioEngine] Speech notice:', event.error);
        }
      };

      try {
        this.recognition.start();
      } catch {}
    } catch (err: any) {
      console.warn('[VoiceAudioEngine] Speech recognition notice:', err);
    }
  }

  /**
   * Speak response using browser speech synthesis
   */
  public speak(text: string, language: string = 'en'): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve();
        return;
      }

      this.stopListening();
      window.speechSynthesis.cancel();
      this.isSpeaking = true;

      if (this.speakAnimInterval) clearInterval(this.speakAnimInterval);
      this.speakAnimInterval = setInterval(() => {
        if (this.isSpeaking) {
          const fakeEnergy = 0.35 + Math.random() * 0.55;
          this.callbacks.onAudioEnergy?.(fakeEnergy);
        } else {
          clearInterval(this.speakAnimInterval);
          this.speakAnimInterval = null;
          this.callbacks.onAudioEnergy?.(0);
        }
      }, 100);

      const cleanText = text
        .replace(/₹/g, 'Rupees ')
        .replace(/\b(\d+)\/100\b/g, '$1 out of 100')
        .replace(/[#*_~`]/g, '')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      const langMap: Record<string, string> = {
        en: 'en-IN',
        hi: 'hi-IN',
        te: 'te-IN',
      };
      utterance.lang = langMap[language] || 'en-IN';

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) =>
          (v.lang.includes('IN') || v.lang.includes('en-GB') || v.lang.includes('en-US')) &&
          !v.name.includes('eSpeak')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      const stopSpeech = () => {
        this.isSpeaking = false;
        if (this.speakAnimInterval) {
          clearInterval(this.speakAnimInterval);
          this.speakAnimInterval = null;
        }
        this.callbacks.onAudioEnergy?.(0);
        resolve();
      };

      utterance.onend = stopSpeech;
      utterance.onerror = stopSpeech;

      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Barge-in interruption
   */
  public interrupt(): void {
    if (this.isSpeaking) {
      this.isSpeaking = false;
      if (this.speakAnimInterval) {
        clearInterval(this.speakAnimInterval);
        this.speakAnimInterval = null;
      }
      this.callbacks.onAudioEnergy?.(0);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      this.callbacks.onInterrupted?.();
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Stop everything
   */
  public stop(): void {
    this.stopListening();
    this.isSpeaking = false;

    if (this.speakAnimInterval) {
      clearInterval(this.speakAnimInterval);
      this.speakAnimInterval = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    this.cleanupStreams();
  }
}
