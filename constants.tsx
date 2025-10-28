import React from 'react';
import { Mood, Weather } from './types';

export interface MoodOption {
  value: Mood;
  label: string;
  emoji: string;
  color: string;
  hoverColor: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  { value: Mood.Joy, label: '기쁨', emoji: '😊', color: 'bg-yellow-200 text-yellow-800', hoverColor: 'hover:bg-yellow-300' },
  { value: Mood.Sadness, label: '슬픔', emoji: '😢', color: 'bg-blue-200 text-blue-800', hoverColor: 'hover:bg-blue-300' },
  { value: Mood.Exhaustion, label: '지침', emoji: '😫', color: 'bg-gray-300 text-gray-800', hoverColor: 'hover:bg-gray-400' },
  { value: Mood.Anxiety, label: '불안', emoji: '😟', color: 'bg-indigo-200 text-indigo-800', hoverColor: 'hover:bg-indigo-300' },
  { value: Mood.Calm, label: '평온', emoji: '😌', color: 'bg-green-200 text-green-800', hoverColor: 'hover:bg-green-300' },
];

export const WEATHER_OPTIONS: Weather[] = [
  Weather.Sunny,
  Weather.Rainy,
  Weather.Cloudy,
];

export const MusicIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
    </svg>
);

export const ArticleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

export const MicrophoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
);