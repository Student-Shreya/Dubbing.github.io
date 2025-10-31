// server/index.js
require('dotenv').config(); // Load environment variables from .env

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const { promisify } = require('util');
const multer = require('multer'); // For handling file uploads (Audio Localization)

const app = express();
const port = process.env.PORT || 5000;

// --- API Key Configuration ---
const GOOGLE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY; // Used in custom endpoint helper
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Initialize OpenAI Client
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Middleware
app.use(cors()); 
app.use(express.json()); // Essential for parsing JSON body

// Multer for file uploads (stores uploads in 'uploads/' directory)
const upload = multer({ dest: 'uploads/' });

// Promisify fs functions for async/await usage
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);


// --- Helper function for Text Translation (Undocumented Google Endpoint) ---
async function callGoogleTranslate(text, targetLang, sourceLang = 'auto') {
    // The requested unsupported URL
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url);

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google Translation Service failed (Status: ${response.status}).`);
    }

    let data;
    try {
        data = await response.json();
    } catch (e) {
        throw new Error("Received invalid response from translation service.");
    }
    
    // CRITICAL: Checks for the expected array structure from the undocumented API
    if (!data || !Array.isArray(data[0])) {
        throw new Error("Unexpected translation response format. Service may be blocking requests.");
    }
    
    // Concatenate all translated segments
    const translatedText = data[0].map(segment => segment[0]).join('');
    
    // Attempt to detect source language
    const detectedSource = data[2] || sourceLang; 
    
    return { translation: translatedText, detectedSource: detectedSource };
}


// --- API Endpoints ---

// 1. Text Translation (Client path: /text-translation)
app.post('/api/translate/document', async (req, res) => {
  const { sourceText, targetLanguage, sourceLanguage } = req.body;
  
  if (!sourceText || !targetLanguage) {
    return res.status(400).send('Missing source text or target language.');
  }

  try {
    const { translation, detectedSource } = await callGoogleTranslate(sourceText, targetLanguage, sourceLanguage);

    res.json({
      originalContent: sourceText,
      translatedContent: translation,
      sourceLanguage: detectedSource,
      targetLanguage: targetLanguage,
    });

  } catch (error) {
    console.error('Text translation error:', error.message);
    res.status(500).send(`Error translating text: ${error.message}`);
  }
});


// 2. Text-to-Speech Generation (For Text Translation Page output)
app.post('/api/generate/speech', async (req, res) => {
    const { text, targetLanguage } = req.body; 

    if (!text) {
        return res.status(400).send('Missing text for speech generation.');
    }
    
    try {
        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy", // Using a standard voice
            input: text,
        });

        const audioFileName = `tts_output_${Date.now()}.mp3`;
        const publicDir = path.join(__dirname, 'public');
        const audioOutputPath = path.join(publicDir, audioFileName);

        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir);
        }

        const buffer = Buffer.from(await mp3.arrayBuffer());
        await writeFileAsync(audioOutputPath, buffer);

        const audioUrl = `http://localhost:${port}/public/${audioFileName}`;

        res.json({
            message: 'Speech generated successfully',
            audioUrl: audioUrl,
        });

    } catch (error) {
        console.error('OpenAI TTS Error:', error);
        res.status(500).send(`Error generating speech via OpenAI: ${error.message}`);
    }
});


// 3. Full Audio Localization (STT -> Translate -> TTS)
app.post('/api/localize/audio', upload.single('audio'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No audio file uploaded.');
    }
    const { targetLanguage } = req.body;
    const filePath = req.file.path;
    
    try {
        // --- A. Speech-to-Text (using OpenAI Whisper) ---
        console.log("Starting Whisper transcription...");
        const transcriptionResponse = await openai.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: "whisper-1",
        });
        const transcription = transcriptionResponse.text;
        
        // --- B. Translation (using the undocumented Google API helper) ---
        console.log(`Translating text to ${targetLanguage}...`);
        const { translation } = await callGoogleTranslate(transcription, targetLanguage);
        
        // --- C. Text-to-Speech (using OpenAI TTS) ---
        console.log("Starting TTS synthesis...");
        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy", // Standard voice
            input: translation,
        });

        // 1. Define file path for the output audio
        const audioFileName = `localized_${Date.now()}.mp3`;
        const publicDir = path.join(__dirname, 'public');
        const audioOutputPath = path.join(publicDir, audioFileName);

        // 2. Write the audio buffer to a file
        const buffer = Buffer.from(await mp3.arrayBuffer());
        await writeFileAsync(audioOutputPath, buffer);

        // 3. Respond with the public URL
        const audioUrl = `http://localhost:${port}/public/${audioFileName}`;

        res.json({
            transcribedText: transcription,
            translatedText: translation,
            audioUrl: audioUrl,
        });

    } catch (error) {
        console.error('Full Audio Localization Error:', error);
        res.status(500).send(`Error during audio processing: ${error.message}`);
    } finally {
        // Clean up the uploaded audio file from 'uploads/'
        await unlinkAsync(filePath).catch(err => console.error("Cleanup error:", err));
    }
});


// 4. Text Refinement (Uses OpenAI API Key)
app.post('/api/refine/text', async (req, res) => {
    const { text, targetLanguage } = req.body;
    
    if (!text || !targetLanguage) return res.status(400).send('Missing text or target language.');

    try {
        const prompt = `You are a professional localization editor. Refine the following ${targetLanguage} translation to be culturally appropriate, fluent, and professional. Only return the refined text. Translation to refine: "${text}"`;
        
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
        });
        
        const refinedText = response.choices[0].message.content.trim();

        res.json({ refinedText });
    } catch (error) {
        console.error('OpenAI refinement error:', error.message);
        res.status(500).send(`Error refining text: ${error.message}`);
    }
});


// --- Server Setup ---

// IMPORTANT: Serve static files (like the generated audio)
app.use('/public', express.static(path.join(__dirname, 'public')));


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});