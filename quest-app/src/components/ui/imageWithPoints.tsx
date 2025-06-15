'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ComponentData } from '@/lib/types';

export default function ImageWithPoints({ component }: { component: ComponentData }) {
  const [showPoints, setShowPoints] = useState(true);
  const [activePoint, setActivePoint] = useState<number | null>(null);
  
  const imageContent = component.content as any;

  const handleNextPoint = () => {
    if (!imageContent.points?.length) return;
    if (activePoint === null) {
      setActivePoint(0);
    } else {
      setActivePoint((activePoint + 1) % imageContent.points.length);
    }
  };

  const handlePrevPoint = () => {
    if (!imageContent.points?.length) return;
    if (activePoint === null) {
      setActivePoint(imageContent.points.length - 1);
    } else {
      setActivePoint(activePoint === 0 ? imageContent.points.length - 1 : activePoint - 1);
    }
  };

  return (
    <div className="space-y-4">
      {/* Help text */}
      {imageContent.points?.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-700">
            💡 This image contains {imageContent.points.length} point{imageContent.points.length !== 1 ? 's' : ''} of interest. 
            Click on the numbered points or use the controls below to explore them.
          </p>
        </div>
      )}
      
      <div className="w-full relative">
        <div className="relative w-full aspect-[4/3] sm:aspect-video max-w-[95vw] mx-auto">
          <Image
            src={imageContent.url}
            alt="Artifact Image"
            fill
            className="rounded-lg object-contain"
            sizes="(max-width: 640px) 95vw, 100vw"
          />
          {showPoints && imageContent.points?.map((point: any, index: number) => (
            <div
              key={point.id}
              className="absolute w-6 h-6 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200"
              style={{ 
                left: `${point.x}%`,
                top: `${point.y}%`,
                opacity: activePoint === null || activePoint === index ? 1 : 0.3
              }}
            >
              <div 
                className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold cursor-pointer transition-colors ${
                  activePoint === index ? 'bg-blue-500 ring-2 ring-white' : 'bg-red-500/50'
                }`}
                onClick={() => setActivePoint(index)}
              >
                {index + 1}
              </div>
            </div>
          ))}
        </div>


      </div>

      {/* Controls */}
      <div className="flex items-center justify-between bg-gray-100 p-4 rounded-lg">
        <button
          onClick={() => setShowPoints(!showPoints)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            showPoints 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
          }`}
        >
          {showPoints ? 'Hide Points' : 'Show Points'}
        </button>
        
        {imageContent.points?.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevPoint}
              className="p-2 bg-white rounded-lg border hover:bg-gray-50 transition-colors"
            >
              ←
            </button>
            <span className="text-sm font-medium min-w-[100px] text-center">
              {activePoint !== null ? `Point ${activePoint + 1}` : 'Select Point'}
            </span>
            <button
              onClick={handleNextPoint}
              className="p-2 bg-white rounded-lg border hover:bg-gray-50 transition-colors"
            >
              →
            </button>
          </div>
        )}
      </div>
      
      {/* Points list */}
      {imageContent.points?.length > 0 && (
        <div className="space-y-3 mt-4 bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold flex items-center justify-between">
            <span>Points of Interest</span>
            {activePoint !== null && (
              <span className="text-sm text-gray-500">
                Point {activePoint + 1} of {imageContent.points.length}
              </span>
            )}
          </h4>
          <div className="space-y-2">
            {activePoint !== null ? (
              <div className="flex gap-2 items-start p-3 bg-white rounded-lg shadow-sm">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold">
                  {activePoint + 1}
                </div>
                <p className="text-sm text-gray-700">{imageContent.points[activePoint].text}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-2">
                Select a point to view its description
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}