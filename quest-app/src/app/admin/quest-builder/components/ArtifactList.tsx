"use client";

import {
  Trash,
  ChevronUp,
  ChevronDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

type ArtifactListProps = {
  artifacts: any[];
  questType: string;
  activeArtifactIndex: number | null;
  validationErrors: Record<string, string>;
  onRemoveArtifact: (index: number) => void;
  onMoveArtifact: (index: number, direction: "up" | "down") => void;
  onToggleDetails: (index: number) => void;
  children: React.ReactNode;
};

export const ArtifactList = ({
  artifacts,
  questType,
  activeArtifactIndex,
  validationErrors,
  onRemoveArtifact,
  onMoveArtifact,
  onToggleDetails,
  children,
}: ArtifactListProps) => (
  <div className="mb-8">
    {validationErrors.artifacts && (
      <p className="mb-4 text-sm text-red-500">{validationErrors.artifacts}</p>
    )}

    {artifacts.length > 0 ? (
      <div className="space-y-3">
        {artifacts.map((artifact, index) => (
          <div
            key={artifact.id}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <div className="flex justify-between items-center p-4 bg-gray-50">
              <div className="flex items-center gap-2">
                {questType === "sequential" && (
                  <span className="text-gray-500">#{index + 1}</span>
                )}
                <h3
                  className="font-medium cursor-pointer"
                  onClick={() => onToggleDetails(index)}
                >
                  {artifact.name}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {questType === "sequential" && (
                  <div className="flex items-center mr-2">
                    <button
                      className={`text-gray-500 hover:text-indigo-600 ${
                        index === 0 ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      onClick={() => onMoveArtifact(index, "up")}
                      disabled={index === 0}
                    >
                      <ArrowUp size={18} />
                    </button>
                    <button
                      className={`text-gray-500 hover:text-indigo-600 ${
                        index === artifacts.length - 1
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                      onClick={() => onMoveArtifact(index, "down")}
                      disabled={index === artifacts.length - 1}
                    >
                      <ArrowDown size={18} />
                    </button>
                  </div>
                )}
                <span className="text-sm text-gray-600">
                  {artifact.hints.length}{" "}
                  {artifact.hints.length === 1 ? "hint" : "hints"}
                </span>
                <button
                  onClick={() => onRemoveArtifact(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash size={18} />
                </button>
                <button
                  onClick={() => onToggleDetails(index)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {activeArtifactIndex === index ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </button>
              </div>
            </div>
            {activeArtifactIndex === index && children}
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500">
          No artifacts added yet. Click 'Add Artifact' to begin.
        </p>
      </div>
    )}
  </div>
);
