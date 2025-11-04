import React from 'react';
import { AuraAnalysis, AuraResponse } from '../types';
import { ArticleIcon, FeatherIcon, MusicIcon, SparklesIcon } from '../constants';

interface ResultCardProps {
  data: AuraResponse;
  imageUrl: string | null;
  analysis: AuraAnalysis | null;
}

const AuraAnalysisDisplay: React.FC<{ analysis: AuraAnalysis | null }> = ({ analysis }) => {
  if (!analysis) return null;

  const hasContent = analysis.predicted_age || analysis.predicted_gender || analysis.mood_discrepancy_comment;
  if (!hasContent) return null;

  return (
    <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
      <h3 className="text-sm font-semibold text-purple-700 uppercase tracking-wider mb-2 flex items-center gap-2">
        <SparklesIcon />
        Aura's Little Analysis
      </h3>
      <div className="bg-purple-50/50 p-4 rounded-lg space-y-3 text-sm text-gray-700 border border-purple-200">
        {analysis.predicted_age && <p>{analysis.predicted_age}</p>}
        {analysis.predicted_gender && <p>{analysis.predicted_gender}</p>}
        {analysis.mood_discrepancy_comment && (
          <div className="pt-3 mt-3 border-t border-purple-200">
            <p><strong className="font-semibold text-purple-800">Just a thought...</strong> {analysis.mood_discrepancy_comment}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ResultCard: React.FC<ResultCardProps> = ({ data, imageUrl, analysis }) => {
  const { empathy_message, content_recommendation, background_story, reference, angelic_task } = data;
  const { type, title, link } = content_recommendation;
  const isMusic = type === 'music';

  return (
    <div className="mt-8 w-full bg-white/70 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-lg border border-purple-100">
        
      <div className="border-b-2 border-purple-200 pb-4 mb-4 animate-fade-in" style={{ animationDelay: '150ms' }}>
        <p className="text-lg text-gray-700 italic">"{empathy_message}"</p>
      </div>
      
      <div className="space-y-6">
        <AuraAnalysisDisplay analysis={analysis} />

        {angelic_task && (
          <div className="animate-fade-in" style={{ animationDelay: '450ms' }}>
            <h3 className="text-sm font-semibold text-purple-700 uppercase tracking-wider mb-2 flex items-center gap-2">
              <FeatherIcon />
              A Gentle Nudge from Aura
            </h3>
            <p className="text-gray-700 bg-purple-50/50 p-4 rounded-lg border border-purple-200 italic">{angelic_task}</p>
          </div>
        )}

        {imageUrl && (
            <div className="animate-fade-in" style={{ animationDelay: '600ms' }}>
                <h3 className="text-sm font-semibold text-purple-700 uppercase tracking-wider mb-2">A Visualization of Your Feelings</h3>
                <img
                    src={`data:image/png;base64,${imageUrl}`}
                    alt="Generated calming visual for your mood"
                    className="w-full h-auto rounded-xl object-cover shadow-lg border border-gray-200"
                />
            </div>
        )}

        <div className="animate-fade-in" style={{ animationDelay: '750ms' }}>
          <h3 className="text-sm font-semibold text-purple-700 uppercase tracking-wider mb-2">Aura's Recommendation</h3>
          
           <a 
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-all duration-300 ease-in-out shadow-sm hover:shadow-lg transform hover:-translate-y-1"
            >
              <div className="flex-shrink-0 text-purple-500">
                {isMusic ? <MusicIcon /> : <ArticleIcon />}
              </div>
              <div>
                <p className="font-bold text-gray-800">{title}</p>
                <p className="text-xs text-purple-600 hover:underline">
                  {isMusic ? 'Search on YouTube Music' : 'View Content'}
                </p>
              </div>
            </a>
        </div>
        
        <div className="animate-fade-in" style={{ animationDelay: '900ms' }}>
          <h3 className="text-sm font-semibold text-purple-700 uppercase tracking-wider mb-2">Why this was chosen for you</h3>
          <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{background_story}</p>
        </div>

        <div className="animate-fade-in" style={{ animationDelay: '1050ms' }}>
          <h3 className="text-sm font-semibold text-purple-700 uppercase tracking-wider mb-2">Source</h3>
          <p className="text-gray-600 text-sm font-medium">{reference}</p>
        </div>
      </div>
      
    </div>
  );
};

export default ResultCard;