import axios from 'axios';

export interface TranslationResult {
  original_text: string;
  translated_text: string;
  source_language: string;
  target_language: string;
}

export const translateText = async (
  text: string,
  targetLang: string,
  sourceLang: string = 'auto'
): Promise<TranslationResult> => {
  try {
    const langPair = `${sourceLang === 'auto' ? 'en' : sourceLang}|${targetLang}`;
    const response = await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`);
    
    return {
      original_text: text,
      translated_text: response.data.responseData.translatedText || text,
      source_language: sourceLang,
      target_language: targetLang
    };
  } catch (error) {
    console.error('Translation error:', error);
    return {
      original_text: text,
      translated_text: "Translation failed (mock offline)",
      source_language: sourceLang,
      target_language: targetLang
    };
  }
};
