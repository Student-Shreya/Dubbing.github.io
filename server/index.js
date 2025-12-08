// const express = require('express');
// const cors = require('cors');
// const fs = require('fs');
// const path = require('path');
// const { promisify } = require('util');
// const multer = require('multer'); 
// const axios = require('axios');
// const youtubedl = require('youtube-dl-exec');
// const { exec } = require('child_process'); // <<< NODE CHILD PROCESS
// // --- UPDATED IMPORTS ---
// // Removed dependencies on Google Cloud Translation and explicit OpenAI
// // const { TranslationServiceClient } = require('@google-cloud/translate'); 
// const { GoogleGenAI } = require('@google/genai');
// // const { OpenAI } = require('openai'); 
// require('dotenv').config();

// const app = express();
// const port = process.env.PORT || 5000;

// // --- API Key Configuration ---
// const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
// // Removed Murf/Duplud and OpenAI keys from Node.js reading

// // --- Initialize Clients ---
// // REMOVED: const translationClient = new TranslationServiceClient();
// // REMOVED: const GOOGLE_PROJECT_ID = "ageless-accord-475504-h7"; 

// const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
// const GEMINI_MODEL = 'gemini-2.5-flash'; 
// // REMOVED: const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// // Multer and File Utilities
// const upload = multer({ dest: 'uploads/' });
// const writeFileAsync = promisify(fs.writeFile);
// const unlinkAsync = promisify(fs.unlink);
// const readFileAsync = promisify(fs.readFile);

// // Middleware
// app.use(cors()); 
// app.use(express.json()); 


// // --- GEMINI TRANSLATION HELPER (Used for ALL Translation) ---
// async function callGeminiTranslate(text, targetLang) {
//     // This replaces all previous Google Cloud Translation SDK calls
//     const prompt = `Translate the following source text accurately into the language corresponding to the ISO 639-1 code "${targetLang}". Only return the translated text: ${text}`;
    
//     try {
//         const response = await ai.models.generateContent({
//             model: GEMINI_MODEL,
//             contents: [{ role: "user", parts: [{ text: prompt }] }],
//         });
        
//         return response.text.trim();
//     } catch (error) {
//         throw new Error(`Gemini translation failed: ${error.message}`);
//     }
// }

// // --- EXTERNAL TRANSCRIPTION HELPER (Runs Python Script) ---
// function runWhisperSTT(filePath) {
//     return new Promise((resolve, reject) => {
//         // Command format: python whisper_stt.py "path/to/file.mp3"
//         const pythonCommand = `python ${path.join(__dirname, 'whisper_stt.py')} "${filePath}"`;
        
//         exec(pythonCommand, (error, stdout, stderr) => {
//             if (error) {
//                 console.error(`Exec Error (STT): ${error.message}`);
//                 let pythonError = stderr;
//                 try {
//                     const errorObj = JSON.parse(stderr.trim());
//                     pythonError = errorObj.error || stderr.trim();
//                 } catch (e) {
//                     pythonError = stderr.trim();
//                 }
//                 return reject(new Error(`STT failed: ${pythonError}`));
//             }
            
//             // Success: stdout contains the transcribed text
//             resolve(stdout.trim());
//         });
//     });
// }
// // --- END EXTERNAL TRANSCRIPTION HELPER ---


// // --- 1. Text Translation (For Live Speech and Text Page) ---
// app.post('/api/translate/document', async (req, res) => {
//   const { sourceText, targetLanguage } = req.body;
  
//   if (!sourceText || !targetLanguage) {
//     return res.status(400).json({ error: 'Missing source text or target language.' });
//   }

//   try {
//     // --- USING GEMINI (LLM) for general text ---
//     const translatedText = await callGeminiTranslate(sourceText, targetLanguage);
    
//     res.json({
//       transcribedText: sourceText,
//       translatedContent: translatedText,
//       sourceLanguage: 'auto', 
//       targetLanguage: targetLanguage,
//     });

//   } catch (error) {
//     console.error('Live Text translation error:', error.message);
//     res.status(500).json({ error: `Translation Failed: ${error.message}` });
//   }
// });


// // --- 2. Full Audio Localization (For Uploaded Files - USING LOCAL WHISPER) ---
// app.post('/api/localize/audio', upload.single('audio'), async (req, res) => {
//     if (!req.file) return res.status(400).json({ error: 'No audio file uploaded.' });
//     const { targetLanguage, sourceLanguage } = req.body;
//     const filePath = req.file.path;
//     let audioSourceText = '';
    
//     try {
//         // --- A. Speech-to-Text (LOCAL WHISPER VIA PYTHON) ---
//         console.log("Starting local Python Whisper transcription...");
//         audioSourceText = await runWhisperSTT(filePath); 
        
//         if (!audioSourceText) {
//              throw new Error("STT failed: Transcription returned empty text.");
//         }
        
//         // --- B. Translation (GEMINI LLM) ---
//         const translatedText = await callGeminiTranslate(audioSourceText, targetLanguage);
        
//         // --- C. Text-to-Speech (SIMULATION) ---
//         const audioUrl = `http://localhost:${port}/public/simulated_audio.mp3`; 
        
//         res.json({
//             transcribedText: audioSourceText, 
//             translatedText: translatedText,
//             audioUrl: audioUrl,
//         });

//     } catch (error) {
//         console.error('Full Audio Localization Error:', error);
        
//         let errorMessage = `Audio localization failed: ${error.message}`;
//         if (errorMessage.includes("STT failed: Failed to load Whisper model")) {
//              errorMessage = `STT Failed: Python Environment or FFmpeg Missing. See server console for details.`;
//         } else if (error.code === 'ENOENT' || error.code === 'EPERM') {
//              errorMessage = `File Permission Error. Run server as Administrator or check file paths.`;
//         } 


//         res.status(500).json({ error: errorMessage });
//     } finally {
//         // Clean up the uploaded audio file
//         await unlinkAsync(filePath).catch(err => console.error("Cleanup cleanup:", err));
//     }
// });


// // --- 3. Full Video Localization (YOUTUBE URL PROCESSING - GEMINI STABLE) ---
// app.post('/api/localize/video', async (req, res) => {
//     const { videoUrl, targetLanguage, sourceLanguage } = req.body;
    
//     if (!videoUrl) return res.status(400).json({ error: 'Missing video URL.' });

//     // Use a placeholder name for the downloaded file
//     const DOWNLOAD_PATH = path.join(__dirname, 'uploads', `youtube_audio_${Date.now()}.mp3`);
//     let uploadedFile = null; 
//     let transcribedText = '';
    
//     try {
//         // 1. Download Audio from YouTube URL
//         console.log(`Downloading audio from YouTube URL: ${videoUrl}`);
        
//         const downloadResult = await youtubedl(videoUrl, {
//             output: DOWNLOAD_PATH,
//             extractAudio: true,
//             audioFormat: 'mp3',
//             format: 'bestaudio',
//             noWarnings: true,
//             limitRate: '1M',
//         });
        
//         if (!fs.existsSync(DOWNLOAD_PATH)) {
//             throw new Error(`Failed to download audio. Check video URL validity or yt-dlp installation.`);
//         }
        
//         // 2. STT (LOCAL WHISPER VIA PYTHON)
//         console.log("Starting local Python Whisper transcription...");
//         transcribedText = await runWhisperSTT(DOWNLOAD_PATH); // <<< Use local Whisper for STT
        
//         if (!transcribedText) {
//             throw new Error("Video transcription failed: Whisper returned empty text.");
//         }
        
//         // 3. Translation (GEMINI LLM)
//         const translatedText = await callGeminiTranslate(transcribedText, targetLanguage);
        
        
//         // 4. Subtitle Formatting (Final output text)
//         const formattedSubtitles = `Original Transcription (${sourceLanguage}):\n${transcribedText}\n\nTranslated Subtitles (${targetLanguage}):\n${translatedText}`;
        
        
//         res.json({
//             transcribedText: transcribedText, 
//             translatedSubtitles: formattedSubtitles,
//             audioUrl: null, // No synthesized audio track generated here
//             downloadLink: null,
//         });

//     } catch (error) {
//         console.error('Full Video Localization Error:', error);
//         res.status(500).json({ error: `Video processing failed: ${error.message}. Check local FFmpeg/Python setup.` });
//     } finally {
//         // 6. Clean up the downloaded audio file
//         if (fs.existsSync(DOWNLOAD_PATH)) {
//             await unlinkAsync(DOWNLOAD_PATH).catch(console.error);
//         }
//     }
// });


// // --- Server Setup ---

// // Serve static files (like the generated audio)
// app.use('/public', express.static(path.join(__dirname, 'public')));


// app.listen(port, () => {
//   console.log(`Server running on http://localhost:${port}`);
// });




const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const multer = require('multer'); 
const axios = require('axios');
const youtubedl = require('youtube-dl-exec');
const { exec } = require('child_process'); // <<< NODE CHILD PROCESS
// --- UPDATED IMPORTS (CLEANED) ---
const { GoogleGenAI } = require('@google/genai');
// Removed: TranslationServiceClient, OpenAI, Murf dependencies
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// --- API Key Configuration ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
// Removed all other API keys (OpenAI, Murf, Duplud)

// --- Initialize Clients ---
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const GEMINI_MODEL = 'gemini-2.5-flash'; 
// Removed: openai client initialization

// Multer and File Utilities
const upload = multer({ dest: 'uploads/' });
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);
const readFileAsync = promisify(fs.readFile);

// Middleware
app.use(cors()); 
app.use(express.json()); 


// --- GEMINI TRANSLATION HELPER (Used for ALL Translation) ---
async function callGeminiTranslate(text, targetLang) {
    // This LLM call replaces the Google Cloud Translation SDK
    const prompt = `Translate the following source text accurately into the language corresponding to the ISO 639-1 code "${targetLang}". Only return the translated text: ${text}`;
    
    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });
        
        return response.text.trim();
    } catch (error) {
        throw new Error(`Gemini translation failed: ${error.message}`);
    }
}

// --- EXTERNAL TRANSCRIPTION HELPER (Runs Python Script) ---
function runWhisperSTT(filePath) {
    return new Promise((resolve, reject) => {
        // Command format: python whisper_stt.py "path/to/file.mp3"
        const pythonCommand = `python ${path.join(__dirname, 'whisper_stt.py')} "${filePath}"`;
        
        exec(pythonCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`Exec Error (STT): ${error.message}`);
                let pythonError = stderr;
                try {
                    const errorObj = JSON.parse(stderr.trim());
                    pythonError = errorObj.error || stderr.trim();
                } catch (e) {
                    pythonError = stderr.trim();
                }
                return reject(new Error(`STT failed: ${pythonError}`));
            }
            
            // Success: stdout contains the transcribed text
            resolve(stdout.trim());
        });
    });
}
// --- END EXTERNAL TRANSCRIPTION HELPER ---


// --- 1. Text Translation (For Live Speech and Text Page) ---
app.post('/api/translate/document', async (req, res) => {
  const { sourceText, targetLanguage } = req.body;
  
  if (!sourceText || !targetLanguage) {
    return res.status(400).json({ error: 'Missing source text or target language.' });
  }

  try {
    const translatedText = await callGeminiTranslate(sourceText, targetLanguage);
    
    res.json({
      transcribedText: sourceText,
      translatedContent: translatedText,
      sourceLanguage: 'auto', 
      targetLanguage: targetLanguage,
    });

  } catch (error) {
    console.error('Live Text translation error:', error.message);
    res.status(500).json({ error: `Translation Failed: ${error.message}` });
  }
});


// --- 2. Full Audio Localization (For Uploaded Files - USING LOCAL WHISPER) ---
app.post('/api/localize/audio', upload.single('audio'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No audio file uploaded.' });
    const { targetLanguage, sourceLanguage } = req.body;
    const filePath = req.file.path;
    let audioSourceText = '';
    
    try {
        // --- A. Speech-to-Text (LOCAL WHISPER VIA PYTHON) ---
        console.log("Starting local Python Whisper transcription...");
        audioSourceText = await runWhisperSTT(filePath); // <<< Using Python Child Process
        
        if (!audioSourceText) {
             throw new Error("STT failed: Transcription returned empty text.");
        }
        
        // --- B. Translation (GEMINI LLM) ---
        const translatedText = await callGeminiTranslate(audioSourceText, targetLanguage);
        
        // --- C. Text-to-Speech (SIMULATION) ---
        // Since all external TTS is removed, we simulate audio creation.
        const audioUrl = `http://localhost:${port}/public/simulated_audio.mp3`; 
        
        res.json({
            transcribedText: audioSourceText, 
            translatedText: translatedText,
            audioUrl: audioUrl,
        });

    } catch (error) {
        console.error('Full Audio Localization Error:', error);
        
        let errorMessage = `Audio localization failed: ${error.message}`;
        if (errorMessage.includes("STT failed: Failed to load Whisper model")) {
             errorMessage = `STT Failed: Python Environment or FFmpeg Missing. See server console for details.`;
        } else if (error.code === 'ENOENT' || error.code === 'EPERM') {
             errorMessage = `File Permission Error. Run server as Administrator or check file paths.`;
        } 


        res.status(500).json({ error: errorMessage });
    } finally {
        // Clean up the uploaded audio file
        await unlinkAsync(filePath).catch(err => console.error("Cleanup cleanup:", err));
    }
});


// --- 3. Full Video Localization (YOUTUBE URL PROCESSING) ---
app.post('/api/localize/video', async (req, res) => {
    const { videoUrl, targetLanguage, sourceLanguage } = req.body;
    
    if (!videoUrl) return res.status(400).json({ error: 'Missing video URL.' });

    // Use a placeholder name for the downloaded file
    const DOWNLOAD_PATH = path.join(__dirname, 'uploads', `youtube_audio_${Date.now()}.mp3`);
    let uploadedFile = null; 
    let transcribedText = '';
    
    try {
        // 1. Download Audio from YouTube URL
        console.log(`Downloading audio from YouTube URL: ${videoUrl}`);
        
        const downloadResult = await youtubedl(videoUrl, {
            output: DOWNLOAD_PATH,
            extractAudio: true,
            audioFormat: 'mp3',
            format: 'bestaudio',
            noWarnings: true,
            limitRate: '1M',
        });
        
        if (!fs.existsSync(DOWNLOAD_PATH)) {
            throw new Error(`Failed to download audio. Check video URL validity or yt-dlp installation.`);
        }
        
        // 2. STT (LOCAL WHISPER VIA PYTHON)
        console.log("Starting Whisper transcription for downloaded audio...");
        transcribedText = await runWhisperSTT(DOWNLOAD_PATH); // <<< Use local Whisper for STT
        
        if (!transcribedText) {
            throw new Error("Video transcription failed: Whisper returned empty text.");
        }
        
        // 3. Translation (GEMINI LLM)
        const translatedText = await callGeminiTranslate(transcribedText, targetLanguage);
        
        
        // 4. Subtitle Formatting (Final output text)
        const formattedSubtitles = `Original Transcription (${sourceLanguage}):\n${transcribedText}\n\nTranslated Subtitles (${targetLanguage}):\n${translatedText}`;
        
        
        res.json({
            transcribedText: transcribedText, 
            translatedSubtitles: formattedSubtitles,
            audioUrl: null, // No synthesized audio track generated here
            downloadLink: null,
        });

    } catch (error) {
        console.error('Full Video Localization Error:', error);
        res.status(500).json({ error: `Video processing failed: ${error.message}. Check local FFmpeg/Python setup.` });
    } finally {
        // 6. Clean up the downloaded audio file
        if (fs.existsSync(DOWNLOAD_PATH)) {
            await unlinkAsync(DOWNLOAD_PATH).catch(console.error);
        }
    }
});


// --- Server Setup ---

// Serve static files (like the generated audio)
app.use('/public', express.static(path.join(__dirname, 'public')));


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});