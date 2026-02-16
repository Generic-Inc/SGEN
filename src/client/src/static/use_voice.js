import { useState, useEffect, useRef } from "react";

export function useVoice(onResult) {
    const [isListening, setIsListening] = useState(false);
    const [interimTranscript, setInterimTranscript] = useState("");
    const [support, setSupport] = useState(true);
    const [lang, setLang] = useState("en-US");

    // Use a Ref to keep track of the recognition object without re-renders
    const recognitionRef = useRef(null);

    useEffect(() => {
        if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
            setSupport(false);
        }
    }, []);

    const toggleListen = () => {
        if (!support) return alert("Browser does not support voice to text.");

        // If already listening, stop it gracefully
        if (isListening && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition; // Save to ref

        recognition.continuous = true;
        recognition.lang = lang;
        recognition.interimResults = true;

        recognition.onstart = () => {
            setIsListening(true);
            setInterimTranscript("");
        };

        recognition.onend = () => {
            setIsListening(false);
            setInterimTranscript("");
        };

        recognition.onerror = (event) => {
            console.error("Speech error:", event.error);
            setIsListening(false);
        };

        recognition.onresult = (event) => {
            let finalTrans = "";
            let interimTrans = "";

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTrans += event.results[i][0].transcript;
                } else {
                    interimTrans += event.results[i][0].transcript;
                }
            }

            if (finalTrans && onResult) {
                onResult(finalTrans);
            }
            setInterimTranscript(interimTrans);
        };

        recognition.start();
    };

    return { isListening, toggleListen, support, lang, setLang, interimTranscript };
}