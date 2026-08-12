export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
  onBoundary?: (charIndex: number) => void;
}

class TTSService {
  private synth: SpeechSynthesis | null = null;
  private selectedVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.initVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    // Prefer Mandarin Chinese (Taiwan zh-TW or China zh-CN)
    const zhVoice =
      voices.find((v) => v.lang === 'zh-TW') ||
      voices.find((v) => v.lang.startsWith('zh')) ||
      voices.find((v) => v.lang.includes('ZH'));

    if (zhVoice) {
      this.selectedVoice = zhVoice;
    }
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices().filter((v) => v.lang.startsWith('zh') || v.lang.includes('ZH'));
  }

  public setVoice(voice: SpeechSynthesisVoice) {
    this.selectedVoice = voice;
  }

  public speak(text: string, options: SpeakOptions = {}) {
    if (!this.synth) {
      console.warn('Speech synthesis not supported in this browser.');
      return;
    }

    this.stop(); // Stop previous speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-TW';
    utterance.rate = options.rate || 0.9; // Slight slower for learners
    utterance.pitch = options.pitch || 1.0;

    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    if (options.onStart) utterance.onstart = () => options.onStart!();
    if (options.onEnd) utterance.onend = () => options.onEnd!();
    if (options.onError) utterance.onerror = (e) => options.onError!(e);

    if (options.onBoundary) {
      utterance.onboundary = (event) => {
        if (event.name === 'word' || event.charIndex !== undefined) {
          options.onBoundary!(event.charIndex);
        }
      };
    }

    this.synth.speak(utterance);
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  public isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }
}

export const ttsService = new TTSService();
