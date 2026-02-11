"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, RefreshCw } from "lucide-react";

type SpeechRecognitionEvent = Event & {
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionResultList = {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
};

type SpeechRecognitionResult = {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
};

type SpeechRecognitionAlternative = {
  transcript: string;
  confidence: number;
};

type SpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: Event) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
};

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [word, setWord] = useState("");
  const [spelling, setSpelling] = useState("");
  const [interim, setInterim] = useState(false);
  const [error, setError] = useState("");
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      setError("Speech recognition not supported");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = "en-US";

    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      
      if (lastResult.isFinal) {
        const text = lastResult[0].transcript.trim();
        if (text) {
          const titleCase = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
          setWord(titleCase);
          setSpelling(titleCase.split("").join("  "));
        }
        setInterim(false);
      } else {
        const interimText = lastResult[0].transcript.trim();
        if (interimText) {
          setInterim(true);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          timeoutRef.current = setTimeout(() => {
            setInterim(false);
          }, 2000);
        }
      }
    };

    recognitionRef.current.onerror = () => {
      setError("Error occurred");
      setIsListening(false);
      setInterim(false);
    };

    recognitionRef.current.onend = () => {
      setInterim(false);
      if (isListening) {
        try {
          recognitionRef.current?.start();
        } catch {
          // Ignore
        }
      }
    };
  }, [isListening]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setInterim(false);
    } else {
      setError("");
      setWord("");
      setSpelling("");
      setInterim(false);
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch {
        setError("Failed to start");
      }
    }
  };

  const clear = () => {
    setWord("");
    setSpelling("");
    setError("");
    setInterim(false);
  };

  if (!supported) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center text-white">
          <p className="text-red-400">Not supported</p>
          <p className="text-gray-500 mt-2">Use Chrome, Edge, or Safari</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Word Display */}
        <div className="text-center mb-8">
          <p className="text-gray-500 text-sm mb-2">WORD</p>
          <p className="text-white text-5xl md:text-7xl font-bold tracking-wider">
            {word || "—"}
          </p>
        </div>

        {/* Spinner */}
        {interim && (
          <div className="flex justify-center mb-6">
            <div className="flex gap-1">
              <span className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        {/* Spelling Display */}
        <div className="bg-gray-900 rounded-2xl p-6 md:p-8 mb-6 text-center min-h-[120px] flex items-center justify-center">
          <p className="text-blue-400 text-3xl md:text-5xl font-mono tracking-[0.3em]">
            {spelling || "..."}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 mb-6 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={toggleListening}
            className={`flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg transition-all ${
              isListening
                ? "bg-red-600 text-white animate-pulse"
                : "bg-white text-black"
            }`}
          >
            {isListening ? (
              <>
                <Square className="w-5 h-5" />
                STOP
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                SPEAK
              </>
            )}
          </button>

          <button
            onClick={clear}
            className="px-6 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all"
          >
            CLEAR
          </button>
        </div>

        {/* Status */}
        <div className="text-center mt-8">
          <span className="text-gray-600 text-sm">
            {isListening ? "● Listening..." : "○ Ready"}
          </span>
        </div>
      </div>
    </div>
  );
}
