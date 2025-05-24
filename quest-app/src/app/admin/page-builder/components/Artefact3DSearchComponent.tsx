"use client";

import { Search, Plus } from "lucide-react";

type Artefact3DSearchProps = {
  searchQuery: string;
  searchResults: Array<any>;
  onSearchChange: (value: string) => void;
  onSelectedArtifact: (artifact: any) => void;
};

export const Artefact3DSearch = ({
  searchQuery,
  searchResults,
  onSearchChange,
  onSelectedArtifact,
}: Artefact3DSearchProps) => (
  <div className="mb-6 p-4 border border-gray-200 rounded-lg">
    <div className="relative">
      <input
        type="text"
        className="w-full p-3 pl-10 border border-gray-300 rounded-lg"
        placeholder="Search for artifacts..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
    </div>

    {searchResults.length > 0 && (
      <div className="mt-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
        {searchResults.map((artifact) => (
          <div
            key={artifact.id}
            className="p-3 border-b border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-50"
            onClick={() => onSelectedArtifact(artifact)}
          >
            <div>
              <h3 className="font-medium">{artifact.name}</h3>
            </div>
            <Plus size={18} className="text-indigo-600" />
          </div>
        ))}
      </div>
    )}

    {searchQuery && searchResults.length === 0 && (
      <p className="mt-2 text-gray-600">
        No artifacts found. Try a different search term.
      </p>
    )}
  </div>
);
