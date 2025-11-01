// src/pages/VideoLocalization.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { localizeVideo } from '../services/api'; 
import './VideoLocalization.css'; 

function VideoLocalization() {
  const navigate = useNavigate();
  const [selectedVideoFile, setSelectedVideoFile] = useState(null);
  const [targetLanguage, setTargetLanguage] = useState('hi');
  const [sourceVideoLanguage, setSourceVideoLanguage] = useState('en'); 
  const [localizationResult, setLocalizationResult] = useState(null);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);

  // --- TARGETED LANGUAGE LIST (22+ Languages) ---
  const languageOptions = [
    // Indian Languages
    { code: 'hi', name: 'Hindi' }, 
    { code: 'mr', name: 'Marathi' },
    { code: 'bn', name: 'Bengali (Bangla)' }, 
    { code: 'te', name: 'Telugu' },
    { code: 'ta', name: 'Tamil' }, 
    { code: 'gu', name: 'Gujarati' },
    { code: 'kn', name: 'Kannada' }, 
    { code: 'ml', name: 'Malayalam' },
    { code: 'pa', name: 'Punjabi' }, 
    { code: 'or', name: 'Odia (Oriya)' },
    { code: 'as', name: 'Assamese' }, 
    { code: 'ur', name: 'Urdu' },
    // International Languages
    { code: 'en', name: 'English' }, 
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' }, 
    { code: 'de', 'name': 'German' },
    { code: 'zh', 'name': 'Chinese (Mandarin)' },
  ];
  // ---------------------------------------------


  // Helper to display full language name in the UI
  const getLanguageName = (code) => {
    const lang = languageOptions.find(opt => opt.code === code);
    return lang ? lang.name : code;
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedVideoFile(file);
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
      handleFileChange({ target: { files: [file] } });
    }
  };

  const handleLocalizeVideo = async () => {
    if (!selectedVideoFile) {
      alert('Please upload a video file first.');
      return;
    }
    if (!targetLanguage || !sourceVideoLanguage) {
      alert('Please select both source and target languages.');
      return;
    }

    setIsProcessingVideo(true);
    setLocalizationResult(null);

    try {
      // Pass the video file, target language, and source language to the server
      const result = await localizeVideo(selectedVideoFile, targetLanguage, sourceVideoLanguage);
      
      setLocalizationResult({
        transcribedText: result.transcribedText,
        translatedSubtitles: result.translatedSubtitles, // Subtitles text
        audioUrl: result.audioUrl, // New translated audio track URL (if generated)
        downloadLink: result.downloadLink,
      });
      
    } catch (error) {
        console.error('Video Localization Error:', error);
        alert(`Video Localization failed. Server returned: ${error.message}`);
    } finally {
        setIsProcessingVideo(false);
    }
  };

  // Function to create a downloadable Blob for the subtitles
  const createSrtBlob = (subtitleText) => {
    return new Blob([subtitleText], { type: 'text/plain;charset=utf-8' });
  };


  return (
    <div className="video-localization-page">
      <button className="back-btn" onClick={() => navigate('/')}>← Back to Home</button>
      <h2 className="page-title">AI-Powered Video Localization</h2>
      <p className="page-subtitle">
        Generate accurate subtitles and translated audio tracks using Gemini AI.
      </p>

      <div className="info-badges">
        <span className="badge">🎬 Multimodal AI</span>
        <span className="badge">📝 Subtitle Generation</span>
        <span className="badge">🌐 Multi-language Support</span>
      </div>

      <div className="steps-indicator">
        <div className="step active">1 Upload</div>
        <div className="step">2 Language</div>
        <div className="step">3 Process</div>
        <div className="step">4 Download</div>
      </div>

      <div className="localization-section">
        {/* === LEFT BOX: INPUT === */}
        <div className="upload-box" onDragOver={handleDragOver} onDrop={handleDrop}>
          <h3 className="text-xl font-semibold mb-4 text-center" style={{color: 'var(--accent-white)'}}>
            1. Upload Video File
          </h3>

          <input
            type="file"
            id="video-upload"
            hidden
            onChange={handleFileChange}
            accept="video/mp4,video/avi,video/mov"
          />
          <label htmlFor="video-upload" className="drop-area">
            <span className="icon">▶️</span>
            <p>Drop your video file here</p>
            <small>or click to browse files</small>
            <ul>
              <li>• MP4, MOV support</li>
              <li>• Maximum 500MB (GCS required for large files)</li>
            </ul>
          </label>
          {selectedVideoFile && (
            <div className="uploaded-file-details">
              <h4>{selectedVideoFile.name}</h4>
              <p>Size: {(selectedVideoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
              <div className="file-ready-status">
                <span className="checkmark">✅</span> Video file ready for processing
              </div>
            </div>
          )}

          <div className="target-language-selector mt-6">
            <label htmlFor="source-video-lang">Source Video Language</label>
            <select
              id="source-video-lang"
              value={sourceVideoLanguage}
              onChange={(e) => setSourceVideoLanguage(e.target.value)}
            >
              <option value="">Select source language...</option>
              {languageOptions.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>
          
          <div className="target-language-selector mt-4">
            <label htmlFor="subtitle-target-lang">Target Language (Translation)</label>
            <select
              id="subtitle-target-lang"
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
            >
              <option value="">Select target language...</option>
              {languageOptions.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>
          <button className="btn-primary mt-6 w-full" onClick={handleLocalizeVideo} disabled={isProcessingVideo || !selectedVideoFile || !targetLanguage || !sourceVideoLanguage}>
            <span className="icon">⚙️</span> {isProcessingVideo ? 'Processing Video...' : 'Localize Video'}
          </button>
        </div>

        {/* === RIGHT BOX: RESULTS === */}
        <div className="localization-results-box">
          <h3 className="text-xl font-semibold mb-4 text-center" style={{color: 'var(--accent-white)'}}>
            2. Localization Results
          </h3>
          
          {isProcessingVideo && (
            <div className="processing-indicator">
              <span className="icon spinning">⏳</span>
              <p>Processing Video</p>
              <small>Transcribing audio and generating translated subtitles...</small>
            </div>
          )}
          {localizationResult && !isProcessingVideo && (
            <>
              {/* Optional Audio Player for the new dubbed audio (if generated) */}
              {localizationResult.audioUrl && (
                  <div className="mb-4">
                      <h4 className='text-sm mb-1' style={{color: 'var(--accent-white)', fontWeight: 600}}>Translated Audio Track</h4>
                      <audio controls src={localizationResult.audioUrl} className="w-full">
                          Your browser does not support the audio element.
                      </audio>
                  </div>
              )}


              <h4 className='text-sm mb-1' style={{color: 'var(--accent-white)', fontWeight: 600}}>
                Generated Subtitles (Translated)
              </h4>
              <div className="localized-text-display mb-6 p-3 overflow-y-auto max-h-[150px]">
                {/* Translated Subtitle Content Display */}
                <pre className="text-sm" style={{whiteSpace: 'pre-wrap', fontFamily: 'monospace', color: 'var(--text-color-secondary)'}}>
                    {localizationResult.translatedSubtitles || "Translation result not found. Check server logs."}
                </pre>
              </div>

              <h4 className='text-sm mb-1' style={{color: 'var(--text-color-secondary)', fontWeight: 400}}>
                Source Transcription
              </h4>
              <div className="localized-text-display mb-6 p-3 overflow-y-auto max-h-[100px]" style={{backgroundColor: 'var(--bg-deep-dark)'}}>
                <pre className="text-sm" style={{whiteSpace: 'pre-wrap', fontFamily: 'monospace', color: 'var(--text-color-dim)'}}>
                    {localizationResult.transcribedText || "Transcription not returned."}
                </pre>
              </div>


              {/* Download Button - for the Subtitle File (.SRT) */}
              <a 
                href={URL.createObjectURL(createSrtBlob(localizationResult.translatedSubtitles))}
                download={`subtitles_${targetLanguage}.srt`}
                className="btn-success mt-4 w-full text-center"
              >
                <span className="icon">⬇️</span> Download Subtitles (.SRT)
              </a>
            </>
          )}
          {!localizationResult && !isProcessingVideo && (
            <div className="placeholder">
              <span className="icon">🎥</span>
              <p>Ready for Video Processing</p>
              <small>Upload a video file to generate professional subtitles.</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VideoLocalization;