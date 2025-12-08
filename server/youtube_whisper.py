import whisper
import os
import sys
import json
import codecs # <<< NEW IMPORT

# --- CONFIG ---
# The model size (e.g., 'small', 'base') should be based on VRAM/speed trade-off
MODEL_SIZE = "small" 

# --- FORCE UTF-8 ENCODING FIX ---
# Set stdout encoding to UTF-8 to handle Unicode characters (fixes Windows console crash)
sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())
# --------------------------------

def transcribe_audio_file(audio_path: str):
    """
    Transcribes the specified audio file using the local Whisper model.
    """
    # 1. Load the Whisper model
    try:
        # Note: This is where the Python script attempts to download the model files.
        model = whisper.load_model(MODEL_SIZE)
    except Exception as e:
        # Send error to standard error stream
        print(json.dumps({"error": f"Failed to load Whisper model '{MODEL_SIZE}': {e}"}), file=sys.stderr)
        return ""

    try:
        # 2. Transcribe the audio file
        # Whisper automatically handles format conversion via FFmpeg
        result = model.transcribe(audio_path)
        
        # 3. Return the resulting text
        transcribed_text = result["text"].strip()
        
        return transcribed_text

    except Exception as e:
        print(json.dumps({"error": f"Transcription failed: {e}"}), file=sys.stderr)
        return ""


if __name__ == "__main__":
    # The Node.js server passes the audio file path as the first argument (sys.argv[1])
    if len(sys.argv) > 1:
        audio_file_path = sys.argv[1]
        
        # Ensure the path is valid before proceeding
        if os.path.exists(audio_file_path):
            transcription = transcribe_audio_file(audio_file_path)
            
            # Print result to standard output (stdout) for Node.js to capture
            if transcription:
                print(transcription)
            else:
                print(json.dumps({"error": "Transcription returned empty result."}), file=sys.stderr)
        else:
            print(json.dumps({"error": f"Input file not found at {audio_file_path}"}), file=sys.stderr)
    else:
        print(json.dumps({"error": "No audio file path provided."}), file=sys.stderr)