import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Mic, X, Loader2 } from "lucide-react";

// Extend window for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type VoiceActivationFABProps = {};

/**
 * Floating Action Button for voice input.
 * Uses the Web Speech API (SpeechRecognition) for browser-native real-time transcription.
 * On recognition result → navigates to /ai-assistant with the transcribed message in sessionStorage.
 */
export function VoiceActivationFAB(_: VoiceActivationFABProps) {
  const [, setLocation] = useLocation();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(true);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }

    const rec = new SR();
    rec.lang = "bs-BA"; // Bosnian/Serbian – falls back to English if not available
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (event: any) => {
      const current = Array.from(event.results as any[])
        .map((r: any) => r[0].transcript)
        .join("");
      setTranscript(current);

      // When final result arrives, navigate
      if (event.results[event.results.length - 1].isFinal) {
        const finalText = current;
        setIsListening(false);
        setTranscript("");
        if (finalText.trim()) {
          sessionStorage.setItem("voice_command", finalText.trim());
          setLocation("/ai-assistant");
        }
      }
    };

    rec.onerror = (event: any) => {
      console.error("[VoiceFAB] SpeechRecognition error:", event.error);
      setIsListening(false);
      setTranscript("");
    };

    rec.onend = () => {
      setIsListening(false);
    };

    setRecognition(rec);
  }, [setLocation]);

  const toggleListening = useCallback(() => {
    if (!recognition) return;

    if (isListening) {
      recognition.abort();
      setIsListening(false);
      setTranscript("");
    } else {
      setTranscript("");
      try {
        recognition.start();
        setIsListening(true);
      } catch (e) {
        console.error("[VoiceFAB] Failed to start recognition:", e);
      }
    }
  }, [recognition, isListening]);

  if (!supported) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Transcript bubble */}
      {isListening && (
        <div className="bg-background border border-primary/20 rounded-xl px-4 py-2 shadow-lg max-w-xs animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">Slušam...</span>
          </div>
          <p className="text-sm font-medium min-h-[20px]">
            {transcript || <span className="text-muted-foreground italic">Govorite...</span>}
          </p>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={toggleListening}
        className={`relative h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/50 ${
          isListening
            ? "bg-red-500 hover:bg-red-600 scale-110"
            : "bg-orange-500 hover:bg-orange-600 hover:scale-105"
        }`}
        title={isListening ? "Stop slušanje (klik)" : "Glasovna naredba (klik)"}
        aria-label={isListening ? "Stop voice input" : "Start voice input"}
      >
        {/* Ripple when listening */}
        {isListening && (
          <>
            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-40" />
            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20 animation-delay-300" />
          </>
        )}
        {isListening ? (
          <X className="h-6 w-6 text-white relative z-10" />
        ) : (
          <Mic className="h-6 w-6 text-white relative z-10" />
        )}
      </button>
    </div>
  );
}
