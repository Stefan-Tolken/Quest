"use client";

import { Plus, Trash, ArrowUp, ArrowDown, List, Shuffle } from "lucide-react";

type HintsSectionProps = {
  hints: any[];
  hintDisplayMode: string;
  currentHint: any;
  onToggleDisplayMode: () => void;
  onAddHint: () => void;
  onRemoveHint: (hintIndex: number) => void;
  onMoveHint: (hintIndex: number, direction: "up" | "down") => void;
  onCurrentHintChange: (value: string) => void;
};

export const HintsSection = ({
  hints,
  hintDisplayMode,
  currentHint,
  onToggleDisplayMode,
  onAddHint,
  onRemoveHint,
  onMoveHint,
  onCurrentHintChange,
}: HintsSectionProps) => (
  <div className="p-4 border-t border-gray-200">
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-medium">Hints (max 5)</h4>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Display Mode:</span>
          <button
            className={`flex items-center gap-1 px-3 py-1 rounded text-sm ${
              hintDisplayMode === "sequential"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={onToggleDisplayMode}
          >
            <List size={14} />
            Sequential
          </button>
          <button
            className={`flex items-center gap-1 px-3 py-1 rounded text-sm ${
              hintDisplayMode === "random"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={onToggleDisplayMode}
          >
            <Shuffle size={14} />
            Random
          </button>
        </div>
      </div>

      {hintDisplayMode === "sequential" && (
        <p className="text-xs text-gray-500 mb-3">
          Hints will be displayed in the order shown below.
        </p>
      )}

      {hintDisplayMode === "random" && (
        <p className="text-xs text-gray-500 mb-3">
          Hints will be displayed in random order.
        </p>
      )}
    </div>

    {hints.length > 0 ? (
      <div className="mb-4 space-y-2">
        {hints.map((hint, hintIndex) => (
          <div
            key={hintIndex}
            className="flex items-center p-2 bg-gray-50 rounded"
          >
            {hintDisplayMode === "sequential" && (
              <div className="flex flex-col items-center mr-2">
                <button
                  className={`text-gray-500 hover:text-indigo-600 ${
                    hintIndex === 0 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onClick={() => onMoveHint(hintIndex, "up")}
                  disabled={hintIndex === 0}
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  className={`text-gray-500 hover:text-indigo-600 ${
                    hintIndex === hints.length - 1
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  onClick={() => onMoveHint(hintIndex, "down")}
                  disabled={hintIndex === hints.length - 1}
                >
                  <ArrowDown size={14} />
                </button>
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-center mb-1">
                <span className="text-xs font-medium text-gray-500 mr-2">
                  {hintDisplayMode === "sequential"
                    ? `Hint #${hintIndex + 1}:`
                    : "Hint:"}
                </span>
                <p className="text-sm">{hint.description}</p>
              </div>
            </div>

            <button
              onClick={() => onRemoveHint(hintIndex)}
              className="text-red-500 hover:text-red-700 ml-2"
            >
              <Trash size={16} />
            </button>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-sm text-gray-500 mb-4">No hints added yet.</p>
    )}

    {hints.length < 5 && (
      <div className="space-y-3">
        <input
          type="text"
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="Add a hint to help find this artifact..."
          value={currentHint.description}
          onChange={(e) => onCurrentHintChange(e.target.value)}
        />
        <button
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-2"
          onClick={onAddHint}
        >
          <Plus size={16} />
          Add Hint
        </button>
      </div>
    )}
  </div>
);
