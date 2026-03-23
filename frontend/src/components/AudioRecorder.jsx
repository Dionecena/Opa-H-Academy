import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Play, Pause, RotateCcw, Send, Trash2 } from 'lucide-react';
import { Button } from './UI';

const AudioRecorder = ({ onSend, maxDuration = 60 }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(maxDuration);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setDuration(0);
      setTimeLeft(maxDuration);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          setTimeLeft(maxDuration - newDuration);
          
          if (newDuration >= maxDuration) {
            stopRecording();
          }
          
          return newDuration;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Impossible d\'accéder au microphone. Vérifiez les permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const reset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setTimeLeft(maxDuration);
    setIsPlaying(false);
  };

  const handleSend = () => {
    if (audioBlob && onSend) {
      onSend(audioBlob, duration);
      reset();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[var(--bg-input)] rounded-[var(--radius)] p-4">
      {/* Timer */}
      <div className="flex items-center justify-center mb-4">
        <span className={`
          text-2xl font-mono font-bold
          ${isRecording ? 'text-[var(--danger)]' : 'text-[var(--text-primary)]'}
        `}>
          {isRecording ? formatTime(duration) : audioBlob ? formatTime(duration) : '0:00'}
        </span>
        {isRecording && (
          <span className="ml-4 text-[var(--text-muted)]">
            / {formatTime(timeLeft)} restant
          </span>
        )}
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="flex items-center justify-center gap-2 mb-4"
        >
          <div className="w-3 h-3 bg-[var(--danger)] rounded-full" />
          <span className="text-[var(--danger)] font-medium">Enregistrement...</span>
        </motion.div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <AnimatePresence mode="wait">
          {!audioBlob && !isRecording && (
            <motion.button
              key="start"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              onClick={startRecording}
              className="w-16 h-16 rounded-full bg-[var(--danger)] flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <Mic className="w-8 h-8 text-white" />
            </motion.button>
          )}

          {isRecording && (
            <motion.button
              key="stop"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              onClick={stopRecording}
              className="w-16 h-16 rounded-full bg-[var(--danger)] flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <Square className="w-8 h-8 text-white" />
            </motion.button>
          )}

          {audioBlob && !isRecording && (
            <motion.div
              key="preview"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="flex items-center gap-3"
            >
              <button
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center hover:bg-[var(--primary-light)] transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-white" />
                ) : (
                  <Play className="w-6 h-6 text-white ml-1" />
                )}
              </button>
              
              <button
                onClick={reset}
                className="w-12 h-12 rounded-full bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center hover:bg-[var(--bg-input)] transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleSend}
                className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center hover:bg-emerald-600 transition-colors"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hidden audio element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}

      {/* Instructions */}
      <p className="text-center text-sm text-[var(--text-muted)] mt-4">
        {!audioBlob && !isRecording && 'Appuyez pour enregistrer (max 60s)'}
        {isRecording && 'Appuyez pour arrêter'}
        {audioBlob && !isRecording && 'Écouter, réenregistrer ou envoyer'}
      </p>
    </div>
  );
};

export default AudioRecorder;
