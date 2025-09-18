import { useState, useEffect, useCallback } from 'react';

interface SpeechSynthesisState {
  speaking: boolean;
  supported: boolean;
  voices: SpeechSynthesisVoice[];
}

export function useSpeechSynthesis() {
  const [state, setState] = useState<SpeechSynthesisState>({
    speaking: false,
    supported: 'speechSynthesis' in window,
    voices: [],
  });

  useEffect(() => {
    if (!state.supported) return;

    const updateVoices = () => {
      setState(prev => ({
        ...prev,
        voices: speechSynthesis.getVoices(),
      }));
    };

    updateVoices();
    speechSynthesis.addEventListener('voiceschanged', updateVoices);

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', updateVoices);
    };
  }, [state.supported]);

  const speak = useCallback((text: string, options?: {
    lang?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
  }) => {
    if (!state.supported) return;

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Find appropriate voice for language
    if (options?.lang) {
      const voice = state.voices.find(v => v.lang.startsWith(options.lang!));
      if (voice) utterance.voice = voice;
    }

    utterance.rate = options?.rate ?? 1;
    utterance.pitch = options?.pitch ?? 1;
    utterance.volume = options?.volume ?? 1;
    utterance.lang = options?.lang ?? 'en-US';

    utterance.onstart = () => {
      setState(prev => ({ ...prev, speaking: true }));
    };

    utterance.onend = () => {
      setState(prev => ({ ...prev, speaking: false }));
    };

    utterance.onerror = () => {
      setState(prev => ({ ...prev, speaking: false }));
    };

    speechSynthesis.speak(utterance);
  }, [state.supported, state.voices]);

  const stop = useCallback(() => {
    if (state.supported) {
      speechSynthesis.cancel();
      setState(prev => ({ ...prev, speaking: false }));
    }
  }, [state.supported]);

  return {
    ...state,
    speak,
    stop,
  };
}

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const supported = !!SpeechRecognition;

  const startListening = useCallback((options?: {
    lang?: string;
    continuous?: boolean;
  }) => {
    if (!supported) {
      setError('Speech recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = options?.continuous ?? false;
    recognition.interimResults = true;
    recognition.lang = options?.lang ?? 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript);
    };

    recognition.onerror = (event: any) => {
      setError(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();

    return recognition;
  }, [supported]);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  return {
    isListening,
    transcript,
    error,
    supported,
    startListening,
    stopListening,
  };
}
