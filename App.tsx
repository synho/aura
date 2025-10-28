import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Mood, Weather, AuraResponse } from './types';
import { WEATHER_OPTIONS, MicrophoneIcon } from './constants';
import { getAuraResponse, generateAuraImage } from './services/geminiService';
import MoodSelector from './components/MoodSelector';
import ResultCard from './components/ResultCard';
import Loader from './components/Loader';
import ErrorDisplay from './components/ErrorDisplay';

// Fix: Add type definitions for the Web Speech API to resolve "Cannot find name 'SpeechRecognition'" errors.
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

// SpeechRecognition 타입을 확장하여 TypeScript에서 webkitSpeechRecognition을 인식하도록 합니다.
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

const App: React.FC = () => {
  const [mood, setMood] = useState<Mood | null>(null);
  const [note, setNote] = useState<string>('');
  const [weather, setWeather] = useState<Weather>(Weather.Sunny);
  const [auraResponse, setAuraResponse] = useState<AuraResponse | null>(null);
  const [auraImage, setAuraImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState<boolean>(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);


  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechRecognitionSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.lang = 'ko-KR';
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        setNote(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError('마이크 접근 권한이 필요합니다. 브라우저 설정을 확인해주세요.');
        } else {
          setError('음성 인식 중 오류가 발생했습니다.');
        }
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const handleVoiceInputToggle = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
    setIsListening(!isListening);
  };


  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
    if (!mood) {
      setError('먼저 지금 기분을 선택해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAuraResponse(null);
    setAuraImage(null);

    try {
      const [textResponse, imageResponse] = await Promise.allSettled([
        getAuraResponse(mood, note, weather),
        generateAuraImage(mood, weather)
      ]);

      if (textResponse.status === 'fulfilled') {
        setAuraResponse(textResponse.value);
        if (imageResponse.status === 'fulfilled') {
          setAuraImage(imageResponse.value);
        } else {
          console.error("Image generation failed:", imageResponse.reason);
          setAuraImage(null);
        }
      } else {
        console.error("Aura response failed:", textResponse.reason);
        const err = textResponse.reason;
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('알 수 없는 오류가 발생했습니다.');
        }
      }
    } catch (err) {
      console.error("An unexpected error occurred:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [mood, note, weather, isListening]);

  const handleMoodSelect = (selectedMood: Mood) => {
    setMood(selectedMood);
    if(error === '먼저 지금 기분을 선택해주세요.') {
      setError(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center p-4">
      <main className="w-full max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-800">Aura</h1>
          <p className="text-lg text-gray-600 mt-2">당신의 마음을 돌보는 AI 엔젤</p>
        </div>

        <div className="bg-white/60 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-md border border-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            <MoodSelector selectedMood={mood} onSelectMood={handleMoodSelect} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="weather" className="block text-sm font-medium text-gray-700 mb-1">
                  오늘 날씨는 어떤가요?
                </label>
                <select
                  id="weather"
                  value={weather}
                  onChange={(e) => setWeather(e.target.value as Weather)}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                >
                  {WEATHER_OPTIONS.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
                  조금 더 이야기해주실 수 있나요? (선택 사항)
                </label>
                <div className="relative">
                  <textarea
                    id="note"
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="예: 오늘 프로젝트 발표 때문에 힘들었어"
                    className="w-full p-2 pr-12 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 resize-none"
                  />
                  {isSpeechRecognitionSupported && (
                    <button
                      type="button"
                      onClick={handleVoiceInputToggle}
                      disabled={isLoading}
                      className={`absolute top-1/2 right-2 -translate-y-1/2 p-2 rounded-full transition-colors ${
                        isListening 
                          ? 'text-white bg-red-500 animate-pulse' 
                          : 'text-gray-500 hover:bg-gray-200'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      aria-label={isListening ? '음성 입력 중지' : '음성 입력 시작'}
                    >
                      <MicrophoneIcon />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-300 ease-in-out disabled:bg-purple-300 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? '생각 중...' : "아우라의 위로 받기"}
            </button>
            
            {error && <ErrorDisplay message={error} />}
          </form>
        </div>

        {isLoading && <div className="mt-8"><Loader /></div>}
        {auraResponse && <ResultCard data={auraResponse} imageUrl={auraImage} />}
      </main>
    </div>
  );
};

export default App;
