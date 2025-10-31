// src/services/api.js

const API_BASE_URL = 'http://localhost:5000/api'; 

/**
 * Sends source text, target language, and (optional) source language to the server for translation
 * using the undocumented Google Translate endpoint configured on the server.
 * @param {string} sourceText - The text string to translate.
 * @param {string} targetLanguage - The language code (e.g., 'hi') to translate to.
 * @param {string} [sourceLanguage] - The source language code (or 'auto').
 * @returns {Promise<object>} Object containing translatedContent, sourceLanguage, etc.
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
 * Sends translated text to the server for refinement using the OpenAI API Key.
 * @param {string} text - The translated text to be refined.
 * @param {string} targetLanguage - The language code of the text.
 * @returns {Promise<object>} Object containing the refinedText.
 */
export const refineTranslation = async (text, targetLanguage) => {
    console.log(`Sending text for refinement in ${targetLanguage}...`);

    const response = await fetch(`${API_BASE_URL}/refine/text`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, targetLanguage }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Server responded with error during refinement:", errorText);
        throw new Error(`Text refinement failed: ${errorText}`);
    }
    
    return response.json();
};

/**
 * Sends translated text to the server to generate an audio file using OpenAI TTS.
 * @param {string} text - The translated text to synthesize speech from.
 * @param {string} targetLanguage - The language code (e.g., 'hi') to help select the voice model.
 * @returns {Promise<object>} Object containing the URL to the generated audio file.
 */
export const generateSpeech = async (text, targetLanguage) => {
    console.log(`Sending text to server for TTS generation in ${targetLanguage}...`);

    const response = await fetch(`${API_BASE_URL}/generate/speech`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, targetLanguage }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Speech generation failed: ${errorText}`);
    }
    
    return response.json();
};


/**
 * Sends an audio file to the server for full localization (STT -> Translation -> TTS).
 * This uses FormData to send the actual file.
 * @param {File} audioFile - The audio file object.
 * @param {string} targetLanguage - The language code (e.g., 'hi') to translate and synthesize to.
 * @returns {Promise<object>} Object containing transcribed text and the URL to the localized audio file.
 */
export const localizeAudio = async (audioFile, targetLanguage) => {
    console.log(`Sending audio file ${audioFile.name} for full localization to ${targetLanguage}...`);
    
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('targetLanguage', targetLanguage);
    
    const response = await fetch(`${API_BASE_URL}/localize/audio`, { 
        method: 'POST', 
        body: formData 
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Audio localization failed: ${errorText}`);
    }
    
    return response.json();
};

/**
 * Placeholder for Video Localization (Transcription, Subtitles, Translation).
 */
export const localizeVideo = async (videoFile, targetLanguage) => {
    console.warn("Video localization functionality is a server-side placeholder.");
    
    // Placeholder logic for demonstration
    return new Promise(resolve => setTimeout(() => resolve({
        subtitlesGenerated: true,
        downloadLink: "/path/to/placeholder.srt"
    }), 4000));
};

// Export all service functions (useful for bulk import)
export default {
    translateDocument,
    refineTranslation,
    generateSpeech, 
    localizeAudio,
    localizeVideo
};