"use client";

import { Search, Plus, Shuffle, Info, X, ChevronUp, ChevronDown, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Artefact, QuestArtefact } from "@/lib/types";
import { useState } from "react";

type UnifiedArtefactSectionProps = {
  // Search props
  searchQuery: string;
  searchResults: Artefact[];
  onSearchChange: (value: string) => void;
  onAddArtifact: (artifact: Artefact) => void;
  
  // Quest artifacts props
  questArtefacts: QuestArtefact[];
  questType: "sequential" | "concurrent";
  activeArtefactIndex: number | null;
  validationErrors: Record<string, string>;
  onRemoveArtifact: (index: number) => void;
  onMoveArtifact: (index: number, direction: "up" | "down") => void;
  onToggleDetails: (index: number) => void;
  onReorderArtifacts: (newOrder: QuestArtefact[]) => void;
  onSetQuestType: (questType: "sequential" | "concurrent") => void;
  
  // Children for hints section
  children?: React.ReactNode;
};

export const UnifiedArtefactSection = ({
  searchQuery,
  searchResults,
  onSearchChange,
  onAddArtifact,
  questArtefacts,
  questType,
  activeArtefactIndex,
  validationErrors,
  onRemoveArtifact,
  onMoveArtifact,
  onToggleDetails,
  onReorderArtifacts,
  onSetQuestType,
  children,
}: UnifiedArtefactSectionProps) => {
  const [showSearch, setShowSearch] = useState(false);
  
  // Filter out already added artefacts
  const addedArtefactIds = questArtefacts.map(a => a.artefactId);
  const filteredResults = searchResults.filter(
    artifact => !addedArtefactIds.includes(artifact.id)
  );

  const isShowingRandomResults = searchQuery.trim() === "" && filteredResults.length > 0;

  // Fixed highlight function
  const highlightMatch = (text: string | undefined, query: string) => {
    if (!query.trim() || !text) return text || "";
    
    const queryWords = query.trim().split(/\s+/).filter(word => word.length > 0);
    let highlightedText = text;
    const sortedWords = [...queryWords].sort((a, b) => b.length - a.length);
    
    sortedWords.forEach(word => {
      if (word.length < 2) return;
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b(${escapedWord}\\w*)\\b|\\b(\\w*${escapedWord}\\w*)\\b`, 'gi');
      highlightedText = highlightedText.replace(regex, (match) => 
        `<span class="text-blue-700 font-medium underline decoration-blue-400 decoration-2 underline-offset-2">${match}</span>`
      );
    });
    
    return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };

  const getArtefactMetadata = (artifact: Artefact) => {
    const metadata: string[] = [];
    if (artifact.artist) metadata.push(`Artist: ${artifact.artist}`);
    if (artifact.date) metadata.push(`Date: ${artifact.date}`);
    if (artifact.createdAt) metadata.push(`Added: ${new Date(artifact.createdAt).toLocaleDateString()}`);
    if (artifact.partOfQuest && artifact.partOfQuest.length > 0) metadata.push(`Used in ${artifact.partOfQuest.length} quest${artifact.partOfQuest.length === 1 ? '' : 's'}`);
    return metadata;
  };

  const handleAddArtifact = (artifact: Artefact) => {
    onAddArtifact(artifact);
    // Clear search when adding to reduce visual noise
    onSearchChange("");
    setShowSearch(false);
  };

  return (
    <div className="space-y-6">
      {/* Header with title and search toggle */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">
          Artefacts to Collect <span className="text-red-500">*</span>
        </h2>
        <Button
          onClick={() => setShowSearch(!showSearch)}
          variant={showSearch ? "outline" : "default"}
          className="flex items-center gap-2 hover:cursor-pointer"
        >
          <Plus size={18} />
          {showSearch ? "Hide Search" : "Add Artefact"}
        </Button>
      </div>

      {/* Fixed height container to prevent layout shifts */}
      <div className="min-h-[400px] space-y-4">
        
        {/* Search Section - Fixed height when visible */}
        {showSearch && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 min-h-[300px]">
            <div className="relative mb-4">
              <input
                type="text"
                className="w-full h-12 pl-12 pr-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 text-base shadow-sm"
                placeholder="Search by name, artist, description, or date..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
            </div>

            {/* Search indicators and results */}
            <div className="space-y-3">
              {isShowingRandomResults && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Shuffle size={16} className="text-blue-500" />
                  <span>Showing random artefacts to get you started</span>
                </div>
              )}

              {searchQuery.trim() && filteredResults.length > 0 && (
                <div className="text-sm text-gray-600">
                  Found <span className="font-medium">{filteredResults.length}</span> matching artefact{filteredResults.length === 1 ? '' : 's'}
                </div>
              )}

              {/* Search Results */}
              {filteredResults.length > 0 && (
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-sm divide-y divide-gray-100">
                  {filteredResults.map((artifact) => {
                    const metadata = getArtefactMetadata(artifact);
                    
                    return (
                      <div
                        key={artifact.id}
                        className="p-4 hover:bg-blue-50 transition-colors cursor-pointer"
                        onClick={() => handleAddArtifact(artifact)}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 text-base mb-1">
                              {searchQuery.trim() ? 
                                highlightMatch(artifact.name, searchQuery) : 
                                artifact.name
                              }
                            </h3>
                            
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

              {/* No results messages */}
              {searchQuery && filteredResults.length === 0 && searchResults.length > 0 && (
                <div className="p-6 text-center border border-gray-200 rounded-lg bg-white shadow-sm">
                  <p className="text-gray-600 mb-1">
                    All matching artefacts have already been added to this quest.
                  </p>
                  <p className="text-sm text-gray-500">
                    Try a different search term or add a new artefact.
                  </p>
                </div>
              )}

              {searchQuery && searchResults.length === 0 && (
                <div className="p-6 text-center border border-gray-200 rounded-lg bg-white shadow-sm">
                  <p className="text-gray-600 mb-2">
                    No artefacts found for <span className="font-medium">&quot;{searchQuery}&quot;</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Try searching for artist names, dates, or keywords from the description.
                  </p>
                </div>
              )}

              {!searchQuery && filteredResults.length === 0 && (
                <div className="p-6 text-center border border-gray-200 rounded-lg bg-white shadow-sm">
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
          </div>
        )}

        {/* Quest Type Selection */}
        {questArtefacts.length > 0 && (
          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <label className="block text-lg font-medium text-gray-700 mb-3">
              Quest Type
            </label>
            <div className="flex gap-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  checked={questType === "sequential"}
                  onChange={() => onSetQuestType("sequential")}
                />
                <span className="ml-3 text-base">Sequential (Story-based order)</span>
              </label>
              <label
                className={`flex items-center cursor-pointer ${
                  questArtefacts.length < 3 ? "opacity-50" : ""
                }`}
              >
                <input
                  type="radio"
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  checked={questType === "concurrent"}
                  onChange={() => onSetQuestType("concurrent")}
                  disabled={questArtefacts.length < 3}
                />
                <span className="ml-3 text-base">Concurrent (Any order)</span>
                {questArtefacts.length < 3 && (
                  <span className="ml-2 text-sm text-gray-500">
                    (Requires 3+ artefacts)
                  </span>
                )}
              </label>
            </div>
            {validationErrors.questType && (
              <p className="mt-2 text-sm text-red-600">
                {validationErrors.questType}
              </p>
            )}
          </div>
        )}

        {/* Quest Artefacts List */}
        <div className="space-y-3">
          {questArtefacts.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
              <div className="flex flex-col items-center gap-2">
                <Plus size={32} className="text-gray-400" />
                <p className="text-gray-600 font-medium">No artefacts added yet</p>
                <p className="text-sm text-gray-500">
                  Click &quot;Add Artefact&quot; above to start building your quest
                </p>
              </div>
            </div>
          ) : (
            <>
              {questArtefacts.map((artifact, index) => (
                <div key={`${artifact.artefactId}-${index}`} className="space-y-3">
                  <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {questType === "sequential" && (
                          <div className="flex items-center gap-1">
                            <GripVertical size={16} className="text-gray-400" />
                            <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {index + 1}
                            </span>
                          </div>
                        )}
                        
                        <h3 className="text-lg font-medium text-gray-900 flex-1">
                          {artifact.name}
                        </h3>
                        
                        <div className="flex items-center gap-2">
                          {questType === "sequential" && questArtefacts.length > 1 && (
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onMoveArtifact(index, "up")}
                                disabled={index === 0}
                                className="p-1 h-8 w-8"
                              >
                                <ChevronUp size={16} />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onMoveArtifact(index, "down")}
                                disabled={index === questArtefacts.length - 1}
                                className="p-1 h-8 w-8"
                              >
                                <ChevronDown size={16} />
                              </Button>
                            </div>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onToggleDetails(index)}
                            className="text-sm"
                          >
                            {activeArtefactIndex === index ? "Hide" : "Show"} Hints
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRemoveArtifact(index)}
                            className="p-1 h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Hints section */}
                  {activeArtefactIndex === index && children}
                </div>
              ))}
            </>
          )}
          
          {validationErrors.artefacts && (
            <p className="text-sm text-red-600 mt-2">
              {validationErrors.artefacts}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};