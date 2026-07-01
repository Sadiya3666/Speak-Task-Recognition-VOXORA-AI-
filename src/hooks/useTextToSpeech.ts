import { useState, useRef, useEffect, useCallback } from 'react';

declare global {
  interface Window {
    responsiveVoice: any;
  }
}

interface UseTextToSpeechReturn {
  isSpeaking: boolean;
  speak: (text: string, language?: string) => void;
  stop: () => void;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  isOnlineTTS: boolean;
}

interface UseTextToSpeechOptions {
  defaultLanguage?: string;
}

// Load ResponsiveVoice script
const loadResponsiveVoice = () => {
  return new Promise<void>((resolve) => {
    if (window.responsiveVoice) return resolve();
    const script = document.createElement('script');
    script.src = 'https://code.responsivevoice.org/responsivevoice.js?key=YOUR_API_KEY';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      console.error('Failed to load ResponsiveVoice');
      resolve();
    };
    document.head.appendChild(script);
  });
};

const useTextToSpeech = (options: UseTextToSpeechOptions = {}): UseTextToSpeechReturn => {
  const { defaultLanguage = 'en-US' } = options;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isOnlineTTS, setIsOnlineTTS] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  // When we intentionally cancel speech (stop button / new speak), browsers often emit
  // SpeechSynthesisErrorEvent with error="interrupted" or "canceled". We should ignore those.
  const stoppingRef = useRef(false);
  const isSupported = 'speechSynthesis' in window;
  
  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
      // We'll enable this when we implement the API
      // loadResponsiveVoice();
    }
    return () => {
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  useEffect(() => {
    if (!isSupported || !synthRef.current) return;
    
    const loadVoices = () => {
      try {
        const availableVoices = synthRef.current?.getVoices() || [];
        console.log('Available voices:', availableVoices);
        console.log('Indian voices found:', availableVoices.filter(v => 
          v.lang.toLowerCase().includes('hi') || 
          v.lang.toLowerCase().includes('kn') ||
          v.name.toLowerCase().includes('hindi') ||
          v.name.toLowerCase().includes('kannada')
        ));
        
        console.log('Hindi voices:', availableVoices.filter(v => 
          v.lang.toLowerCase().includes('hi') || 
          v.name.toLowerCase().includes('hindi')
        ));
        
        console.log('Kannada voices:', availableVoices.filter(v => 
          v.lang.toLowerCase().includes('kn') || 
          v.name.toLowerCase().includes('kannada')
        ));
        setVoices(availableVoices);
      } catch (error) {
        console.error('Error loading voices:', error);
      }
    };

    // Load voices when they become available
    synthRef.current.onvoiceschanged = loadVoices;
    loadVoices(); // Initial load

    // Check for voices periodically in case they load after the initial check
    const voiceCheckInterval = setInterval(loadVoices, 1000);

    return () => {
      if (synthRef.current) {
        synthRef.current.onvoiceschanged = null;
      }
      clearInterval(voiceCheckInterval);
    };
  }, [isSupported]);

  // Find the best voice for the given language
  const getVoiceForLanguage = useCallback((lang: string): SpeechSynthesisVoice | null => {
    if (!voices.length) return null;
    
    const langLower = lang.toLowerCase();
    const langCode = lang.split('-')[0].toLowerCase();
    
    // Special handling for Indian languages
    const indianLangs = ['kn', 'hi', 'ta', 'te', 'ml', 'bn', 'gu', 'pa', 'mr', 'ur'];
    if (indianLangs.includes(langCode)) {
      console.log(`Looking for voice for ${langCode} (${lang})`);
      
      // Try to find voice for the specific Indian language
      const specificVoices = voices.filter(v => 
        v.lang.toLowerCase().includes(langCode) || 
        v.name.toLowerCase().includes(langCode)
      );
      console.log(`Specific voices for ${langCode}:`, specificVoices);
      if (specificVoices.length) {
        console.log(`Using specific voice: ${specificVoices[0].name}`);
        return specificVoices[0];
      }
      
      // Try broader Indian language search
      const indianVoices = voices.filter(v => 
        v.lang.toLowerCase().includes('in') || 
        v.name.toLowerCase().includes('india')
      );
      console.log(`Indian voices for ${langCode}:`, indianVoices);
      if (indianVoices.length) {
        console.log(`Using Indian voice: ${indianVoices[0].name}`);
        return indianVoices[0];
      }
      
      // Try any voice that supports Devanagari script (for Hindi, Marathi, etc.)
      if (['hi', 'mr', 'ne', 'sa', 'kok', 'brx', 'mai', 'doi'].includes(langCode)) {
        const devanagariVoices = voices.filter(v => 
          v.lang.toLowerCase().includes('hi') ||
          v.lang.toLowerCase().includes('mr') ||
          v.name.toLowerCase().includes('hindi') ||
          v.name.toLowerCase().includes('marathi')
        );
        console.log(`Devanagari voices for ${langCode}:`, devanagariVoices);
        if (devanagariVoices.length) {
          console.log(`Using Devanagari voice: ${devanagariVoices[0].name}`);
          return devanagariVoices[0];
        }
      }
    }
    
    // Try exact match
    const exactMatch = voices.find(v => v.lang.toLowerCase() === langLower);
    if (exactMatch) return exactMatch;
    
    // Try language code match
    const langMatch = voices.find(v => 
      v.lang.toLowerCase().startsWith(langCode) ||
      v.name.toLowerCase().includes(langCode)
    );
    
    return langMatch || null;
  }, [voices]);

  const stop = useCallback(() => {
    try {
      stoppingRef.current = true;
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      setIsSpeaking(false);
      setIsOnlineTTS(false);
      utteranceRef.current = null;
    } catch (error) {
      console.error('Error stopping speech:', error);
    } finally {
      window.setTimeout(() => {
        stoppingRef.current = false;
      }, 0);
    }
  }, []);

  const speak = useCallback((text: string, language: string = defaultLanguage) => {
    if (!text.trim()) {
      console.warn('Empty text provided for speech');
      return;
    }
    
    console.log(`Speaking text: "${text}" in language: ${language}`);
    stop();

    if (!isSupported || !synthRef.current) {
      console.log('TTS not supported in this browser');
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      
      const voice = getVoiceForLanguage(language);
      if (voice) {
        utterance.voice = voice;
        console.log(`Using browser voice: ${voice.name} (${voice.lang})`);
      } else {
        console.warn(`No exact voice found in getVoices() for ${language}, relying on browser default for lang.`);
      }
    
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => {
        console.log('Speech started');
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        console.log('Speech ended');
        setIsSpeaking(false);
        utteranceRef.current = null;
      };

      utterance.onerror = (event) => {
        const err = (event as any)?.error;
        if (stoppingRef.current || err === 'interrupted' || err === 'canceled' || err === 'cancelled') {
          console.debug('Speech synthesis stopped:', err);
        } else {
          console.error('Speech synthesis error:', event);
        }
        setIsSpeaking(false);
        utteranceRef.current = null;
      };

      utteranceRef.current = utterance;
      synthRef.current.speak(utterance);
    } catch (error) {
      console.error('Error creating speech utterance:', error);
      setIsSpeaking(false);
    }
  }, [isSupported, getVoiceForLanguage, defaultLanguage, stop]);

  return {
    isSpeaking,
    speak,
    stop,
    isSupported,
    voices,
    isOnlineTTS,
  };
};

export { useTextToSpeech };