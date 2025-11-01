// src/pages/AudioLocalization.js
import React, { useState, useRef } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { localizeAudio, translateDocument } from '../services/api'; 
import { useLiveSpeechRecognition } from '../hooks/useLiveSpeechRecognition'; 
import './AudioLocalization.css'; 

function AudioLocalization() {
  const navigate = useNavigate();
  
  // --- Live Speech Hook Usage ---
  const { 
    transcript, 
    isListening, 
    startListening, 
    stopListening, 
    resetTranscript,
    isSupported: isLiveSTTSupported
  } = useLiveSpeechRecognition();
  
  // --- File Upload State (for compatibility only) ---
  const [selectedAudioFile, setSelectedAudioFile] = useState(null);
  
  // --- Localization States ---
  // Source language defaults to English for browser STT compatibility
  const [sourceLanguage, setSourceLanguage] = useState('en'); 
  const [targetLanguage, setTargetLanguage] = useState('hi');
  const [localizationResult, setLocalizationResult] = useState(null);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);

  // --- Browser TTS States ---
  const [isSpeaking, setIsSpeaking] = useState(false); 
  const browserSpeechSynthRef = useRef(window.speechSynthesis);


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
  

  // --- LIVE CONVERSATION TRANSLATION HANDLERS ---

  const handleLiveTranslate = async (sourceText) => {
    if (!sourceText.trim()) {
        alert('No speech detected to translate.');
        return;
    }
    
    setIsProcessingAudio(true);
    setLocalizationResult(null);

    try {
        // CALL: Text translation endpoint (passes STT result to server)
        const result = await translateDocument(sourceText, targetLanguage, sourceLanguage); 
        
        // 1. Set the results state
        setLocalizationResult({
            transcribedText: sourceText, 
            translatedText: result.translatedContent,
            audioUrl: null, // No server audio file created for live input
        });
        
        // 2. Immediately trigger client TTS playback for conversation feel
        setTimeout(() => handleListenTranslation(result.translatedContent), 100);

    } catch (error) {
        console.error('Live Translation Error:', error);
        alert(`Translation failed. Server returned: ${error.message}`);
    } finally {
        setIsProcessingAudio(false);
    }
  };


  const handleLiveSTTStop = () => {
    stopListening();
    // Do NOT call handleLiveTranslate here. The user clicks the button now.
  };


  // --- FILE UPLOAD FUNCTIONS (Simplified) ---

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Must stop listening if user uploads a file
      if (isListening) stopListening();
      resetTranscript();
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
      handleFileChange({ target: { files: [file] } });
    }
  };


  // --- SERVER LOCALIZATION API CALL (For Uploaded Files) ---

  const handleServerLocalize = async () => {
    if (!selectedAudioFile) {
      alert('Please upload an audio file.');
      return;
    }
    
    setIsProcessingAudio(true);
    setLocalizationResult(null);

    try {
      // --- API CALL to Node.js server for full 3-step pipeline ---
      const result = await localizeAudio(selectedAudioFile, targetLanguage, sourceLanguage);
      
      setLocalizationResult({
        transcribedText: result.transcribedText, 
        translatedText: result.translatedText,   
        audioUrl: result.audioUrl,              
        audioDuration: "N/A" 
      });
      
    } catch (error) {
        console.error('Audio Localization Error (Server):', error);
        alert(`Localization failed. Server returned: ${error.message}`);
    } finally {
        setIsProcessingAudio(false);
    }
  };
  
  // --- PLAYBACK FUNCTION (Client-Side) ---
  
  const handleListenTranslation = (textToSpeak) => {
    if (!textToSpeak) return;
    
    // Stop any existing speech
    browserSpeechSynthRef.current.cancel();

    // Use Web Speech API for audible playback
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      // Use the target language for the voice selection
      utterance.lang = targetLanguage === 'zh' ? 'zh-CN' : targetLanguage; 
      utterance.rate = 1.0; 

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => {
        setIsSpeaking(false);
        console.error("Speech synthesis error.");
        alert("Browser voice failed. Try the generated audio player.");
      };

      browserSpeechSynthRef.current.speak(utterance);
    } else {
      alert('Browser Text-to-Speech is not supported.');
    }
  };
  

  return (
    <div className="audio-localization-page">
      <button className="back-btn" onClick={() => navigate('/')}>← Back to Home</button>
      <h2 className="page-title">AI-Powered Live Audio Translation</h2>
      <p className="page-subtitle">
        Use your microphone to speak and instantly see and hear the translation in the target language.
      </p>

      <div className="info-badges">
        <span className="badge">🗣️ Live Speech</span>
        <span className="badge">🌐 Two-Way Translation</span>
        <span className="badge">🎧 Browser TTS</span>
      </div>

      <div className="steps-indicator">
        <div className="step active">1 Input</div>
        <div className="step">2 Process</div>
        <div className="step">3 Output</div>
      </div>

      <div className="localization-section">
        {/* === LEFT BOX: LIVE MIC INPUT / UPLOAD === */}
        <div className="upload-box" onDragOver={handleDragOver} onDrop={handleDrop}>
          
          <h3 className="text-xl font-semibold mb-4 text-center" style={{color: 'var(--accent-white)'}}>
            1. Input Method
          </h3>
          
          {/* --- SOURCE LANGUAGE SELECTOR (Applies to both Live/File Input) --- */}
          <div className="target-language-selector mb-4">
              <label htmlFor="source-lang">Source Language (Speaking/File)</label>
              <select
              id="source-lang"
              value={sourceLanguage}
              onChange={(e) => { 
                  setSourceLanguage(e.target.value); 
                  resetTranscript(); 
                  setSelectedAudioFile(null); // Clear file as source language changed
              }}
              disabled={isListening || isProcessingAudio}
              >
              {languageOptions.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
              </select>
          </div>

          
          {/* --- LIVE MICROPHONE BUTTONS --- */}
          <div className="flex justify-center space-x-4 mb-4">
            <button 
              onClick={isListening ? handleLiveSTTStop : () => startListening(sourceLanguage)} 
              disabled={isProcessingAudio || !isLiveSTTSupported}
              className={`p-3 rounded-lg text-white transition-all transform shadow-lg ${
                isListening 
                  ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } btn-mic-custom`}
              style={{ minWidth: '180px' }}
            >
              <span className="icon" style={{ fontSize: '1.8rem' }}> 
                {isListening ? '❚❚' : '🎙️'}
              </span>
              {isListening ? ' Stop Speaking' : ' Start Speaking'}
            </button>
          </div>
          
          {/* Live Transcription Display */}
          {isLiveSTTSupported && (
              <div className="p-3 mb-4 rounded-md border border-gray-500 bg-gray-900 bg-opacity-30 text-center text-sm overflow-y-auto min-h-[150px]" style={{color: 'var(--accent-white)', textAlign: 'left'}}>
                  <p className="font-bold mb-1" style={{color: 'var(--text-color-secondary)'}}>Source Text (Live):</p>
                  <div className="text-lg text-white font-medium">
                    {transcript || (isListening ? "Listening..." : "Click 'Start Speaking' to begin.")}
                  </div>
              </div>
          )}


          <p className="text-center mb-4" style={{color: 'var(--text-color-secondary)'}}>--- OR Upload a File ---</p>

          {/* --- FILE UPLOAD AREA & BUTTON --- */}
          <input
            type="file"
            id="audio-upload"
            hidden
            onChange={handleFileChange}
            accept="audio/*" 
            disabled={isListening}
          />
          <label htmlFor="audio-upload" className="drop-area" style={{opacity: isListening ? 0.5 : 1}}>
            <span className="icon">⬇️</span>
            <p>Click to browse files</p>
            <small>MP3, WAV, M4A support (Max 500MB)</small>
          </label>
          
          {/* --- FILE STATUS --- */}
          {selectedAudioFile && (
            <div className="uploaded-file-details mt-4">
              <h4>Source: {selectedAudioFile.name}</h4>
              <p>Type: {selectedAudioFile.type}</p>
              <div className="file-ready-status">
                <span className="checkmark">✅</span> File ready
              </div>
            </div>
          )}

          
          {/* ********** TARGETED LANGUAGE SELECTOR (MOVED HERE) ********** */}
          <div className="target-language-selector mt-6">
              <label htmlFor="target-lang">Target Language (Translation)</label>
              <select
              id="target-lang"
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              disabled={isListening || isProcessingAudio}
              >
              {languageOptions.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
              </select>
          </div>
          {/* **************************************************** */}


          {/* --- NEW TRANSLATE BUTTON (Enabled when transcript exists) --- */}
          {transcript && !isListening && (
              <button 
                  onClick={() => handleLiveTranslate(transcript)} // Uses accumulated transcript
                  disabled={isProcessingAudio}
                  className="btn-primary w-full mt-4"
                  style={{ backgroundColor: 'var(--accent-dark)'}}
              >
                  Translate Live Text & Listen
              </button>
          )}

          {/* --- PROCESS BUTTON (ONLY FOR UPLOADED FILES) --- */}
          <button 
            className="btn-primary w-full mt-4" 
            onClick={handleServerLocalize} 
            disabled={isProcessingAudio || isListening || !selectedAudioFile}
          >
            <span className="icon">⚙️</span> {isProcessingAudio ? 'Processing Audio...' : 'Localize File (Full Pipeline)'}
          </button>
        </div>

        {/* === RIGHT BOX: RESULTS === */}
        <div className="localization-results-box">
          
          <h3 className="text-xl font-semibold mb-4 text-center" style={{color: 'var(--accent-white)'}}>
            2. Localization Results
          </h3>
          
          {isProcessingAudio && (
            <div className="processing-indicator">
              <span className="icon spinning">⏳</span> 
              <p>Processing Data</p>
              <small>Translating transcribed text...</small>
            </div>
          )}
          
          {localizationResult && !isProcessingAudio && (
            <>
              {/* --- SOURCE TRANSCRIPTION --- */}
              <h4 className='text-sm mb-1' style={{color: 'var(--text-color-secondary)'}}>Source Text Transcription:</h4>
              <div className="localized-text-display mb-4">
                <p>{localizationResult.transcribedText}</p>
              </div>

              {/* --- TRANSLATED TEXT & LISTEN ICON --- */}
              <h4 className='text-sm mb-1' style={{color: 'var(--accent-white)', fontWeight: 600}}>Translated Text ({getLanguageName(targetLanguage)}):</h4>
              <div className="localized-text-display mb-6 p-3 flex justify-between items-start">
                  <p className="text-lg font-bold mr-4">{localizationResult.translatedText}</p>
                  
                  {/* NEW: LISTEN AGAIN ICON/BUTTON */}
                  <button 
                      onClick={() => handleListenTranslation(localizationResult.translatedText)}
                      disabled={isSpeaking}
                      className={`flex-shrink-0 p-2 rounded-full transition-colors ${
                          isSpeaking ? 'bg-red-600 animate-pulse' : 'bg-transparent hover:bg-white hover:bg-opacity-10'
                      }`}
                      title={isSpeaking ? 'Stop speaking' : 'Listen again'}
                  >
                      <span className="icon" style={{color: 'var(--accent-dark)'}}>
                          🔊
                      </span>
                  </button>
              </div>
              
              {/* --- AUDIO PLAYBACK --- */}
              <div className="flex flex-col items-center space-y-4">
                
                {/* Generated Audio (File Upload Only) */}
                {localizationResult.audioUrl && (
                    <audio controls src={localizationResult.audioUrl} className="w-full mb-4">
                        Your browser does not support the audio element.
                    </audio>
                )}
                
                {/* Fallback indicator (Only shown if no audio URL is present, i.e., Live Mode) */}
                {!localizationResult.audioUrl && (
                    <p className="text-sm" style={{color: 'var(--text-color-secondary)'}}>
                        Audible output provided by browser voice.
                    </p>
                )}


                {/* --- DOWNLOAD BUTTON --- */}
                {localizationResult.audioUrl && (
                    <a href={localizationResult.audioUrl} download={`translated_audio_${targetLanguage}.mp3`} className="btn-success mt-4 w-full text-center">
                        <span className="icon">⬇️</span> Download Localized Audio
                    </a>
                )}
              </div>
            </>
          )}
          
          {!localizationResult && !isProcessingAudio && (
            <div className="placeholder">
              <span className="icon">🎙️</span>
              <p>Ready for Conversation</p>
              <small>Click 'Start Speaking' to begin real-time speech translation.</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AudioLocalization;