'use client';
import { useState, useCallback } from 'react';
import Fuse from 'fuse.js';
import { Artefact as ArtefactType } from '@/lib/mockData';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
  onSearch: (results: ArtefactType[]) => void;
  artefacts: ArtefactType[];
}

export default function SearchBar({ onSearch, artefacts }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Initialize Fuse instance with our artefacts
  const fuse = new Fuse(artefacts, {
    keys: ['name', 'description'],
    threshold: 0.4,
    includeScore: true
  });

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    
    if (!value) {
      onSearch(artefacts); // Show all artefacts when search is empty
      return;
    }

    const results = fuse.search(value);
    const filteredArtefacts = results.map(result => result.item);
    onSearch(filteredArtefacts);
  }, [artefacts, fuse, onSearch]);

  const handleClear = () => {
    handleSearch('');
  };

  return (
    <div className="searchBar top-4 flex-1 z-50">
      <div className="relative w-full max-w-3xl mx-auto">
        <Input
          type="text"
          placeholder="Search artefacts..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="bg-white border-none"
        />
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label="Clear search"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}