// src/pages/VideoLocalization.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './VideoLocalization.css'; 
// import { localizeVideo } from '../services/api'; // (Uncomment when implementing API)

function VideoLocalization() {
  const navigate = useNavigate();
  const [selectedVideoFile, setSelectedVideoFile] = useState(null);
  const [targetLanguage, setTargetLanguage] = useState('hi');
  const [videoLocalizationResult, setVideoLocalizationResult] = useState(null);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);

  // --- TARGET LANGUAGE LIST (22+ Languages) ---
  const languageOptions = [
    // Major Indian Languages (22 Official)
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
    { code: 'ks', name: 'Kashmiri' },
    { code: 'sa', name: 'Sanskrit' },
    { code: 'sd', name: 'Sindhi' },
    { code: 'ne', name: 'Nepali' },
    { code: 'kok', name: 'Konkani' },
    { code: 'mni', name: 'Manipuri (Meitei)' }, 
    { code: 'doi', name: 'Dogri' },             
    { code: 'bo', name: 'Bodo' },               
    { code: 'mai', name: 'Maithili' },          
    { code: 'sat', name: 'Santali' },           

    // Common International Languages
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'zh', name: 'Chinese (Mandarin)' },
  ];
  // ---------------------------------------------


  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedVideoFile(file);
      setVideoLocalizationResult(null);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedVideoFile(file);
      setVideoLocalizationResult(null);
    }
  };

  const handleLocalizeVideo = async () => {
    if (!selectedVideoFile) {
      alert('Please upload a video file first.');
      return;
    }
    if (!targetLanguage) {
      alert('Please select a target language for subtitles.');
      return;
    }

    setIsProcessingVideo(true);
    
    // In a real application, you would call localizeVideo(selectedVideoFile, targetLanguage)
    console.log(`Localizing video ${selectedVideoFile.name} with subtitles in ${targetLanguage}...`);
    await new Promise(resolve => setTimeout(resolve, 8000)); 

    setVideoLocalizationResult({
      subtitlesGenerated: true,
      subtitleContent: "[00:00:01] Hello, and welcome to SafeHorizon. [00:00:03] We make localization easy. [00:00:05] नमस्ते, और SafeHorizon में आपका स्वागत है। [00:00:07] हम स्थानीयकरण को आसान बनाते हैं।",
      downloadLink: "https://example.com/localized-video-subtitles.srt"
    });
    setIsProcessingVideo(false);
  };
  
  // Helper to display full language name in the UI
  const getLanguageName = (code) => {
    const lang = languageOptions.find(opt => opt.code === code);
    return lang ? lang.name : code;
  };

  return (
    <div className="video-localization-page">
      <button className="back-btn" onClick={() => navigate('/')}>← Back to Home</button>
      <h2 className="page-title">AI-Powered Video Localization</h2>
      <p className="page-subtitle">
        Generate accurate subtitles, translate content, and create professional localized videos with advanced AI technology.
      </p>

      <div className="info-badges">
        <span className="badge">🎬 HD Video Processing</span>
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
        <div className="upload-box" onDragOver={handleDragOver} onDrop={handleDrop}>
          <input
            type="file"
            id="video-upload"
            hidden
            onChange={handleFileChange}
            accept=".mp4,.avi,.mov,.webm"
          />
          <label htmlFor="video-upload" className="drop-area">
            <span className="icon">▶️</span>
            <p>Drop your video file here</p>
            <small>or click to browse files</small>
            <ul>
              <li>• MP4, AVI, MOV support</li>
              <li>• WebM format included</li>
              <li>• Maximum 500MB</li>
              <li>• HD quality processing</li>
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

          <div className="target-language-selector">
            <label htmlFor="subtitle-target-lang">Target Language for Subtitles</label>
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
          <button className="btn-primary" onClick={handleLocalizeVideo} disabled={isProcessingVideo || !selectedVideoFile || !targetLanguage}>
            <span className="icon">⚙️</span> {isProcessingVideo ? 'Processing Video...' : 'Localize Video'}
          </button>
        </div>

        <div className="localization-results-box">
          {isProcessingVideo && (
            <div className="processing-indicator">
              <span className="icon spinning">⏳</span>
              <p>Processing Video</p>
              <small>Generating subtitles and localizing content...</small>
            </div>
          )}
          {videoLocalizationResult && !isProcessingVideo && (
            <>
              <h3>Localization Results</h3>
              <p>Subtitles have been generated for your video in {getLanguageName(targetLanguage)}!</p>
              <button className="btn-success">
                <span className="icon">⬇️</span> Download Subtitles (SRT)
              </button>
            </>
          )}
          {!videoLocalizationResult && !isProcessingVideo && (
            <div className="placeholder">
              <span className="icon">🎥</span>
              <p>Ready for Video Processing</p>
              <small>Upload a video file and select a target language to generate professional subtitles</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VideoLocalization;