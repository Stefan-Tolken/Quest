"use client";

import { Search, Plus } from "lucide-react";

type ArtefactSearchProps = {
  searchQuery: string;
  searchResults: Array<any>;
  onSearchChange: (value: string) => void;
  onAddArtifact: (artifact: any) => void;
  addedArtefactIds?: string[];
};

export const ArtefactSearch = ({
  searchQuery,
  searchResults,
  onSearchChange,
  onAddArtifact,
  addedArtefactIds = [],
}: ArtefactSearchProps) => {
  const filteredResults = searchResults.filter(
    artifact => !addedArtefactIds.includes(artifact.id)
  );

  return (
    <div className="mb-6 p-6 border border-gray-200 rounded-lg bg-gray-50">
      <div className="relative">
        <input
          type="text"
          className="w-full h-12 pl-12 pr-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 text-base"
          placeholder="Search for artefacts..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
      </div>

      {filteredResults.length > 0 && (
        <div className="mt-4 max-h-60 overflow-y-auto border border-gray-200 rounded-lg bg-white">
          {filteredResults.map((artifact) => (
            <div
              key={artifact.id}
              className="p-4 border-b border-gray-200 last:border-b-0 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => onAddArtifact(artifact)}
            >
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 text-base">{artifact.name}</h3>
                {artifact.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{artifact.description}</p>
                )}
              </div>
              <div className="ml-4 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors">
                <Plus size={18} className="text-blue-600" />
              </div>
            </div>
          ))}
        </div>
      )}

      {searchQuery && filteredResults.length === 0 && searchResults.length > 0 && (
        <div className="mt-4 p-4 text-center border border-gray-200 rounded-lg bg-white">
          <p className="text-gray-600">
            All matching artefacts have already been added to this quest.
          </p>
        </div>
      )}

      {searchQuery && searchResults.length === 0 && (
        <div className="mt-4 p-4 text-center border border-gray-200 rounded-lg bg-white">
          <p className="text-gray-600">
            No artefacts found. Try a different search term.
          </p>
        </div>
      )}
    </div>
  );
}