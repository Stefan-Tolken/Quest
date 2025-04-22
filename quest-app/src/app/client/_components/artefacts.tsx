'use client';
import { useState } from 'react';
import { mockArtefacts } from '@/lib/mockData';
import ArtefactCarousel from '@/components/ui/artefactCarousel';
import SearchBar from '@/components/ui/searchBar';
import type { Artefact } from '@/lib/mockData';

export default function Artefacts() {
  const [filteredArtefacts, setFilteredArtefacts] = useState<Artefact[]>(mockArtefacts);

  const handleSearch = (results: Artefact[]) => {
    setFilteredArtefacts(results);
  };

  return (
    <div className="p-6">
      <SearchBar onSearch={handleSearch} artefacts={mockArtefacts} />
      <ArtefactCarousel artefacts={filteredArtefacts} />
    </div>
  );
}