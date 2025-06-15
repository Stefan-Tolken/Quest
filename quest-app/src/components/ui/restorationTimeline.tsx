"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Calendar } from 'lucide-react';
import { ComponentData } from '@/lib/types';

export default function RestorationTimeline({ component }: { component: ComponentData }) {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  
  const restorationContent = component.content as any;
  const restorations = restorationContent.restorations || [];

  const handleNext = () => {
    if (restorations.length === 0) return;
    setActiveIndex((prev) => (prev + 1) % restorations.length);
  };

  const handlePrev = () => {
    if (restorations.length === 0) return;
    setActiveIndex((prev) => prev === 0 ? restorations.length - 1 : prev - 1);
  };

  const handleTimelineClick = (index: number) => {
    setActiveIndex(index);
  };

  if (!restorations.length) {
    return (
      <div className="border rounded-lg p-4">
        <h4 className="font-semibold mb-2">Restoration Timeline</h4>
        <p className="text-muted-foreground">No restoration data available</p>
      </div>
    );
  }

  const currentRestoration = restorations[activeIndex];

  return (
    <div className="border rounded-lg p-6 space-y-6">
      <h4 className="font-semibold text-xl">Restoration Timeline</h4>
      
      {/* Timeline visualization */}
      <div className="relative">
        <div className="flex items-center justify-between relative">
          {/* Timeline line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-300 -translate-y-1/2"></div>
          
          {/* Timeline points */}
          {restorations.map((_: any, index: number) => (
            <div key={index} className="relative flex flex-col items-center">
              <button
                onClick={() => handleTimelineClick(index)}
                className={`w-4 h-4 rounded-full border-2 bg-white transition-all duration-200 hover:scale-110 ${
                  index === activeIndex 
                    ? 'border-blue-500 bg-blue-500' 
                    : index < activeIndex 
                      ? 'border-green-500 bg-green-500' 
                      : 'border-gray-300'
                }`}
              />
              <span className="text-xs text-gray-500 mt-2 max-w-16 text-center">
                {restorations[index].date}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation controls */}
      <div className="flex items-center justify-between bg-gray-100 p-4 rounded-lg">
        <button
          onClick={handlePrev}
          disabled={restorations.length <= 1}
          className="p-2 bg-white rounded-lg border hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ←
        </button>
        
        <div className="text-center">
          <span className="text-sm font-medium">
            Step {activeIndex + 1} of {restorations.length}
          </span>
        </div>
        
        <button
          onClick={handleNext}
          disabled={restorations.length <= 1}
          className="p-2 bg-white rounded-lg border hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          →
        </button>
      </div>

      {/* Current restoration details */}
      <div className="bg-white border rounded-lg p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h5 className="font-semibold text-lg text-blue-600">
              {currentRestoration.name}
            </h5>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {currentRestoration.date}
            </p>
          </div>
          {currentRestoration.organization && (
            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              {currentRestoration.organization}
            </div>
          )}
        </div>

        <p className="text-gray-700 leading-relaxed">
          {currentRestoration.description}
        </p>

        {currentRestoration.imageUrl && (
          <div className="relative w-full max-w-full rounded-lg overflow-hidden bg-gray-100" style={{ aspectRatio: '16/9' }}>
            <Image
              src={currentRestoration.imageUrl}
              alt={currentRestoration.name}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        )}
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2">
        {restorations.map((_: any, index: number) => (
          <button
            key={index}
            onClick={() => handleTimelineClick(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === activeIndex ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}