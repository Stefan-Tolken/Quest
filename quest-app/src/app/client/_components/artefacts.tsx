'use client';
import { useState, useRef, useEffect } from 'react';
import { mockArtefacts } from '@/lib/mockData';
import ArtefactCarousel from '@/components/ui/artefactCarousel';
import SearchBar from '@/components/ui/searchBar';
import ArtefactDetail from '@/components/ui/artefactDetails';
import type { Artefact } from '@/lib/mockData';

export default function Artefacts({ setSwipeEnabled }: { setSwipeEnabled: (enabled: boolean) => void }) {
  const [filteredArtefacts, setFilteredArtefacts] = useState<Artefact[]>(mockArtefacts);
  const [selectedArtefact, setSelectedArtefact] = useState<Artefact | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailPosition, setDetailPosition] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const handleSearch = (results: Artefact[]) => {
    setFilteredArtefacts(results);
  };

  const handleArtefactSelect = (artefact: Artefact, elementRect: DOMRect) => {
    // Store the position and dimensions of the clicked element
    setDetailPosition({
      top: elementRect.top,
      left: elementRect.left,
      width: elementRect.width,
      height: elementRect.height
    });
    
    setSelectedArtefact(artefact);
    setDetailOpen(true);
  };

  const handleDetailClose = () => {
    // Only update state - the animation handles the actual closing
    setDetailOpen(false);
  };

  return (
    <div className="p-6">
      <SearchBar onSearch={handleSearch} artefacts={mockArtefacts} />
      {filteredArtefacts.length > 0 ? (
        <ArtefactCarousel 
          artefacts={filteredArtefacts} 
          onArtefactSelect={handleArtefactSelect}
        />
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No artefacts found matching your search.</p>
        </div>
      )}
      
      <ArtefactDetail
        artefact={selectedArtefact}
        isOpen={detailOpen}
        onClose={handleDetailClose}
        startPosition={detailPosition}
        onVisibilityChange={(visible) => {
          setSwipeEnabled(!visible);
        }}
      />
    </div>
  );
}