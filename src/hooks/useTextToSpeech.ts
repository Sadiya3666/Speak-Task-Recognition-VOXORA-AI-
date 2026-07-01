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
      // Stop any ongoing speech synthesis
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      
      // Stop ResponsiveVoice if it's active
      if (window.responsiveVoice) {
        window.responsiveVoice.cancel();
      }
      
      setIsSpeaking(false);
      setIsOnlineTTS(false);
      utteranceRef.current = null;
    } catch (error) {
      console.error('Error stopping speech:', error);
    } finally {
      // Let any pending onerror/onend events flush before re-enabling errors.
      window.setTimeout(() => {
        stoppingRef.current = false;
      }, 0);
    }
  }, []);

  // Fallback to online TTS
  const speakWithResponsiveVoice = async (text: string, language: string) => {
    console.log('Trying online TTS directly for language:', language);
    
    const langCode = language.split('-')[0];
    
    try {
      const audio = new Audio();
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${langCode}&client=gtx&q=${encodeURIComponent(text)}`;
      console.log(`TTS Direct URL: ${ttsUrl}`);
      audio.src = ttsUrl;
      audio.volume = 1;
      
      audio.onplay = () => {
        setIsSpeaking(true);
        setIsOnlineTTS(true);
      };
      
      audio.onended = () => {
        setIsSpeaking(false);
        setIsOnlineTTS(false);
      };
      
      audio.onerror = (error) => {
        console.error('TTS direct failed:', error);
        setIsSpeaking(false);
        setIsOnlineTTS(false);
      };
      
      await audio.play();
      return true;
    } catch (error) {
      console.error('Online TTS proxy error:', error);
      setIsOnlineTTS(false);
    }
    
    return false;
  };

  const speak = useCallback((text: string, language: string = defaultLanguage) => {
    if (!text.trim()) {
      console.warn('Empty text provided for speech');
      return;
    }
    
    console.log(`Speaking text: "${text}" in language: ${language}`);
    stop();

    // Special test for Hindi - try direct browser TTS first
    if (language.startsWith('hi')) {
      console.log('Testing Hindi TTS with direct approach');
      try {
        const hindiUtterance = new SpeechSynthesisUtterance(text);
        hindiUtterance.lang = 'hi-IN';
        hindiUtterance.rate = 0.9;
        hindiUtterance.pitch = 1;
        hindiUtterance.volume = 1;
        
        hindiUtterance.onstart = () => {
          console.log('Hindi speech started');
          setIsSpeaking(true);
        };
        
        hindiUtterance.onend = () => {
          console.log('Hindi speech ended');
          setIsSpeaking(false);
          utteranceRef.current = null;
        };
        
        hindiUtterance.onerror = (event) => {
          console.error('Hindi TTS error:', event);
          console.log('Falling back to online TTS for Hindi');
          setIsSpeaking(false);
          speakWithResponsiveVoice(text, language).catch(console.error);
        };
        
        utteranceRef.current = hindiUtterance;
        synthRef.current.speak(hindiUtterance);
        return;
      } catch (error) {
        console.error('Direct Hindi TTS failed:', error);
      }
    }

    if (!isSupported || !synthRef.current) {
      console.log('TTS not supported in this browser');
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      
      const voice = getVoiceForLanguage(language);
      console.log(`Voice selection result for ${language}:`, voice);
      if (voice) {
        utterance.voice = voice;
        console.log(`Using browser voice: ${voice.name} (${voice.lang}) for language: ${language}`);
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
        // Expected when we intentionally stop/cancel or immediately restart speech.
        if (stoppingRef.current || err === 'interrupted' || err === 'canceled' || err === 'cancelled') {
          console.debug('Speech synthesis stopped:', err);
          setIsSpeaking(false);
          utteranceRef.current = null;
          return;
        }

        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
        utteranceRef.current = null;
        
        // Fall back to online TTS if local TTS fails
        console.log('Falling back to online TTS after error');
        speakWithResponsiveVoice(text, language).catch(console.error);
      };

      try {
        utteranceRef.current = utterance;
        synthRef.current.speak(utterance);
        console.log('Started speaking with language:', language);
      } catch (error) {
        console.error('Error starting speech synthesis:', error);
        setIsSpeaking(false);
        utteranceRef.current = null;
        
        // Fall back to online TTS if local TTS fails to start
        console.log('Falling back to online TTS after start error');
        speakWithResponsiveVoice(text, language).catch(console.error);
      }
    } catch (error) {
      console.error('Error creating speech utterance:', error);
      // Fall back to online TTS if utterance creation fails
      speakWithResponsiveVoice(text, language).catch(console.error);
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