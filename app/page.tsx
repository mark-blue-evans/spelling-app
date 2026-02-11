"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, Square } from "lucide-react";

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

const MAX_HISTORY = 5;

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [word, setWord] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [interim, setInterim] = useState(false);
  const [error, setError] = useState("");
  const [supported, setSupported] = useState<boolean | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionClass) {
      setSupported(false);
      return;
    }

    setSupported(true);
    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const lastResult = event.results[event.results.length - 1];
      
      if (lastResult.isFinal) {
        const text = lastResult[0].transcript.trim();
        if (text) {
          const titleCase = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
          setWord(titleCase);
          setHistory(prev => [titleCase, ...prev].slice(0, MAX_HISTORY));
        }
        setInterim(false);
      } else {
        const interimText = lastResult[0].transcript.trim();
        if (interimText) {
          setInterim(true);
        }
      }
    };

    recognition.onerror = () => {
      setError("Error occurred");
      setIsListening(false);
      setInterim(false);
    };

    recognition.onend = () => {
      setInterim(false);
      if (isListening) {
        try {
          recognition.start();
        } catch {
          // Ignore restart errors
        }
      }
    };

    recognitionRef.current = recognition;
  }, [isListening]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
      setIsListening(false);
      setInterim(false);
    } else {
      setError("");
      setWord("");
      setInterim(true);
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setError("Failed to start");
        setIsListening(false);
        setInterim(false);
      }
    }
  };

  if (supported === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  if (supported === false) {
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
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-6">
        {/* Current Word */}
        <div className="text-center">
          <p className="text-gray-500 text-sm mb-2">WORD</p>
          <p className="text-white text-5xl md:text-7xl font-bold tracking-wider">
            {word || "—"}
          </p>
        </div>

        {/* Spinner */}
        {interim && (
          <div className="flex gap-1">
            <span className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Button */}
        <button
          onClick={toggleListening}
          className={`flex items-center gap-3 px-10 py-5 rounded-2xl font-semibold text-xl transition-all ${
            isListening
              ? "bg-red-600 text-white"
              : "bg-white text-black"
          }`}
        >
          {isListening ? (
            <>
              <Square className="w-6 h-6" />
              STOP
            </>
          ) : (
            <>
              <Mic className="w-6 h-6" />
              SPEAK
            </>
          )}
        </button>

        {/* Status */}
        <p className="text-gray-600 text-sm">
          {isListening ? "Listening..." : "Ready"}
        </p>

        {/* History */}
        {history.length > 0 && (
          <div className="flex flex-col items-center gap-2 mt-4">
            {history.map((item, index) => (
              <p
                key={index}
                className="text-gray-500 font-medium tracking-wide"
                style={{ fontSize: `${1.5 - index * 0.2}rem` }}
              >
                {item}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
