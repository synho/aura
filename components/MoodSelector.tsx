import React from 'react';
import { MOOD_OPTIONS, MoodOption } from '../constants';
import { Mood } from '../types';

interface MoodSelectorProps {
  selectedMood: Mood | null;
  onSelectMood: (mood: Mood) => void;
  isAnalyzing?: boolean;
}

const MoodSelector: React.FC<MoodSelectorProps> = ({ selectedMood, onSelectMood, isAnalyzing }) => {
  const labelText = isAnalyzing 
    ? "Aura is analyzing your voice and story..." 
    : "How are you feeling right now?";

  return (
    <div className={`transition-opacity duration-300 ${isAnalyzing ? 'opacity-60' : 'opacity-100'}`}>
      <label className="block text-lg font-semibold text-gray-700 mb-3 text-center">
        {labelText}
      </label>
      <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 ${isAnalyzing ? 'pointer-events-none' : ''}`}>
        {MOOD_OPTIONS.map((option: MoodOption) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelectMood(option.value)}
            className={`p-4 rounded-xl shadow-sm transition-all duration-200 ease-in-out transform flex flex-col items-center justify-center space-y-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${option.color} ${option.hoverColor} ${
              selectedMood === option.value
                ? 'ring-2 ring-purple-600 scale-105'
                : 'hover:scale-105'
            }`}
          >
            <span className="text-3xl">{option.emoji}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MoodSelector;
