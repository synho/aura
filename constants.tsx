import React from 'react';
import { Mood, Weather } from './types';

export interface MoodOption {
  value: Mood;
  label: string;
  emoji: string;
  color: string;
  hoverColor: string;
  gradientColors: [string, string];
}

export const MOOD_OPTIONS: MoodOption[] = [
  { value: Mood.Joy, label: 'Joy', emoji: '😊', color: 'bg-yellow-200 text-yellow-800', hoverColor: 'hover:bg-yellow-300', gradientColors: ['#fde68a', '#facc15'] },
  { value: Mood.Sadness, label: 'Sadness', emoji: '😢', color: 'bg-blue-200 text-blue-800', hoverColor: 'hover:bg-blue-300', gradientColors: ['#a5b4fc', '#60a5fa'] },
  { value: Mood.Exhaustion, label: 'Exhaustion', emoji: '😫', color: 'bg-gray-300 text-gray-800', hoverColor: 'hover:bg-gray-400', gradientColors: ['#e5e7eb', '#9ca3af'] },
  { value: Mood.Anxiety, label: 'Anxiety', emoji: '😟', color: 'bg-indigo-200 text-indigo-800', hoverColor: 'hover:bg-indigo-300', gradientColors: ['#a5b4fc', '#818cf8'] },
  { value: Mood.Calm, label: 'Calm', emoji: '😌', color: 'bg-green-200 text-green-800', hoverColor: 'hover:bg-green-300', gradientColors: ['#a7f3d0', '#4ade80'] },
  { value: Mood.Anger, label: 'Anger', emoji: '😠', color: 'bg-red-200 text-red-800', hoverColor: 'hover:bg-red-300', gradientColors: ['#fecaca', '#f87171'] },
  { value: Mood.Hopeful, label: 'Hopeful', emoji: '✨', color: 'bg-sky-200 text-sky-800', hoverColor: 'hover:bg-sky-300', gradientColors: ['#bae6fd', '#38bdf8'] },
  { value: Mood.Overwhelmed, label: 'Overwhelmed', emoji: '😵', color: 'bg-purple-200 text-purple-800', hoverColor: 'hover:bg-purple-300', gradientColors: ['#d8b4fe', '#c084fc'] },
  { value: Mood.Excited, label: 'Excited', emoji: '🎉', color: 'bg-orange-200 text-orange-800', hoverColor: 'hover:bg-orange-300', gradientColors: ['#fed7aa', '#fb923c'] },
  { value: Mood.Grateful, label: 'Grateful', emoji: '🙏', color: 'bg-pink-200 text-pink-800', hoverColor: 'hover:bg-pink-300', gradientColors: ['#fbcfe8', '#f472b6'] },
  { value: Mood.Confused, label: 'Confused', emoji: '🤔', color: 'bg-teal-200 text-teal-800', hoverColor: 'hover:bg-teal-300', gradientColors: ['#99f6e4', '#2dd4bf'] },
  { value: Mood.Lonely, label: 'Lonely', emoji: '😞', color: 'bg-slate-200 text-slate-800', hoverColor: 'hover:bg-slate-300', gradientColors: ['#d1d5db', '#94a3b8'] },
  { value: Mood.Proud, label: 'Proud', emoji: '🏆', color: 'bg-amber-200 text-amber-800', hoverColor: 'hover:bg-amber-300', gradientColors: ['#fde68a', '#fcd34d'] },
  { value: Mood.Bored, label: 'Bored', emoji: '😑', color: 'bg-stone-200 text-stone-800', hoverColor: 'hover:bg-stone-300', gradientColors: ['#e7e5e4', '#d6d3d1'] },
  { value: Mood.Nostalgic, label: 'Nostalgic', emoji: '🎞️', color: 'bg-rose-200 text-rose-800', hoverColor: 'hover:bg-rose-300', gradientColors: ['#fecdd3', '#fda4af'] },
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
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2-2z" />
    </svg>
);

export const MicrophoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
);

export const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm6 0a1 1 0 011 1v1h1a1 1 0 010 2h-1v1a1 1 0 01-2 0V6h-1a1 1 0 010-2h1V3a1 1 0 011-1zM3.293 11.293a1 1 0 010 1.414l-1 1a1 1 0 01-1.414-1.414l1-1a1 1 0 011.414 0zm12.414 0a1 1 0 011.414 0l1 1a1 1 0 01-1.414 1.414l-1-1a1 1 0 010-1.414zM10 16a1 1 0 011 1v1h1a1 1 0 010 2h-1v1a1 1 0 01-2 0v-1h-1a1 1 0 010-2h1v-1a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);

export const ShareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
    </svg>
);