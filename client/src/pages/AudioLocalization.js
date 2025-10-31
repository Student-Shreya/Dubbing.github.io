// src/pages/AudioLocalization.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { localizeAudio } from '../services/api'; // <-- Using the updated API function
import './AudioLocalization.css'; 

function AudioLocalization() {
  const navigate = useNavigate();
  const [selectedAudioFile, setSelectedAudioFile] = useState(null);
  const [targetLanguage, setTargetLanguage] = useState('hi');
  const [localizationResult, setLocalizationResult] = useState(null);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);

  // --- TARGET LANGUAGE LIST (22+ Languages) ---
  const languageOptions = [
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


  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedAudioFile(file);
      setLocalizationResult(null); 
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedAudioFile(file);
      setLocalizationResult(null);
    }
  };

  const handleLocalizeAudio = async () => {
    if (!selectedAudioFile) {
      alert('Please upload an audio file first.');
      return;
    }
    setIsProcessingAudio(true);
    setLocalizationResult(null);

    try {
      // --- REAL API CALL to server for STT, Translate, and TTS ---
      const result = await localizeAudio(selectedAudioFile, targetLanguage);
      
      setLocalizationResult({
        transcribedText: result.transcribedText, // Real transcription
        localizedAudioUrl: result.audioUrl,      // Real audio URL
        audioDuration: "N/A" // Placeholder, actual duration calculation is complex
      });
      
    } catch (error) {
        console.error('Audio Localization Error:', error);
        alert(`Failed to localize audio: ${error.message}`);
    } finally {
        setIsProcessingAudio(false);
    }
  };
  
  // Helper to display full language name in the UI
  const getLanguageName = (code) => {
    const lang = languageOptions.find(opt => opt.code === code);
    return lang ? lang.name : code;
  };

  return (
    <div className="audio-localization-page">
      <button className="back-btn" onClick={() => navigate('/')}>← Back to Home</button>
      <h2 className="page-title">AI-Powered Audio Localization</h2>
      <p className="page-subtitle">
        Convert speech to text, translate across languages, and generate natural-sounding audio with advanced AI voice synthesis.
      </p>

      <div className="info-badges">
        <span className="badge">🎤 Voice Synthesis</span>
        <span className="badge">⚡ Fast Processing</span>
        <span className="badge">📁 Multi-format Support</span>
      </div>

      <div className="steps-indicator">
        <div className="step active">1 Upload</div>
        <div className="step">2 Process</div>
        <div className="step">3 Download</div>
      </div>

      <div className="localization-section">
        <div className="upload-box" onDragOver={handleDragOver} onDrop={handleDrop}>
          <input
            type="file"
            id="audio-upload"
            hidden
            onChange={handleFileChange}
            accept=".mp3,.wav,.wma,.flac,.aac,.ogg"
          />
          <label htmlFor="audio-upload" className="drop-area">
            <span className="icon">🎵</span>
            <p>Drop your audio file here</p>
            <small>or click to browse files</small>
            <ul>
              <li>• MP3, WAV, WMA support</li>
              <li>• FLAC, AAC, OGG formats</li>
              <li>• Maximum 500MB</li>
              <li>• High quality processing</li>
            </ul>
          </label>
          {selectedAudioFile && (
            <div className="uploaded-file-details">
              <h4>{selectedAudioFile.name}</h4>
              <p>Type: {selectedAudioFile.type} | Size: {(selectedAudioFile.size / (1024 * 1024)).toFixed(2)} MB</p>
              <div className="file-ready-status">
                <span className="checkmark">✅</span> Audio file ready for processing
              </div>
            </div>
          )}

          <div className="target-language-selector">
            <label htmlFor="audio-target-lang">Target Language</label>
            <select
              id="audio-target-lang"
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
            >
              {languageOptions.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>
          <button className="btn-primary" onClick={handleLocalizeAudio} disabled={isProcessingAudio || !selectedAudioFile}>
            <span className="icon">🎤</span> {isProcessingAudio ? 'Processing Audio...' : 'Localize Audio'}
          </button>
        </div>

        <div className="localization-results-box">
          {isProcessingAudio && (
            <div className="processing-indicator">
              <span className="icon spinning">⏳</span> 
              <p>Processing Audio</p>
              <small>Converting speech and generating natural voice synthesis...</small>
            </div>
          )}
          {localizationResult && !isProcessingAudio && (
            <>
              <h3>Localized Audio</h3>
              <div className="localized-text-display">
                <p>{localizationResult.transcribedText}</p>
              </div>
              <div className="audio-player">
                <audio controls src={localizationResult.localizedAudioUrl}>
                  Your browser does not support the audio element.
                </audio>
                <p>Duration: {localizationResult.audioDuration}</p>
              </div>
              <button className="btn-success">
                <span className="icon">⬇️</span> Download Localized Audio
              </button>
            </>
          )}
          {!localizationResult && !isProcessingAudio && (
            <div className="placeholder">
              <span className="icon">🎵</span>
              <p>Ready for Audio Processing</p>
              <small>Upload your audio file above to see professional localization results with natural voice synthesis</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AudioLocalization;