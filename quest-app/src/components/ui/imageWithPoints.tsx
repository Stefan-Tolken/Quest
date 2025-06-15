'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ComponentData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { set } from 'date-fns';

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

      <div className='absolute z-50 right-0 m-10 flex flex-col gap-2 justify-end'>
        
      </div>

      
      <div className="w-full relative">
        <div className="relative w-full max-w-[95vw] mx-auto rounded-lg overflow-hidden">
          {/* Image wrapper maintains its own aspect ratio and lets Image fill the width */}
          <div className="w-full relative">
            <Image
              src={imageContent.url}
              alt="Artifact Image"
              width={1280}
              height={720}
              className="rounded-lg object-cover w-full h-auto"
              sizes="(max-width: 640px) 95vw, 100vw"
            />
            {showPoints &&
              imageContent.points?.map((point, index) => (
                <div
                  key={point.id}
                  className="absolute w-6 h-6 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200"
                  style={{ 
                    left: `${point.x}%`,
                    top: `${point.y}%`,
                  opacity: activePoint === null || activePoint === index ? 1 : 0.3
                  }}>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-background text-sm font-bold cursor-pointer transition-colors ${
                      activePoint === index ? 'bg-foreground ring-2 ring-background' : 'bg-foreground'
                    }`}
                    onClick={() => setActivePoint(index)}
                  >
                    {index + 1}
                  </div>
                </div>
              ))}
          </div>
        </div>


      </div>

      {/* Controls */}        
      {imageContent.points?.length > 0 && (
        <div className="flex items-center justify-evenly gap-3">
          <Button
            onClick={handlePrevPoint}
            size={"icon"}
          >
            ←
          </Button>
          <span className="text-sm font-medium min-w-[100px] text-center">
            {activePoint !== null ? `Point ${activePoint + 1} of ${imageContent.points.length}` : 'Select Point'}
          </span>
          <Button
            onClick={handleNextPoint}
            size={"icon"}
          >
            →
          </Button>
        </div>
      )}
      
      {/* Points list */}
      {imageContent.points?.length > 0 && (
        <div className="space-y-3 mt-4 glass rounded-lg">

          <div className="space-y-2">
            {activePoint !== null ? (
              <div className="flex gap-2 items-start p-4 rounded-lg shadow-sm">
                <div className="w-6 h-6 bg-foreground ring-2 ring-background rounded-full flex-shrink-0 flex items-center justify-center text-background text-sm font-bold">
                  {activePoint + 1}
                </div>
                <p className="text-md text-foreground">{imageContent.points[activePoint].text}</p>
              </div>
            ) : (
              <div className="flex gap-2 items-start p-4 rounded-lg shadow-sm">
                <p>
                  This image contains {imageContent.points.length} point{imageContent.points.length !== 1 ? 's' : ''} of interest. 
                  Click on the numbered points or use the controls below to explore them.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}