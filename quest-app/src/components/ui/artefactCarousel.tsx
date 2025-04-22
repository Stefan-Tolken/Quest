import { useState, useEffect, useRef } from 'react';
import { mockArtefacts } from "@/lib/mockData";
import { Artefact } from "./artefact";

export default function ArtefactCarousel() {
  const [centerIndex, setCenterIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const totalItems = mockArtefacts.length;
  const [isScrolling, setIsScrolling] = useState(false);

  // Calculate the indexes of the 5 items to display (2 above, center, 2 below)
  const getVisibleIndexes = () => {
    const indexes = [];
    for (let i = -2; i <= 2; i++) {
      // Handle circular indexing
      let index = (centerIndex + i + totalItems) % totalItems;
      indexes.push(index);
    }
    return indexes;
  };

  const visibleIndexes = getVisibleIndexes();

  // Handle wheel events to update the center index
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      if (isScrolling) return;
      setIsScrolling(true);
      
      // Determine scroll direction
      const delta = Math.sign(e.deltaY);
      setCenterIndex(prev => {
        const newIndex = (prev + delta + totalItems) % totalItems;
        return newIndex;
      });
      
      setTimeout(() => setIsScrolling(false), 100);
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
      
      setCenterIndex(prev => {
        const direction = delta > 0 ? -1 : 1;
        return (prev + direction + totalItems) % totalItems;
      });
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
        <ol className="list-none w-full h-full relative">
          {visibleIndexes.map((index) => {
            const artefact = mockArtefacts[index];
            const isCenter = index === centerIndex;
            const position = visibleIndexes.indexOf(index) - 2; // -2, -1, 0, 1, 2
            const spacing = 120; // Increased spacing between items
            
            return (
              <div 
                key={artefact.id} 
                className={`absolute left-0 right-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isCenter ? 'opacity-100' : 'opacity-70'
                }`}
                style={{
                  transform: isCenter 
                    ? 'translateY(0) scale(1.1)' 
                    : `translateY(${position * spacing}px) scale(${1 - Math.abs(position) * 0.1})`,
                  zIndex: isCenter ? 10 : 5 - Math.abs(position),
                  top: '50%',
                  marginTop: '-60px', // Adjusted for better centering
                  padding: '0 2rem', // Added horizontal padding to prevent cutting off
                }}
              >
                <div className='bg-gray-100 p-4 rounded flex items-center gap-6'>
                    <span className="text-2xl font-bold text-gray-400 w-10 text-center">
                    {index + 1}
                    </span>
                    <div className="flex-1">
                    <Artefact
                        id={artefact.id}
                        name={artefact.name}
                        description={artefact.description}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </ol>
      </div>
    </div>
  );
}