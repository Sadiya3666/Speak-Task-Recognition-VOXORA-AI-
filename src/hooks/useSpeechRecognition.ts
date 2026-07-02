import { useState, useEffect, useRef } from 'react';

// Extend the Window interface to include speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  startListening: (options?: { language?: string }) => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
}

interface UseSpeechRecognitionOptions {
  language?: string;
}

export const useSpeechRecognition = (options: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn => {
  const { language = 'en-US' } = options;
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  // Keep an internal source-of-truth for the actual recognition state.
  // The Web Speech API can get out of sync with React state, especially around stop/end events.
  const listeningRef = useRef(false);
  const stopTimeoutRef = useRef<number | null>(null);
  // Guard to prevent calling start() while the engine is still stopping.
  const stopInProgressRef = useRef(false);
  // Keep accumulated final transcript so we can display interim results live.
  const finalTranscriptRef = useRef('');

  // Check if speech recognition is supported
  const isSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      listeningRef.current = true;
      stopInProgressRef.current = false;
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      // Build a live transcript: accumulated finals + current interim.
      // This makes text appear while the user is speaking (not only after pauses).
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result?.[0]?.transcript ?? '';
        if (!text) continue;
        if (result.isFinal) {
          finalTranscriptRef.current += text;
        } else {
          interimTranscript += text;
        }
      }

      const combined = `${finalTranscriptRef.current}${interimTranscript}`;
      if (combined) setTranscript(combined);
    };

    recognition.onerror = (event: any) => {
      // "aborted" is commonly emitted when we intentionally stop/abort recognition.
      // Don't treat it as a real error in the UI.
      if (event?.error !== 'aborted') {
        console.error('Speech recognition error:', event.error);
      } else {
        console.debug('Speech recognition stopped (aborted).');
      }
      listeningRef.current = false;
      stopInProgressRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      listeningRef.current = false;
      stopInProgressRef.current = false;
      setIsListening(false);
      if (stopTimeoutRef.current) {
        window.clearTimeout(stopTimeoutRef.current);
        stopTimeoutRef.current = null;
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          // abort() is more forceful than stop() in some browsers
          if (typeof recognitionRef.current.abort === 'function') {
            recognitionRef.current.abort();
          } else {
            recognitionRef.current.stop();
          }
        } catch (e) {
          // ignore cleanup errors
        }
      }
      if (stopTimeoutRef.current) {
        window.clearTimeout(stopTimeoutRef.current);
        stopTimeoutRef.current = null;
      }
    };
  }, [isSupported, language]);

  const startListening = (options: { language?: string } = {}) => {
    if (!recognitionRef.current) return;
    try {
      if (options.language) {
        recognitionRef.current.lang = options.language;
      }
      // If it's already listening, don't restart (restarting can cause "aborted"/"already started" issues).
      if (listeningRef.current || stopInProgressRef.current) return;
      // Reset the final buffer for a fresh session
      finalTranscriptRef.current = '';
      setTranscript('');
      recognitionRef.current.start();
    } catch (e) {
      // Common browser error: "recognition has already started"
      // We'll ignore it; UI state will reflect actual listening via onstart/onend.
      const msg = (e as any)?.message ?? '';
      const name = (e as any)?.name ?? '';
      if (name === 'InvalidStateError' || msg.toLowerCase().includes('already started')) {
        // Expected if the engine hasn't fully stopped yet. Try a gentle stop then retry once.
        try {
          stopInProgressRef.current = true;
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
        window.setTimeout(() => {
          try {
            if (!recognitionRef.current) return;
            if (listeningRef.current) return;
            stopInProgressRef.current = false;
            finalTranscriptRef.current = '';
            setTranscript('');
            recognitionRef.current.start();
          } catch {
            // ignore
          }
        }, 250);
        return;
      }
      console.warn('Speech recognition start failed:', e);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    try {
      // Prefer stop() for user-initiated stop (graceful; allows final results).
      // Use abort() only for cleanup/unmount.
      recognitionRef.current.stop();
    } catch (e) {
      console.warn('Speech recognition stop failed:', e);
    }
    // Immediately reflect stopped state in UI. Some browsers delay/skip onend.
    stopInProgressRef.current = true;
    listeningRef.current = false;
    setIsListening(false);
    // Fallback: if the engine didn't actually stop, force abort after a short delay.
    if (stopTimeoutRef.current) {
      window.clearTimeout(stopTimeoutRef.current);
    }
    stopTimeoutRef.current = window.setTimeout(() => {
      try {
        if (recognitionRef.current && typeof recognitionRef.current.abort === 'function') {
          recognitionRef.current.abort();
        }
      } catch {
        // ignore
      } finally {
        stopTimeoutRef.current = null;
        stopInProgressRef.current = false;
      }
    }, 600);
  };

  const resetTranscript = () => {
    finalTranscriptRef.current = '';
    setTranscript('');
  };

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported
  };
};