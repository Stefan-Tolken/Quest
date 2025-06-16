"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Calendar } from 'lucide-react';
import { ComponentData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

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

  const currentRestoration = restorations[activeIndex];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-center text-2xl">Restoration Timeline</h3>
      {/* Current restoration details */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          {currentRestoration && (
            <p>
              {currentRestoration.name} was done by the {currentRestoration.organization} on {currentRestoration.date} by {currentRestoration.description}
            </p>
          )}
        </div>

        {currentRestoration.imageUrl && (
          <div className="w-full relative">
            <Image
              src={currentRestoration.imageUrl}
              alt={currentRestoration.name}
              width={1280}
              height={720}
              className="rounded-lg object-cover w-full h-auto"
              sizes="(max-width: 640px) 95vw, 100vw"
            />
          </div>
        )}
      </div>

      {/* <div className="text-center mt-10">
        <span className="glass font-medium text-md py-2 px-3 rounded-lg">
          {restorations[activeIndex].date}
        </span>
      </div>
       */}
      {/* Timeline visualization */}
      <div className="relative m-0">
        <div className="flex items-start justify-between relative py-6">
          {/* Timeline line */}
          <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 h-0.5 bg-foreground z-0" />

          {/* Timeline points */}
          {restorations.map((item: any, index: number) => (
            <div key={index} className="flex flex-col items-center relative z-10">
              <Button
                onClick={() => handleTimelineClick(index)}
                aria-label={`View restoration from ${item.date}`}
                size="icon"
                className={`w-4 h-4 rounded-full flex items-center justify-center text-background text-sm font-semibold cursor-pointer transition-colors ${
                  index === activeIndex
                    ? 'bg-foreground ring-2 ring-background'
                    : 'bg-foreground'
                }`}
              />
              {/* <span className="text-xs text-gray-500 mt-2 max-w-16 text-center">
                {item.date}
              </span> */}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation controls */}
      <div className="flex items-center justify-evenly p-4 rounded-lg">
        <Button
          onClick={handlePrev}
          disabled={restorations.length <= 1}
          variant={"default"}
          size={"icon"}
        >
          <ArrowLeft size={24} />
        </Button>
        
        <div className="">
          <span className="flex items-center justify-center gap-2 text-md font-medium w-[150px]">
            <Calendar/> {restorations[activeIndex].date}
          </span>
        </div>
        
        <Button
          onClick={handleNext}
          disabled={restorations.length <= 1}
          variant={"default"}
          size={"icon"}
        >
          <ArrowRight size={24} />
        </Button>
      </div>
    </div>
  );
}