# import whisper

# import os



# def transcribe_audio_file(audio_path):

#     """

#     Transcribes the specified audio file using the Whisper model.

#     """

#     try:

#         # 1. Load the Whisper model

#         print("Loading Whisper model...")

#         model = whisper.load_model("small")

#         print("Model loaded successfully.")



#         # 2. Transcribe the audio file

#         print(f"Transcribing audio file: {audio_path}...")

#         # FFmpeg handles the .webm format conversion for Whisper

#         result = model.transcribe(audio_path)



#         # 3. Print the resulting text

#         transcribed_text = result["text"]

#         print("\n--- Transcription Result ---")

#         print(transcribed_text)

#         print("--------------------------\n")



#         return transcribed_text



#     except FileNotFoundError:

#         print(f"Error: The audio file '{audio_path}' was not found. Please ensure it exists.")

#     except Exception as e:

#         print(f"An error occurred during transcription: {e}")





# # --- Main Execution ---

# if __name__ == "__main__":

#     # Define the path to your audio file

#     # *** CHANGED TO REFLECT THE .WEBM EXTENSION ***

#     audio_file = "audio.webm"



#     # Check if the audio file exists before attempting to transcribe

#     if os.path.exists(audio_file):

#         transcribe_audio_file(audio_file)

#     else:

#         print(f"Error: Audio file not found. Please make sure '{audio_file}' exists in the current directory.")




        

import whisper
import os
import sys
import json

# --- CONFIG ---
# The model size (e.g., 'small', 'base') should be based on VRAM/speed trade-off
MODEL_SIZE = "small" 

def transcribe_audio_file(audio_path: str):
    """
    Transcribes the specified audio file using the local Whisper model.
    """
    # 1. Load the Whisper model
    # Note: Model loading is slow. In a production environment, this should be done once.
    try:
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