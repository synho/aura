import React, { useState, useEffect, useRef } from 'react';
import { Mood, Weather, AuraResponse, Gender, AuraAnalysis } from './types';
import { MicrophoneIcon, MOOD_OPTIONS, ShareIcon } from './constants';
import { getAuraResponse, generateMoodImage, getWeatherFromCoords, predictMoodFromStory, getAuraAnalysis, createImagePromptFromAnalysis } from './services/geminiService';
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
  onstart: () => void;
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
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<AuraResponse | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AuraAnalysis | null>(null);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>('Checking your location...');
  
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [copied, setCopied] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const storyRef = useRef(story);
  storyRef.current = story;
  const selectedMoodRef = useRef(selectedMood);
  selectedMoodRef.current = selectedMood;

  const [backgroundStyle, setBackgroundStyle] = useState({
    background: 'linear-gradient(-45deg, #f3e8ff, #e0e7ff, #d1d5db, #fce7f3)',
    backgroundSize: '400% 400%',
    animation: 'backgroundPan 15s ease infinite',
    transition: 'background 2s ease-in-out',
  });
  
  useEffect(() => {
    // This cleanup function will be called when the component unmounts
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only on mount and unmount


  useEffect(() => {
    if (selectedMood) {
      const moodInfo = MOOD_OPTIONS.find(opt => opt.value === selectedMood);
      if (moodInfo) {
        setBackgroundStyle(prev => ({
          ...prev,
          background: `radial-gradient(circle at 20% 20%, ${moodInfo.gradientColors[0]}, transparent), radial-gradient(circle at 80% 80%, ${moodInfo.gradientColors[1]}, transparent), #f3e8ff`,
          backgroundSize: '100% 100%',
          animation: 'none',
        }));
      }
    } else {
      setBackgroundStyle(prev => ({
        ...prev,
        background: 'linear-gradient(-45deg, #f3e8ff, #e0e7ff, #d1d5db, #fce7f3)',
        backgroundSize: '400% 400%',
        animation: 'backgroundPan 15s ease infinite',
      }));
    }
  }, [selectedMood]);


  useEffect(() => {
    // Geolocation logic remains the same
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported. Starting with default weather.');
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
          setLocationStatus(`The weather at your location is '${weather}'. Please select your mood!`);
        } catch (err) {
            console.error(err);
            
            let isRateLimitError = false;
            if (err) {
                let messageToCheck = '';
                if (err instanceof Error) {
                    messageToCheck = err.message;
                } else if (typeof err === 'object' && err !== null) {
                    messageToCheck = JSON.stringify(err);
                } else {
                    messageToCheck = String(err);
                }

                messageToCheck = messageToCheck.toLowerCase();
                if (messageToCheck.includes('429') || messageToCheck.includes('quota') || messageToCheck.includes('resource_exhausted')) {
                    isRateLimitError = true;
                }
            }
        
            if (isRateLimitError) {
                setLocationStatus("Aura is busy! Couldn't fetch weather, using a default for now.");
            } else {
                const error = err instanceof Error ? err : new Error('Failed to fetch weather information.');
                setError(error);
                setLocationStatus('Could not fetch weather data. Starting with default weather.');
            }
            setSelectedWeather(Weather.Sunny); // Fallback
        }
      },
      (geoError) => {
        console.error("Geolocation error:", geoError);
        const geoErrorMessage = "Geolocation request was denied. (Geolocation Error)";
        setError(new Error(geoErrorMessage));
        setLocationStatus('Unable to retrieve location. Starting with default weather.');
        setSelectedWeather(Weather.Sunny); // Fallback
      }
    );
  }, []);

  const handleListen = async () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) || !navigator.mediaDevices) {
        setError(new Error("Your browser doesn't support the voice features Aura needs."));
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // 1. Setup Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        // lang is not set to allow the browser to use its default, which is better for bilingual users.
        recognitionRef.current = recognition;

        let baseTranscript = '';
        recognition.onstart = () => {
          baseTranscript = storyRef.current.trim() ? storyRef.current.trim() + ' ' : '';
        };
        recognition.onresult = (event) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              baseTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          setStory(baseTranscript + interimTranscript);
        };
        
        recognition.onerror = (event) => {
          if (event.error === 'no-speech') {
            console.warn('Speech recognition: No speech detected. The service will stop.');
            return;
          }
          console.error('Speech recognition error', event.error);
          setError(new Error('An error occurred during speech recognition: ' + event.error));
        };
        
        // 2. Setup Recorder
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
          stream.getTracks().forEach(track => track.stop());
          
          const finalStory = storyRef.current.trim();
          if (finalStory.length > 10) {
            setIsAnalyzing(true);
            setAnalysis(null);
          }
        };

        mediaRecorder.onstop = async () => {
          const mimeType = mediaRecorder.mimeType;
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

          if (audioBlob.size < 100) {
            setIsAnalyzing(false);
            return;
          }

          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            const finalStory = storyRef.current.trim();
            try {
              const predictedMood = await predictMoodFromStory(finalStory);
              setSelectedMood(predictedMood);
              const userSelectedMood = selectedMoodRef.current ?? predictedMood;
              
              const analysisResult = await getAuraAnalysis(finalStory, userSelectedMood, predictedMood, base64Audio, mimeType);
              setAnalysis(analysisResult);
            } catch (err) {
              console.error("Failed during multimodal analysis:", err);
              setError(err instanceof Error ? err : new Error("Aura couldn't analyze your voice."));
            } finally {
              setIsAnalyzing(false);
            }
          };
        };

        recognition.start();
        mediaRecorder.start();
        setIsListening(true);
        setError(null);
      } catch (err) {
        console.error("Microphone access error:", err);
        setError(new Error("Microphone access was denied. Aura needs access to hear you. Please check your browser permissions."));
        setIsListening(false);
      }
    }
  };

  const fetchAuraResponse = async () => {
    if (!selectedMood) {
      setError(new Error('Please select your current mood first.'));
      return;
    }
    if (!selectedWeather) {
      setError(new Error('Weather data is still loading. Please try again in a moment.'));
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setImageUrl(null);
    if(!analysis) setAnalysis(null);

    const ageAsNumber = age ? parseInt(age, 10) : undefined;
    if (age && isNaN(ageAsNumber)) {
        setError(new Error('Please enter a valid number for your age.'));
        setIsLoading(false);
        return;
    }
    
    // Step 1: Get the main response
    let auraResponse;
    try {
        auraResponse = await getAuraResponse(selectedMood, selectedWeather, story, ageAsNumber, gender);
        setResult(auraResponse);
    } catch(err) {
        console.error(err);
        setError(err instanceof Error ? err : new Error('An error occurred while fetching Aura\'s response.'));
        setIsLoading(false);
        return;
    }
    setIsLoading(false);

    // Step 2: Kick off dynamic image generation
    if (analysis) {
        createImagePromptFromAnalysis(story, analysis)
            .then(prompt => generateMoodImage(prompt))
            .then(base64Image => setImageUrl(base64Image))
            .catch(imageErr => {
                console.error("Dynamic image generation failed:", imageErr);
            });
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAuraResponse();
  };

  const resetForm = () => {
    setSelectedMood(null);
    setStory('');
    setAge('');
    setGender(null);
    setResult(null);
    setImageUrl(null);
    setError(null);
    setAnalysis(null);
    setIsLoading(false);
  };
  
  const handleShare = async () => {
    if (!result) return;
  
    const senderName = prompt("What's your name? (Optional, for the share message)");
    const appUrl = 'https://aistudio.google.com/projects';
  
    const intro = senderName
      ? `Hey! It's ${senderName}. I just had a really cool experience with this AI Angel called Aura and wanted to share:`
      : "Hey! I just had a really cool experience with this AI Angel called Aura and wanted to share:";
  
    let analysisText = "";
    if (analysis && (analysis.predicted_age || analysis.predicted_gender || analysis.mood_discrepancy_comment)) {
      analysisText = "\n\n🔮 Aura's Fun Analysis 🔮\n";
      const analysisParts: string[] = [];
      if (analysis.predicted_age) {
        analysisParts.push(`It playfully guessed I'm ${analysis.predicted_age}.`);
      }
      if (analysis.predicted_gender) {
        analysisParts.push(`It said my vibe is very ${analysis.predicted_gender.toLowerCase()}!`);
      }
      if (analysis.mood_discrepancy_comment) {
        analysisParts.push(`It also noticed: "${analysis.mood_discrepancy_comment}"`);
      }
      analysisText += analysisParts.join('\n');
    }
  
    let recommendationText = "\n\nBased on how I was feeling, it recommended this content:\n";
    const { type, title, link } = result.content_recommendation;
    const icon = type === 'music' ? '🎵' : '📄';
    recommendationText += `${icon} ${title}`;
    if (link) {
      recommendationText += `\nCheck it out here: ${link}`;
    }
  
    const outro = `\n\nYou should totally try it! It's a really thoughtful AI companion.\n${appUrl}`;
  
    const shareText = `${intro}${analysisText}${recommendationText}${outro}`;

    const shareData = {
      title: "My Aura Analysis!",
      text: shareText,
      url: appUrl,
    };
  
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        throw new Error('Web Share API not available.');
      }
    } catch (err) {
      console.log('Web Share API failed, trying clipboard. Error:', err);
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (copyErr) {
        console.error('Error copying to clipboard:', copyErr);
        alert(`Sharing is not supported on this browser/device. Here's the message to copy:\n\n${shareText}`);
      }
    }
  };
  
  const renderContent = () => {
    if (isLoading) {
      return <Loader />;
    }
    
    if (error && !result) {
        return <ErrorDisplay error={error} onClearError={() => setError(null)} onRetry={fetchAuraResponse} />;
    }

    if (result) {
      return (
        <div>
          {error && <ErrorDisplay error={error} onClearError={() => setError(null)} onRetry={fetchAuraResponse} />}
          <ResultCard 
            data={result} 
            imageUrl={imageUrl} 
            analysis={analysis} 
           />
          {coords && <MapDisplay coords={coords} mood={selectedMood} />}
          <div className="text-center mt-8 flex justify-center items-center gap-4">
            <button
              onClick={resetForm}
              className="text-purple-600 hover:text-purple-800 font-semibold transition-colors duration-200 px-4 py-2"
            >
              Start Over
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-purple-300 text-purple-700 font-semibold rounded-full shadow-sm hover:bg-purple-50 transition-all duration-200 transform hover:scale-105"
            >
              <ShareIcon />
              {copied ? 'Link Copied!' : 'Share with a Friend'}
            </button>
          </div>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <MoodSelector selectedMood={selectedMood} onSelectMood={(mood) => { setSelectedMood(mood); setError(null); }} isAnalyzing={isAnalyzing} />
        
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-3 text-center">
            Tell us a bit about yourself (Optional)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700">Age</label>
              <input
                type="number"
                id="age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                placeholder="e.g., 25"
              />
            </div>
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender</label>
              <select
                id="gender"
                value={gender || ''}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white"
              >
                <option value="" disabled>Select...</option>
                {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
        </div>


        <div className="text-center text-gray-600 text-sm p-3 bg-purple-50 rounded-lg border border-purple-200">
           <p>{locationStatus}</p>
        </div>
        
        {error && <ErrorDisplay error={error} onClearError={() => setError(null)} onRetry={fetchAuraResponse} />}

        <div>
          <label htmlFor="story" className="block text-lg font-semibold text-gray-700 mb-3 text-center">
            What's on your mind? Aura is here to listen.
          </label>
          <div className="relative">
            <textarea
              id="story"
              value={story}
              onChange={(e) => setStory(e.target.value)}
              rows={3}
              className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              placeholder="You can write about your day, a specific feeling, or anything weighing on you... The more you share, the better Aura can understand."
            />
            <button 
              type="button" 
              onClick={handleListen}
              className={`absolute bottom-3 right-3 p-1 rounded-full transition-all duration-200 transform ${isListening ? 'text-white bg-red-500 animate-pulse' : 'text-gray-400 hover:text-purple-600 hover:scale-105'}`}
              aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
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
            Get Recommendation from Aura
          </button>
        </div>
      </form>
    );
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8"
      style={backgroundStyle}
    >
      <div className="w-full max-w-2xl mx-auto">
        <header 
          className="text-center mb-8 animate-fade-in-up" 
          style={{ animationDelay: '200ms' }}
        >
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-600">
            AURA
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Your AI Angel for your mind.
          </p>
        </header>

        <main 
          className="bg-white/60 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-lg border border-purple-100 min-h-[30rem] flex flex-col justify-center animate-fade-in-up"
          style={{ animationDelay: '400ms' }}
        >
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;