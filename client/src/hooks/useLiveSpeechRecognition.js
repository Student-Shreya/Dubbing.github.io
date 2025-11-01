import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Custom hook to manage real-time browser-based speech recognition.
 * NOTE: This relies on the proprietary browser APIs (webkitSpeechRecognition)
 * and provides the live transcript.
 */
export const useLiveSpeechRecognition = () => {
    const [transcript, setTranscript] = useState('');
    const [isListening, setIsListening] = useState(false);
    const recognitionInstance = useRef(null);

    // Check if the required browser API is available
    const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

    // The useEffect hook sets up the SpeechRecognition object and its event handlers.
    useEffect(() => {
        if (!isSupported) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionInstance.current = new SpeechRecognition();
        
        // Configuration:
        recognitionInstance.current.continuous = true; // Keep listening after pauses
        recognitionInstance.current.interimResults = true; // Show results immediately
        
        // Event handler for received speech results
        recognitionInstance.current.onresult = (event) => {
            let currentTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcriptPiece = event.results[i][0].transcript;
                // Accumulate the final (non-interim) text
                if (event.results[i].isFinal) {
                    currentTranscript += transcriptPiece + ' ';
                }
            }
            if (currentTranscript) {
                // Update state with the newly finalized text
                setTranscript(prev => prev + currentTranscript);
            }
        };

        // Event handler for errors
        recognitionInstance.current.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
        };

        // Event handler for when listening stops (e.g., timeout or stop() called)
        recognitionInstance.current.onend = () => {
            // Set isListening to false to update UI
            setIsListening(false);
        };

        // Cleanup function to stop listening when the component unmounts
        return () => {
            if (recognitionInstance.current) {
                recognitionInstance.current.stop();
            }
        };
    }, [isSupported]);
    
    // START FUNCTION
    const startListening = useCallback((language = 'en-US') => {
        if (recognitionInstance.current && !isListening) {
            setTranscript(''); // Clear old transcript on start
            // Set language code (requires locale for better accuracy)
            recognitionInstance.current.lang = language === 'zh' ? 'zh-CN' : language; 
            recognitionInstance.current.start();
            setIsListening(true);
        } else if (recognitionInstance.current && isListening) {
             // If already listening, restarting may help if the browser connection drops
             recognitionInstance.current.start(); 
        }
    }, [isListening]);

    // STOP FUNCTION
    const stopListening = useCallback(() => {
        if (recognitionInstance.current) {
            recognitionInstance.current.stop();
            // setIsListening is set to false in the onend event handler
        }
    }, []);

    // RESET FUNCTION
    const resetTranscript = useCallback(() => {
        setTranscript('');
    }, []);

    return {
        transcript,
        isListening,
        startListening,
        stopListening,
        resetTranscript,
        isSupported,
    };
};
