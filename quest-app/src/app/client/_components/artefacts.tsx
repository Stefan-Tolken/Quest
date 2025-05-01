// components/ui/artefacts.tsx
'use client';
import { useState, useRef, useEffect } from 'react';
import { useData } from '@/context/dataContext';
import ArtefactCarousel from '@/components/ui/artefactCarousel';
import SearchBar from '@/components/ui/searchBar';
import ArtefactDetail from '@/components/ui/artefactDetails';
import type { Artefact } from '@/lib/types';
import ArtefactGrid from '@/components/ui/artefactGrid';

export default function Artefacts({ setSwipeEnabled }: { setSwipeEnabled: (enabled: boolean) => void }) {
  const { artefacts, loading, error } = useData();
  const [isGrid, setIsGrid] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('artefactsViewIsGrid');
      return savedState === 'true';
    }
    return false;
  });
  
  const [filteredArtefacts, setFilteredArtefacts] = useState<Artefact[]>(artefacts);
  const [selectedArtefact, setSelectedArtefact] = useState<Artefact | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailPosition, setDetailPosition] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  // Update filtered artefacts when the main artefacts data changes
  useEffect(() => {
    setFilteredArtefacts(artefacts);
  }, [artefacts]);

  // Save to localStorage whenever isGrid changes
  useEffect(() => {
    localStorage.setItem('artefactsViewIsGrid', String(isGrid));
  }, [isGrid]);

  const handleSearch = (results: Artefact[]) => {
    setFilteredArtefacts(results);
  };

  const handleArtefactSelect = (artefact: Artefact, elementRect: DOMRect) => {
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
    setDetailOpen(false);
  };

  const handleViewToggle = () => {
    setIsGrid(!isGrid);
  };

  if (loading) {
    return <div className="p-6">Loading artefacts...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-6">
      <SearchBar 
        onSearch={handleSearch} 
        artefacts={artefacts}
        isGrid={isGrid}
        onViewToggle={handleViewToggle}
      />
      
      {filteredArtefacts.length > 0 ? (
        isGrid ? (
          <ArtefactGrid
            artefacts={filteredArtefacts}
            onArtefactSelect={handleArtefactSelect}
          />
        ) : (
          <ArtefactCarousel 
            artefacts={filteredArtefacts} 
            onArtefactSelect={handleArtefactSelect}
          />
        )
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No artefacts found matching your search.</p>
        </div>
      )}
      
      <ArtefactDetail
        artefactId={selectedArtefact?.id}
        isOpen={detailOpen}
        onClose={handleDetailClose}
        onVisibilityChange={(visible) => {
          setSwipeEnabled(!visible);
        }}
      />
    </div>
  );
}