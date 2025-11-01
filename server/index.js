const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const multer = require('multer'); 
// --- UPDATED IMPORTS ---
// const { TranslationServiceClient } = require('@google-cloud/translate'); // REMOVED
const { GoogleGenAI } = require('@google/genai');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// --- API Key Configuration ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; 

// --- Initialize Clients ---
// const translationClient = new TranslationServiceClient(); // REMOVED
// NOTE: We don't need GOOGLE_PROJECT_ID since we are not using TranslationServiceClient
// const GOOGLE_PROJECT_ID = "ageless-accord-475504-h7"; 

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const GEMINI_MODEL = 'gemini-2.5-flash'; 
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Multer and File Utilities
const upload = multer({ dest: 'uploads/' });
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);
const readFileAsync = promisify(fs.readFile);

// Middleware
app.use(cors()); 
app.use(express.json()); 


// --- GEMINI TRANSLATION HELPER (Primary Translation Source) ---
async function callGeminiTranslate(text, targetLang) {
    const prompt = `Translate the following source text accurately into the language corresponding to the ISO 639-1 code "${targetLang}". Only return the translated text: ${text}`;
    
    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });
        
        return response.text.trim();
    } catch (error) {
        console.error("Gemini Translation Error:", error);
        throw new Error(`Gemini translation failed: ${error.message}`);
    }
}


// --- 1. Text Translation (For Live Speech and Text Page) ---
app.post('/api/translate/document', async (req, res) => {
  const { sourceText, targetLanguage } = req.body;
  
  if (!sourceText || !targetLanguage) {
    return res.status(400).json({ error: 'Missing source text or target language.' });
  }

  try {
    // --- USING GEMINI (LLM) for general text ---
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


// --- 2. Full Audio Localization (For Uploaded Files) ---
app.post('/api/localize/audio', upload.single('audio'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No audio file uploaded.' });
    const { targetLanguage, sourceLanguage } = req.body;
    const filePath = req.file.path;
    let audioSourceText = '';
    
    try {
        // --- A. Speech-to-Text (OpenAI Whisper) ---
        console.log("Starting Whisper transcription...");
        
        const audioFileStream = fs.createReadStream(filePath); 

        const transcriptionResponse = await openai.audio.transcriptions.create({
            file: audioFileStream,
            model: "whisper-1",
            language: sourceLanguage, 
        });
        audioSourceText = transcriptionResponse.text;
        
        // --- B. Translation (GEMINI LLM) ---
        const translatedText = await callGeminiTranslate(audioSourceText, targetLanguage);
        
        // --- C. Text-to-Speech (OpenAI TTS) ---
        console.log("Starting TTS synthesis...");
        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy", 
            input: translatedText,
        });

        const audioFileName = `localized_${targetLanguage}_${Date.now()}.mp3`;
        const publicDir = path.join(__dirname, 'public');
        const audioOutputPath = path.join(publicDir, audioFileName);

        if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
        
        const buffer = Buffer.from(await mp3.arrayBuffer());
        await writeFileAsync(audioOutputPath, buffer);

        const audioUrl = `http://localhost:${port}/public/${audioFileName}`;

        res.json({
            transcribedText: audioSourceText, 
            translatedText: translatedText,
            audioUrl: audioUrl,
        });

    } catch (error) {
        console.error('Full Audio Localization Error:', error);
        
        // General error handling for Quota/File issues
        let errorMessage = `Audio localization failed: ${error.message}`;
        if (error.status === 429) {
            errorMessage = "Quota Exceeded. Please check your OpenAI billing/limits.";
        } else if (error.code === 'ENOENT') {
            errorMessage = "File system error. Audio file might be corrupted or missing.";
        } else if (error.code === 16) { 
            errorMessage = `Authentication failed. Check your GOOGLE_APPLICATION_CREDENTIALS path. Details: ${error.message}`;
        }


        res.status(500).json({ error: errorMessage });
    } finally {
        // Clean up the uploaded audio file
        await unlinkAsync(filePath).catch(err => console.error("Cleanup cleanup:", err));
    }
});


// --- 3. Full Video Localization (For Uploaded Files) ---
app.post('/api/localize/video', upload.single('video'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No video file uploaded.' });
    const { targetLanguage, sourceLanguage } = req.body;
    const filePath = req.file.path;
    let uploadedFile = null; 

    try {
        // 1. Upload file to Gemini for processing
        const fileStream = fs.createReadStream(filePath); 
        
        uploadedFile = await ai.files.upload({
            file: fileStream, 
            mimeType: req.file.mimetype, 
            displayName: req.file.filename,
        });
        
        // 2. Multimodal Processing Prompt (Transcription and Translation)
        const gemini_prompt = `Analyze the audio spoken in the uploaded video file, which is primarily in ${sourceLanguage}. Provide the full, accurate transcription of the audio as a single block of text. Then, translate this transcription into ${targetLanguage} and format the output as a clean subtitle block, separated by a newline from the transcription. Do not include timecodes.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', 
            contents: [
                { role: "user", parts: [
                    { text: gemini_prompt },
                    { fileData: { mimeType: uploadedFile.mimetype, fileUri: uploadedFile.uri } }
                ]}
            ]
        });
        
        const fullText = response.text.trim();
        
        const parts = fullText.split('\n\n');
        const translatedSubtitles = parts.length > 1 ? parts.pop() : fullText;
        const transcribedText = fullText; 
        
        res.json({
            transcribedText: transcribedText, 
            translatedSubtitles: translatedSubtitles,
            audioUrl: null, 
            downloadLink: null,
        });

    } catch (error) {
        console.error('Full Video Localization Error:', error);
        res.status(500).json({ error: `Video processing failed: ${error.message}. Check API limits.` });
    } finally {
        // Clean up the uploaded file from Multer temp storage
        await unlinkAsync(filePath).catch(err => console.error("Cleanup cleanup:", err));
        
        // Clean up the file uploaded to Gemini 
        if (uploadedFile && uploadedFile.name) {
            await ai.files.delete({ name: uploadedFile.name }).catch(err => console.warn(`Failed to delete Gemini file: ${err.message}`));
        }
    }
});


// --- Server Setup ---

// Serve static files (like the generated audio)
app.use('/public', express.static(path.join(__dirname, 'public')));


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
