"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, RefreshCw, Volume2, Copy, Check } from "lucide-react";

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
  const [transcript, setTranscript] = useState("");
  const [spelledText, setSpelledText] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      setError("Speech recognition not supported in this browser");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = "en-US";

    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.results.length - 1; i >= 0; i--) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript = result[0].transcript + finalTranscript;
        } else {
          interimTranscript = result[0].transcript + interimTranscript;
        }
      }

      const fullText = finalTranscript || interimTranscript;
      setTranscript(fullText);
      setSpelledText(spellWord(fullText));
    };

    recognitionRef.current.onerror = () => {
      setError("Error occurred during recognition");
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      if (isListening) {
        // Restart if still supposed to be listening
        try {
          recognitionRef.current?.start();
        } catch {
          // Ignore restart errors
        }
      }
    };

    return () => {
      recognitionRef.current?.abort();
    };
  }, [isListening]);

  const spellWord = (text: string): string => {
    if (!text.trim()) return "";
    const cleaned = text.trim().toUpperCase();
    return cleaned.split("").join(" ");
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setError("");
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch {
        setError("Failed to start recognition");
      }
    }
  };

  const clearText = () => {
    setTranscript("");
    setSpelledText("");
    setError("");
  };

  const copyToClipboard = async () => {
    if (spelledText) {
      await navigator.clipboard.writeText(spelledText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!supported) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center">
          <Volume2 className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-white mb-2">Not Supported</h1>
          <p className="text-gray-400">{error}</p>
          <p className="text-gray-500 mt-4 text-sm">
            Try using Chrome, Edge, or Safari
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            🎤 Spell It Out
          </h1>
          <p className="text-gray-400">Speak and see how it&apos;s spelled</p>
        </div>

        {/* Main Display */}
        <div className="bg-gray-800 rounded-2xl p-6 md:p-8 mb-6">
          {/* Transcript */}
          <div className="mb-6">
            <label className="text-gray-400 text-sm block mb-2">
              What you said:
            </label>
            <div className="bg-gray-900 rounded-xl p-4 min-h-[60px]">
              <p className="text-white text-lg md:text-xl font-medium">
                {transcript || (
                  <span className="text-gray-600 italic">
                    Start speaking...
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Spelling */}
          <div>
            <label className="text-gray-400 text-sm block mb-2">
              Spelled out:
            </label>
            <div className="bg-gray-900 rounded-xl p-6 min-h-[100px]">
              {spelledText ? (
                <div className="flex flex-wrap gap-2">
                  {spelledText.split(" ").map((letter, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white text-2xl font-bold rounded-lg"
                    >
                      {letter}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-gray-600 italic">
                  Your spelling will appear here...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-xl p-4 mb-6">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={toggleListening}
            className={`flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg transition-all ${
              isListening
                ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {isListening ? (
              <>
                <Square className="w-5 h-5" />
                Stop Listening
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                Start Listening
              </>
            )}
          </button>

          <button
            onClick={clearText}
            className="flex items-center gap-2 px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all"
          >
            <RefreshCw className="w-5 h-5" />
            Clear
          </button>

          {spelledText && (
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 text-green-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copy
                </>
              )}
            </button>
          )}
        </div>

        {/* Status */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center gap-2 text-sm">
            <span
              className={`w-3 h-3 rounded-full ${
                isListening ? "bg-red-500 animate-pulse" : "bg-gray-500"
              }`}
            />
            <span className="text-gray-500">
              {isListening ? "Listening..." : "Ready"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
