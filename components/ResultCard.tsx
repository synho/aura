import React from 'react';
import { AuraResponse } from '../types';
import { ArticleIcon, MusicIcon } from '../constants';

interface ResultCardProps {
  data: AuraResponse;
  imageUrl: string | null;
}

const ResultCard: React.FC<ResultCardProps> = ({ data, imageUrl }) => {
  const { empathy_message, content_recommendation, background_story, reference } = data;
  const isMusic = content_recommendation.type === 'music';

  return (
    <div className="mt-8 w-full bg-white/70 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-lg border border-purple-100 animate-fade-in">
      {imageUrl && (
        <div className="mb-6">
          <img
            src={`data:image/png;base64,${imageUrl}`}
            alt="Generated calming visual for your mood"
            className="w-full h-auto rounded-xl object-cover shadow-lg border border-gray-200"
          />
        </div>
      )}

      <div className="border-b-2 border-purple-200 pb-4 mb-4">
        <p className="text-lg text-gray-700 italic">"{empathy_message}"</p>
      </div>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-purple-700 uppercase tracking-wider mb-2">아우라의 추천</h3>
          <a 
            href={content_recommendation.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-200"
          >
            <div className="flex-shrink-0 text-purple-500">
              {isMusic ? <MusicIcon /> : <ArticleIcon />}
            </div>
            <div>
              <p className="font-bold text-gray-800">{content_recommendation.title}</p>
              <p className="text-xs text-purple-600 hover:underline">
                {isMusic ? 'YouTube Music에서 검색하기' : '콘텐츠 보러가기'}
              </p>
            </div>
          </a>
        </div>
        
        <div>
          <h3 className="text-sm font-semibold text-purple-700 uppercase tracking-wider mb-2">추천 이유</h3>
          <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{background_story}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-purple-700 uppercase tracking-wider mb-2">출처</h3>
          <p className="text-gray-600 text-sm font-medium">{reference}</p>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;