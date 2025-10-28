import React, { useState, useEffect, useRef } from 'react';
import { Mood, Weather, AuraResponse } from './types';
import { MicrophoneIcon, MOOD_OPTIONS } from './constants';
import { getAuraResponse, generateMoodImage, getWeatherFromCoords } from './services/geminiService';
import MoodSelector from './components/MoodSelector';
import ResultCard from './components/ResultCard';
import Loader from './components/Loader';
import ErrorDisplay from './components/ErrorDisplay';
import MapDisplay from './components/MapDisplay';

// Add type definitions for the Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
}
declare global {
  interface Window {
    SpeechRecognition: { new (): SpeechRecognition };
    webkitSpeechRecognition: { new (): SpeechRecognition };
  }
}

const App: React.FC = () => {
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [selectedWeather, setSelectedWeather] = useState<Weather | null>(null);
  const [story, setStory] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<AuraResponse | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>('위치 정보를 확인하는 중...');

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'ko-KR';

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setStory(story + finalTranscript + interimTranscript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setError('음성 인식 중 오류가 발생했습니다.');
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [story]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('이 브라우저에서는 위치 정보가 지원되지 않습니다. 기본 날씨로 시작합니다.');
      setSelectedWeather(Weather.Sunny);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const currentCoords = { lat: latitude, lng: longitude };
        setCoords(currentCoords);
        try {
          const weather = await getWeatherFromCoords(currentCoords.lat, currentCoords.lng);
          setSelectedWeather(weather);
          setLocationStatus(`현재 위치의 날씨는 '${weather}'입니다. 기분을 선택해주세요!`);
        } catch (err) {
          setLocationStatus('날씨 정보를 가져오지 못했습니다. 기본 날씨로 시작합니다.');
          setSelectedWeather(Weather.Sunny); // Fallback
        }
      },
      (geoError) => {
        console.error("Geolocation error:", geoError);
        setLocationStatus('위치 정보를 가져올 수 없습니다. 기본 날씨로 시작합니다.');
        setSelectedWeather(Weather.Sunny); // Fallback
      }
    );
  }, []);

  const handleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
    setIsListening(!isListening);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMood) {
      setError('먼저 지금 기분을 선택해주세요.');
      return;
    }
    if (!selectedWeather) {
      setError('날씨 정보가 로딩 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);
    setImageUrl(null);

    const [auraResponseResult, moodImageResult] = await Promise.allSettled([
        getAuraResponse(selectedMood, selectedWeather, story),
        generateMoodImage(selectedMood, selectedWeather)
    ]);

    if (auraResponseResult.status === 'fulfilled') {
        setResult(auraResponseResult.value);
    } else {
        console.error(auraResponseResult.reason);
        setError(auraResponseResult.reason instanceof Error ? auraResponseResult.reason.message : 'Aura의 답변을 받아오는 중 오류가 발생했습니다.');
    }

    if (moodImageResult.status === 'fulfilled') {
        setImageUrl(moodImageResult.value);
    } else {
        console.error(moodImageResult.reason);
        // Do not set a global error for image failure, just log it. The result card will render without it.
    }

    setIsLoading(false);
  };

  const resetForm = () => {
    setSelectedMood(null);
    setStory('');
    setResult(null);
    setImageUrl(null);
    setError('');
    setIsLoading(false);
  };
  
  const renderContent = () => {
    if (isLoading) {
      return <Loader />;
    }
    
    if (result) {
      return (
        <div className="animate-fade-in">
          <ResultCard data={result} imageUrl={imageUrl} />
          {coords && <MapDisplay coords={coords} mood={selectedMood} />}
          <div className="text-center mt-8">
            <button
              onClick={resetForm}
              className="text-purple-600 hover:text-purple-800 font-semibold hover:underline"
            >
              다시하기
            </button>
          </div>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
        <MoodSelector selectedMood={selectedMood} onSelectMood={(mood) => { setSelectedMood(mood); setError(''); }} />

        <div className="text-center text-gray-600 text-sm p-3 bg-purple-50 rounded-lg border border-purple-200">
           <p>{locationStatus}</p>
        </div>

        <div>
          <label htmlFor="story" className="block text-lg font-semibold text-gray-700 mb-3 text-center">
            조금 더 이야기해 줄 수 있나요? (선택)
          </label>
          <div className="relative">
            <textarea
              id="story"
              value={story}
              onChange={(e) => setStory(e.target.value)}
              rows={3}
              className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              placeholder="오늘 있었던 일이나, 지금 드는 생각을 자유롭게 이야기해주세요."
            />
            <button 
              type="button" 
              onClick={handleListen}
              className={`absolute bottom-3 right-3 p-1 rounded-full transition-colors ${isListening ? 'text-white bg-red-500 animate-pulse' : 'text-gray-400 hover:text-purple-600'}`}
              aria-label={isListening ? '음성 입력 중지' : '음성 입력 시작'}
            >
              <MicrophoneIcon />
            </button>
          </div>
        </div>

        <div className="text-center pt-2">
          <button
            type="submit"
            disabled={!selectedMood || isLoading || !selectedWeather}
            className="w-full sm:w-auto px-10 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
          >
            아우라에게 추천받기
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-600">
            AURA
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            당신의 마음을 위한 AI 엔젤
          </p>
        </header>

        <main className="bg-white/60 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-lg border border-purple-100 min-h-[30rem] flex flex-col justify-center">
          {error && <ErrorDisplay message={error} />}
          {!error && renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
