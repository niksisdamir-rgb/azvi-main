import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Loader2 } from 'lucide-react';


interface VoiceRecorderProps {
  onTranscription: (text: string, audioUrl?: string, summary?: string) => void;
  language?: string;
  summarize?: boolean;
}

export function VoiceRecorder({ onTranscription, language = 'bs', summarize = true }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Check browser support for webm
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : 'audio/mp4';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        
        // Check file size (16MB limit)
        const fileSizeMB = audioBlob.size / (1024 * 1024);
        if (fileSizeMB > 16) {
          console.error('Recording too large - please keep under 16MB');
          alert('Recording too large. Please keep recordings under 16MB (about 10 minutes).');
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          
          setIsProcessing(true);
          try {
            // Call transcription API
            const response = await fetch('/api/trpc/ai.transcribeVoice', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audioData: base64Audio,
                language,
                summarize,
              }),
            });

            if (!response.ok) {
              throw new Error('Transcription failed');
            }

            const result = await response.json();
            // result is expected to be { text: string, audioUrl?: string, summary?: string }
            // Note: Since we're using raw fetch, we should access result.result.data if it's tRPC
            // But if it's a direct API call or handled by middleware, we need to be careful.
            // In typical tRPC over HTTP it's { result: { data: { text, audioUrl, summary } } }
            const data = result.result?.data || result;
            onTranscription(data.text, data.audioUrl, data.summary);
            
            console.log('Voice transcribed successfully');
          } catch (error) {
            console.error('Transcription error:', error);
            console.error('Transcription failed:', error);
            alert('Could not transcribe your voice. Please try again.');
          } finally {
            setIsProcessing(false);
          }
        };
        reader.readAsDataURL(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      console.error('Microphone access denied:', error);
      alert('Please allow microphone access to use voice input');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isProcessing) {
    return (
      <Button variant="outline" size="icon" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (isRecording) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-md">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-mono text-red-500">{formatTime(recordingTime)}</span>
        </div>
        <Button
          variant="destructive"
          size="icon"
          onClick={stopRecording}
          title="Stop recording"
        >
          <Square className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={startRecording}
      title="Record voice message"
    >
      <Mic className="h-4 w-4" />
    </Button>
  );
}
