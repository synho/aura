import React from 'react';
import { Mood } from '../types';
import { MOOD_OPTIONS } from '../constants';

interface MapDisplayProps {
  coords: { lat: number; lng: number };
  mood: Mood | null;
}

const MapDisplay: React.FC<MapDisplayProps> = ({ coords, mood }) => {
  const moodInfo = MOOD_OPTIONS.find(opt => opt.value === mood);

  // Define the bounding box for the iframe view
  const lat = coords.lat;
  const lon = coords.lng;
  const zoom = 0.005; // Adjust for desired zoom level
  const bbox = `${lon - zoom},${lat - zoom},${lon + zoom},${lat + zoom}`;

  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;

  return (
    <div className="mt-8">
      <h3 className="text-sm font-semibold text-purple-700 uppercase tracking-wider mb-4 text-center">
        Where you are
      </h3>
      <div className="relative rounded-xl overflow-hidden shadow-lg border border-gray-200 h-[300px] w-full">
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={mapUrl}
          style={{ border: 'none' }}
          title="User Location Map"
        ></iframe>
        {moodInfo && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="animate-marker-pop-in">
              <div className={`p-2 rounded-full shadow-lg ${moodInfo.color}`}>
                <span className="text-3xl">{moodInfo.emoji}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      {moodInfo && (
        <p className="text-center mt-3 text-gray-600">
          So this is where you were, feeling {moodInfo.label.toLowerCase()} {moodInfo.emoji} today.
        </p>
      )}
    </div>
  );
};

export default MapDisplay;