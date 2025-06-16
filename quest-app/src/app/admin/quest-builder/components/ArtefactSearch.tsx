"use client";

import { Search, Plus, Shuffle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Artefact } from "@/lib/types";

type ArtefactSearchProps = {
  searchQuery: string;
  searchResults: Artefact[];
  onSearchChange: (value: string) => void;
  onAddArtifact: (artifact: Artefact) => void;
  addedArtefactIds?: string[];
};

export const ArtefactSearch = ({
  searchQuery,
  searchResults,
  onSearchChange,
  onAddArtifact,
  addedArtefactIds = [],
}: ArtefactSearchProps) => {
  // Filter out already added artefacts (this is now handled in the parent component)
  const filteredResults = searchResults.filter(
    artifact => !addedArtefactIds.includes(artifact.id)
  );

  const isShowingRandomResults = searchQuery.trim() === "" && filteredResults.length > 0;

  // Fixed highlight function with proper regex handling
  const highlightMatch = (text: string | undefined, query: string) => {
    if (!query.trim() || !text) return text || "";
    
    // Split query into individual words for better matching
    const queryWords = query.trim().split(/\s+/).filter(word => word.length > 0);
    
    // Create a copy of the text to work with
    let highlightedText = text;
    
    // Sort query words by length (longest first) to avoid nested highlights
    const sortedWords = [...queryWords].sort((a, b) => b.length - a.length);
    
    sortedWords.forEach(word => {
      if (word.length < 2) return; // Skip very short words
      
      // Escape special regex characters
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Match whole words or parts of words
      const regex = new RegExp(`\\b(${escapedWord}\\w*)\\b|\\b(\\w*${escapedWord}\\w*)\\b`, 'gi');
      
      highlightedText = highlightedText.replace(regex, (match) => 
        `<span class="text-blue-700 font-medium underline decoration-blue-400 decoration-2 underline-offset-2">${match}</span>`
      );
    });
    
    return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };

  // Helper function to get relevant metadata for display
  const getArtefactMetadata = (artifact: Artefact) => {
    const metadata: string[] = [];
    if (artifact.artist) metadata.push(`Artist: ${artifact.artist}`);
    if (artifact.date) metadata.push(`Date: ${artifact.date}`);
    if (artifact.createdAt) metadata.push(`Added: ${new Date(artifact.createdAt).toLocaleDateString()}`);
    if (artifact.partOfQuest && artifact.partOfQuest.length > 0) metadata.push(`Used in ${artifact.partOfQuest.length} quest${artifact.partOfQuest.length === 1 ? '' : 's'}`);
    return metadata;
  };

  // Calculate search relevance score for sorting
  const getSearchRelevance = (artifact: Artefact, query: string) => {
    if (!query.trim()) return 0;
    
    const lowerQuery = query.toLowerCase();
    const queryWords = lowerQuery.split(/\s+/).filter(word => word.length > 0);
    let score = 0;
    
    // Helper function to check if text contains all query words
    const containsAllWords = (text: string | undefined) => {
      if (!text) return false;
      const lowerText = text.toLowerCase();
      return queryWords.every(word => lowerText.includes(word));
    };
    
    // Helper function to check exact phrase match
    const containsExactPhrase = (text: string | undefined) => {
      if (!text) return false;
      return text.toLowerCase().includes(lowerQuery);
    };
    
    // Scoring system (higher = more relevant)
    // Exact name match gets highest score
    if (artifact.name && containsExactPhrase(artifact.name)) score += 100;
    else if (artifact.name && containsAllWords(artifact.name)) score += 80;
    
    // Artist match
    if (artifact.artist && containsExactPhrase(artifact.artist)) score += 85;
    else if (artifact.artist && containsAllWords(artifact.artist)) score += 65;
    
    // Date match
    if (artifact.date && containsExactPhrase(artifact.date)) score += 50;
    else if (artifact.date && containsAllWords(artifact.date)) score += 30;
    
    // Description match
    if (artifact.description && containsExactPhrase(artifact.description)) score += 40;
    else if (artifact.description && containsAllWords(artifact.description)) score += 20;
    
    // Boost score for partial word matches at word boundaries
    queryWords.forEach(word => {
      if (word.length >= 3) {
        const wordBoundaryRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
        if (artifact.name && wordBoundaryRegex.test(artifact.name)) score += 10;
        if (artifact.artist && wordBoundaryRegex.test(artifact.artist)) score += 8;
      }
    });
    
    return score;
  };

  // Sort filtered results by relevance
  const sortedResults = [...filteredResults].sort((a, b) => {
    const scoreA = getSearchRelevance(a, searchQuery);
    const scoreB = getSearchRelevance(b, searchQuery);
    return scoreB - scoreA; // Higher scores first
  });

  return (
    <div className="mb-6 p-6 border border-gray-200 rounded-lg bg-gray-50">
      <div className="relative">
        <input
          type="text"
          className="w-full h-12 pl-12 pr-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 text-base shadow-sm"
          placeholder="Search by name, artist, description, or date..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
      </div>

      {/* Show random results indicator */}
      {isShowingRandomResults && (
        <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
          <Shuffle size={16} className="text-blue-500" />
          <span>Showing random artefacts to get you started</span>
        </div>
      )}

      {/* Search results count */}
      {searchQuery.trim() && sortedResults.length > 0 && (
        <div className="mt-3 text-sm text-gray-600">
          Found <span className="font-medium">{sortedResults.length}</span> matching artefact{sortedResults.length === 1 ? '' : 's'}
        </div>
      )}

      {sortedResults.length > 0 && (
        <div className="mt-4 max-h-80 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-sm divide-y divide-gray-100">
          {sortedResults.map((artifact) => {
            const metadata = getArtefactMetadata(artifact);
            
            return (
              <div
                key={artifact.id}
                className="p-4 hover:bg-blue-50 transition-colors cursor-pointer"
                onClick={() => onAddArtifact(artifact)}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-base mb-1">
                      {searchQuery.trim() ? 
                        highlightMatch(artifact.name, searchQuery) : 
                        artifact.name
                      }
                    </h3>
                    
                    {/* Description */}
                    {artifact.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {searchQuery.trim() ? 
                          highlightMatch(
                            artifact.description.substring(0, 150) + (artifact.description.length > 150 ? '...' : ''), 
                            searchQuery
                          ) : 
                          artifact.description.substring(0, 150) + (artifact.description.length > 150 ? '...' : '')
                        }
                      </p>
                    )}
                    
                    {/* Metadata */}
                    {metadata.length > 0 && (
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {metadata.slice(0, 3).map((item, index) => (
                          <span key={index} className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded-md border border-gray-200">
                            {searchQuery.trim() ? 
                              highlightMatch(item, searchQuery) : 
                              item
                            }
                          </span>
                        ))}
                        {metadata.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{metadata.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors flex-shrink-0 shadow-sm">
                    <Plus size={20} className="text-blue-600" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {searchQuery && sortedResults.length === 0 && searchResults.length > 0 && (
        <div className="mt-4 p-6 text-center border border-gray-200 rounded-lg bg-white shadow-sm">
          <p className="text-gray-600 mb-1">
            All matching artefacts have already been added to this quest.
          </p>
          <p className="text-sm text-gray-500">
            Try a different search term or add a new artefact.
          </p>
        </div>
      )}

      {searchQuery && searchResults.length === 0 && (
        <div className="mt-4 p-6 text-center border border-gray-200 rounded-lg bg-white shadow-sm">
          <p className="text-gray-600 mb-2">
            No artefacts found for <span className="font-medium">&quot;{searchQuery}&quot;</span>
          </p>
          <p className="text-sm text-gray-500">
            Try searching for artist names, dates, or keywords from the description.
          </p>
        </div>
      )}

      {!searchQuery && sortedResults.length === 0 && (
        <div className="mt-4 p-6 text-center border border-gray-200 rounded-lg bg-white shadow-sm">
          <div className="flex flex-col items-center gap-2">
            <Shuffle size={24} className="text-gray-400 mb-1" />
            <p className="text-gray-600 font-medium">
              All available artefacts have been added to this quest.
            </p>
            <p className="text-sm text-gray-500">
              Create new artefacts to add more to your quest.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};