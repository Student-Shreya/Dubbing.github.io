// src/pages/TextTranslation.js 
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { translateDocument } from '../services/api';
import './TextTranslation.css';

function TextTranslation() {
  const navigate = useNavigate();
  const [sourceText, setSourceText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('hi'); 
  const [translationResult, setTranslationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [sourceLanguage, setSourceLanguage] = useState('auto'); 

  // --- TARGET LANGUAGE LIST (22+ Languages) ---
  const languageOptions = [
    // Major Indian Languages (22 Official)
    { code: 'hi', name: 'Hindi' }, { code: 'mr', name: 'Marathi' },
    { code: 'bn', name: 'Bengali (Bangla)' }, { code: 'te', name: 'Telugu' },
    { code: 'ta', name: 'Tamil' }, { code: 'gu', name: 'Gujarati' },
    { code: 'kn', name: 'Kannada' }, { code: 'ml', name: 'Malayalam' },
    { code: 'pa', name: 'Punjabi' }, { code: 'or', name: 'Odia (Oriya)' },
    { code: 'as', name: 'Assamese' }, { code: 'ur', name: 'Urdu' },
    { code: 'ks', name: 'Kashmiri' }, { code: 'sa', name: 'Sanskrit' },
    { code: 'sd', name: 'Sindhi' }, { code: 'ne', name: 'Nepali' },
    { code: 'kok', name: 'Konkani' }, { code: 'mni', name: 'Manipuri (Meitei)' }, 
    { code: 'doi', name: 'Dogri' }, { code: 'bo', name: 'Bodo' },               
    { code: 'mai', name: 'Maithili' }, { code: 'sat', name: 'Santali' },           
    { code: 'en', name: 'English' }, { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' }, { code: 'de', name: 'German' },
    { code: 'zh', name: 'Chinese (Mandarin)' },
  ];
  // ---------------------------------------------
  
  const handleTranslateText = async () => {
    if (!sourceText.trim()) {
      alert('Please enter text to translate.');
      return;
    }
    if (!targetLanguage) {
      alert('Please select a target language.');
      return;
    }

    setIsLoading(true);
    setTranslationResult(null);

    try {
      const result = await translateDocument(sourceText, targetLanguage, sourceLanguage);
      setTranslationResult(result);
    } catch (error) {
      console.error('Error during translation:', error);
      alert('Failed to translate text. Check server logs.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAudio = () => {
    if (!translationResult || !translationResult.translatedContent) {
        alert('Please translate the text first.');
        return;
    }
    
    // TEMPORARY BROWSER TTS IMPLEMENTATION
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(translationResult.translatedContent);
        // Use the language code (targetLanguage) to select the correct voice
        utterance.lang = targetLanguage; 
        window.speechSynthesis.speak(utterance);
    } else {
        alert('Browser Text-to-Speech is not supported.');
    }
};
  
  const getLanguageName = (code) => {
    const lang = languageOptions.find(opt => opt.code === code);
    return lang ? lang.name : code;
  };

  return (
    <div className="text-translation-page">
      <button className="back-btn" onClick={() => navigate('/')}>← Back to Home</button>
      <h2 className="page-title">AI-Powered Text Translation</h2>
      <p className="page-subtitle">
        Enter your text and get instant, accurate translations across multiple languages.
      </p>

      {/* REMOVED: info-badges and steps-indicator */}

      <div className="translation-section">
        
        {/* Input Text Area (Replaces Upload Box) */}
        <div className="upload-box">
          <label htmlFor="source-text-input" className="target-language-selector">
            Source Text (Auto-detect)
          </label>
          <textarea
            id="source-text-input"
            rows="10"
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Enter the text you want to translate here..."
            className="source-text-area"
            style={{ 
                width: '100%', 
                padding: '18px', /* Increased Padding */
                borderRadius: '8px', 
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-deep-dark)',
                color: 'var(--text-color-primary)',
                resize: 'none',
                marginBottom: '20px',
                fontSize: '1.2rem' /* Increased Font Size */
            }}
          />

          <div className="target-language-selector">
            <label htmlFor="target-lang">Target Language</label>
            <select
              id="target-lang"
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              style={{ fontSize: '1rem' }} /* Ensuring select font is readable */
            >
              {languageOptions.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>
          <button className="btn-primary" onClick={handleTranslateText} disabled={isLoading || !sourceText.trim()}>
            <span className="icon">📚</span> {isLoading ? 'Translating...' : 'Translate Text'}
          </button>
        </div>
        
        {/* Translation Result Box (No change to appearance/position) */}
        <div className="translation-results-box">
          {isLoading && (
             <div className="processing-indicator">
             <span className="icon spinning">⏳</span>
             <p>Processing Translation</p>
             <small>Analyzing text and generating target language content...</small>
           </div>
          )}
          {translationResult && !isLoading ? (
            <>
              <h3>Translated Text ({getLanguageName(targetLanguage)})</h3>
              <div className="translated-text-display" style={{ fontSize: '1.2rem' }}> {/* Increased Font Size in Output */}
                <p>{translationResult.translatedContent || "Translation result placeholder."}</p>
              </div>
              <button className="btn-success">
                <span className="icon">⬇️</span> Copy Translation
              </button>
              <div className="text-to-speech-section">
                <h3>Text-to-Speech</h3>
                <button className="btn-secondary" onClick={handleGenerateAudio}>
                  <span className="icon">🔊</span> Generate Audio
                </button>
              </div>
            </>
          ) : (
            <div className="placeholder">
              <span className="icon">✨</span>
              <p>Ready for Translation</p>
              <small>Enter your text above to see professional translation results here</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TextTranslation;