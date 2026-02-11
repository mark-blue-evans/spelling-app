"use client";

import { useState, useRef, useEffect } from "react";
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
  const [interim, setInterim] = useState(false);
  const [error, setError] = useState("");
  const [supported, setSupported] = useState(true);
  const [started, setStarted] = useState(false);
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
      setStarted(false);
      setInterim(false);
    };

    recognitionRef.current.onend = () => {
      setInterim(false);
      if (isListening) {
        try {
          recognitionRef.current?.start();
        } catch {
          // Ignore restart errors
        }
      }
    };
  }, [isListening]);

  const toggleListening = () => {
    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore stop errors
      }
      setIsListening(false);
      setStarted(false);
      setInterim(false);
    } else {
      setError("");
      setWord("");
      setInterim(true);
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        setStarted(true);
      } catch {
        setError("Failed to start");
        setIsListening(false);
        setStarted(false);
        setInterim(false);
      }
    }
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
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-8">
        {/* Word Display */}
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
      </div>
    </div>
  );
}
