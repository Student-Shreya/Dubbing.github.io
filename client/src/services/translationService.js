
// --- Type Interfaces (for documentation only, removed TypeScript syntax) ---
// const { Language, TranslationResult, AudioRecording } = require('../types'); 

// NOTE: This function is the translation endpoint you requested, now client-side.
export const translateText = async (
  text,
  sourceLang,
  targetLang
) => {
  try {
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
    );
    const data = await response.json();

    if (data && data[0]) {
      // Map the complex array response and join segments
      return data[0].map((item) => item[0]).join('');
    }

    throw new Error('Translation failed: Unexpected API response structure.');
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
};

export const textToSpeech = (text, language) => {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    // Adjust language code for better voice selection (e.g., zh -> zh-CN)
    utterance.lang = language === 'zh' ? 'zh-CN' : language; 
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onend = () => resolve();
    utterance.onerror = (error) => reject(error);

    window.speechSynthesis.speak(utterance);
  });
};

