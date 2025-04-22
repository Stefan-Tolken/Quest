import { useState, useEffect, useRef } from 'react';
import { mockArtefacts } from "@/lib/mockData";
import { Artefact } from "./artefact";
import type { Artefact as ArtefactType } from "@/lib/mockData";

interface ArtefactCarouselProps {
  artefacts: ArtefactType[];
}

export default function ArtefactCarousel({ artefacts }: ArtefactCarouselProps) {
  const totalItems = artefacts.length;
  const [centerIndex, setCenterIndex] = useState(Math.floor(totalItems / 2));
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const itemHeight = 100; // Height of each item including spacing

  useEffect(() => {
    setCenterIndex(Math.floor(totalItems / 2));
  }, [artefacts]);

  // Variable to determine how many items to display
  const itemsToShow = 3; // Change this value to 3 or any other number as needed

  // Calculate the indexes of the items to display
  const getVisibleIndexes = () => {
    const indexes = [];
    const halfToShow = Math.floor(itemsToShow / 2);

    // Show fewer items when near boundaries
    for (let i = -halfToShow; i <= halfToShow; i++) {
      const index = centerIndex + i;
      if (index >= 0 && index < totalItems) {
        indexes.push(index);
      }
    }

    return indexes;
  };

  const visibleIndexes = getVisibleIndexes();

  // Handle wheel events to update the center index
  const handleScroll = (direction: number) => {
    if (isScrolling) return;
    setIsScrolling(true);
    
    setCenterIndex(prev => {
      let newIndex = prev + direction;
      // Clamp to valid range
      if (newIndex < 0) newIndex = 0;
      if (newIndex >= totalItems) newIndex = totalItems - 1;
      return newIndex;
    });
    
    setTimeout(() => setIsScrolling(false), 100);
  };

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      handleScroll(Math.sign(e.deltaY));
    };

    const container = containerRef.current;
    container?.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container?.removeEventListener('wheel', handleWheel);
    };
  }, [totalItems, isScrolling]);

  // Handle touch events for mobile
  useEffect(() => {
    let touchStartY = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndY = e.changedTouches[0].clientY;
      const delta = touchEndY - touchStartY;
      
      if (Math.abs(delta) < 50) return; // Ignore small touches
      handleScroll(delta > 0 ? -1 : 1);
    };

    const container = containerRef.current;
    container?.addEventListener('touchstart', handleTouchStart);
    container?.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      container?.removeEventListener('touchstart', handleTouchStart);
      container?.removeEventListener('touchend', handleTouchEnd);
    };
  }, [totalItems]);

  return (
    <div 
      ref={containerRef}
      className="fixed top-0 left-0 right-0 h-screen flex items-center justify-center pointer-events-auto overflow-hidden"
    >
      <div className="relative w-full max-w-3xl mx-auto h-[80vh] flex items-center">
        <div className="list-none w-full h-full relative">
          {visibleIndexes.map((index) => {
            const artefact = artefacts[index];
            const isCenter = index === centerIndex;
            // Calculate position relative to center
            const position = index - centerIndex;
            // Configurable spacing between items (in pixels)
            const itemSpacing = 30;
            
            return (
              <div 
                key={`${artefact.id}-${index}`} 
                className={`absolute left-0 right-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isCenter ? 'opacity-100' : 'opacity-70'
                }`}
                style={{
                  transform: isCenter 
                    ? 'translateY(0) scale(1.1)' 
                    : `translateY(${position * (itemHeight + itemSpacing)}px) scale(${1 - Math.abs(position) * 0.1})`,
                  zIndex: isCenter ? 10 : 5 - Math.abs(position),
                  top: '50%',
                  marginTop: `-${itemHeight/2}px`,
                  padding: '0 2rem',
                }}
              >
                <div className='bg-gray-100 p-4 rounded flex items-center gap-6'>
                  <Artefact
                    id={artefact.id}
                    name={artefact.name}
                    description={artefact.description}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}