import { translateText, textToSpeech } from './translationService'; // Import client-side TTS/Translate helper

const API_BASE_URL = 'http://localhost:5000/api'; 

/**
 * Sends source text and language codes to the server for translation.
 * This is used for the Live Speech flow.
 */
export const translateDocument = async (sourceText, targetLanguage, sourceLanguage = 'auto') => {
  console.log(`Sending text for translation to ${targetLanguage}...`);
    
  const response = await fetch(`${API_BASE_URL}/translate/document`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
        sourceText: sourceText, 
        targetLanguage: targetLanguage,
        sourceLanguage: sourceLanguage 
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Server responded with error:", errorText);
    throw new Error(`Text translation failed: ${errorText}`);
  }
  
  return response.json();
};


/**
 * Sends an audio file to the server for full localization (STT -> Translation -> TTS).
 */
export const localizeAudio = async (audioFile, targetLanguage, sourceLanguage = 'auto') => {
    console.log(`Sending audio file ${audioFile.name} for full localization to ${targetLanguage}...`);
    
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('targetLanguage', targetLanguage);
    formData.append('sourceLanguage', sourceLanguage);
    
    const response = await fetch(`${API_BASE_URL}/localize/audio`, { 
        method: 'POST', 
        body: formData 
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Server responded with error during audio localization:", errorText);
        throw new Error(`Audio localization failed: ${errorText}`);
    }
    
    return response.json();
};

/**
 * Sends a video file to the server for multimodal transcription and translation.
 * @param {File} videoFile - The video file object.
 * @param {string} targetLanguage - The language code to translate into.
 * @param {string} sourceLanguage - The language code of the spoken audio in the video.
 * @returns {Promise<object>} Object containing transcribed text, translated subtitles, and optional audio URL.
 */
export const localizeVideo = async (videoFile, targetLanguage, sourceLanguage) => {
    console.log(`Sending video file ${videoFile.name} for localization to ${targetLanguage}...`);
    
    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('targetLanguage', targetLanguage);
    formData.append('sourceLanguage', sourceLanguage);
    
    const response = await fetch(`${API_BASE_URL}/localize/video`, { 
        method: 'POST', 
        body: formData 
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Server responded with error during video localization:", errorText);
        throw new Error(`Video localization failed: ${errorText}`);
    }
    
    return response.json();
};


// Export client-side helper functions for the live transcription page
export { translateText, textToSpeech };

// Export all service functions
export default {
    translateDocument,
    localizeAudio,
    localizeVideo
};
