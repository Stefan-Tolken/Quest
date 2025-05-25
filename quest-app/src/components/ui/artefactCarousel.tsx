import { useState, useEffect, useRef } from 'react';
import { ArtefactCard } from "./artefactCard";
import type { Artefact as ArtefactType } from "@/lib/types";

interface ArtefactCarouselProps {
  artefacts: ArtefactType[];
  onArtefactSelect?: (artefact: ArtefactType, elementRect: DOMRect) => void;
}

export default function ArtefactCarousel({ artefacts, onArtefactSelect }: ArtefactCarouselProps) {
  const totalItems = artefacts.length;
  const [centerIndex, setCenterIndex] = useState(Math.floor(totalItems / 2));
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [visibleIndices, setVisibleIndices] = useState<number[]>([]);
  const [previousVisibleIndices, setPreviousVisibleIndices] = useState<number[]>([]);
  const [newItems, setNewItems] = useState<Record<number, boolean>>({});
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  // In ArtefactCarousel component
  useEffect(() => {
    // Reset center index when artefacts array changes
    if (artefacts.length > 0) {
      setCenterIndex(Math.floor(artefacts.length / 2));
    } else {
      // Handle empty artefacts array
      setVisibleIndices([]);
    }
  }, [artefacts]);

  // Define fixed heights for centered and side items
  const centerItemHeight = 275; // Height for centered item (larger)
  const sideItemHeight = 80;   // Height for non-centered items (smaller)
  
  useEffect(() => {
    setCenterIndex(Math.floor(totalItems / 2));
  }, [artefacts]);

  // Variable to determine how many items to display
  const itemsToShow = 3; // Change this value to 3 or any other number as needed

  // Calculate the indexes of the items to display
  const getVisibleIndexes = () => {
    if (totalItems === 0) return [];

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

  // Track visible indices changes to detect new items
  useEffect(() => {
    const currentVisibleIndices = getVisibleIndexes();
    
    // Find new items that weren't visible before
    const newItemsObj: Record<number, boolean> = {};
    currentVisibleIndices.forEach(index => {
      if (!previousVisibleIndices.includes(index)) {
        newItemsObj[index] = true;
      }
    });
    
    setNewItems(newItemsObj);
    setVisibleIndices(currentVisibleIndices);
    
    // Clear new items status after animation
    const timer = setTimeout(() => {
      setNewItems({});
      setPreviousVisibleIndices(currentVisibleIndices);
    }, 50); // Slightly longer than the animation duration
    
    return () => clearTimeout(timer);
  }, [centerIndex]);

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

  // Calculate vertical positions with fixed heights
  const calculatePositions = () => {
    const positions: Record<number, number> = {};
    const height = 0;
    
    visibleIndices.forEach((index) => {
      const position = index - centerIndex;
      
      if (position === 0) {
        // Center item
        positions[index] = 0;
      } else if (position < 0) {
        // Items above center
        positions[index] = -(centerItemHeight/2 + sideItemHeight/2 + height);
      } else {
        // Items below center
        positions[index] = (centerItemHeight/2 + sideItemHeight/2 + height);
      }
    });
    
    return positions;
  };
  
  const verticalPositions = calculatePositions();

  // Determine animation direction based on item position
  const getAnimationStyle = (index: number) => {
    if (!newItems[index]) return {};
    
    const position = index - centerIndex;
    const isAbove = position > 0;
    
    // Initial transform based on spawn position (top or bottom)
    return {
      transform: `translateY(${verticalPositions[index]}px) scale(0.1)`,
      opacity: 0,
      transformOrigin: isAbove ? 'bottom center' : 'top center'
    };
  };

  // Handle click on center item
  const handleItemClick = (index: number, artefact: ArtefactType) => {
    if (index === centerIndex && onArtefactSelect) {
      const itemRef = itemRefs.current[`${artefact.id}-${index}`];
      if (itemRef) {
        const rect = itemRef.getBoundingClientRect();
        onArtefactSelect(artefact, rect);
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      className="fixed top-0 left-0 right-0 h-screen flex items-center justify-center pointer-events-auto overflow-hidden"
    >
      <div className="relative w-full max-w-5xl mx-auto h-[90vh] flex items-center justify-center">
        <div className="list-none w-full h-full relative flex flex-col items-center justify-center">
          {visibleIndices.map((index) => {
            if (!artefacts[index]) return null;

            const artefact = artefacts[index];
            const isCenter = index === centerIndex;
            const centerScale = 1.2; // Slightly larger scale for center item
            const sideScale = 0.9; // Smaller scale for side items
            const isNew = newItems[index];
            
            return (
              <div 
                key={`${artefact.id}-${index}`} 
                ref={(el) => {itemRefs.current[`${artefact.id}-${index}`] = el}}
                className={`absolute transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isCenter ? 'opacity-100' : 'opacity-60 hover:opacity-70'
                } ${isCenter ? 'cursor-pointer' : ''}`}
                style={{
                  transform: `translateY(${verticalPositions[index]}px) scale(${isCenter ? centerScale : sideScale})`,
                  zIndex: isCenter ? 20 : 10,
                  width: isCenter ? '70%' : '60%',
                  height: isCenter ? `${centerItemHeight}px` : `${sideItemHeight}px`,
                  ...(isNew ? getAnimationStyle(index) : {}),
                }}
                onClick={() => handleItemClick(index, artefact)}
              >
                <ArtefactCard
                  id={artefact.id}
                  name={artefact.name}
                  description={artefact.description}
                  isCenter={isCenter}
                  isGrid={false}
                  image={typeof artefact.image === 'string' ? artefact.image : undefined}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}