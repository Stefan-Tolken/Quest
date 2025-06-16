"use client";

import {
  Plus,
  Trash,
  ArrowUp,
  ArrowDown,
  List,
  GripVertical,
} from "lucide-react";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Hint = {
  description: string;
  displayAfterAttempts: number;
};

type HintsSectionProps = {
  hints: Hint[];
  hintDisplayMode: string;
  currentHint: Hint;
  onAddHint: () => void;
  onRemoveHint: (hintIndex: number) => void;
  onMoveHint: (hintIndex: number, direction: "up" | "down") => void;
  onCurrentHintChange: (value: string) => void;
  onReorderHints: (newOrder: Hint[]) => void;
};

type SortableHintProps = {
  hint: Hint;
  index: number;
  hintDisplayMode: string;
  onRemoveHint: (index: number) => void;
  onMoveHint: (index: number, direction: "up" | "down") => void;
  hints: Hint[];
};

const SortableHint = ({
  hint,
  index,
  hintDisplayMode,
  onRemoveHint,
  onMoveHint,
  hints,
}: SortableHintProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `hint-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center p-4 bg-white border border-gray-200 rounded-lg ${
        isDragging ? "border-blue-400 shadow-lg" : ""
      }`}
    >
      {hintDisplayMode === "sequential" && (
        <div className="flex items-center gap-2 mr-4">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab hover:text-blue-600 transition-colors p-1 -m-1 rounded"
          >
            <GripVertical size={16} />
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={`h-6 w-6 p-0 ${
                index === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-blue-100"
              }`}
              onClick={() => onMoveHint(index, "up")}
              disabled={index === 0}
            >
              <ArrowUp size={12} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-6 w-6 p-0 ${
                index === hints.length - 1
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:bg-blue-100"
              }`}
              onClick={() => onMoveHint(index, "down")}
              disabled={index === hints.length - 1}
            >
              <ArrowDown size={12} />
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1">
        <div className="flex items-start gap-2">
          <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full whitespace-nowrap">
            {hintDisplayMode === "sequential" ? `Hint #${index + 1}` : "Hint"}
          </span>
          <p className="text-sm text-gray-700 leading-relaxed">{hint.description}</p>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemoveHint(index)}
        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 ml-3"
      >
        <Trash size={14} />
      </Button>
    </div>
  );
};

export const HintsSection = ({
  hints,
  hintDisplayMode,
  currentHint,
  onAddHint,
  onRemoveHint,
  onMoveHint,
  onCurrentHintChange,
  onReorderHints,
}: HintsSectionProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = parseInt(active.id.toString().split("-")[1]);
      const newIndex = parseInt(over.id.toString().split("-")[1]);

      const newHintsOrder = arrayMove(hints, oldIndex, newIndex);
      onReorderHints(newHintsOrder);
    }
  };

  return (
    <div className="p-6 border-t border-gray-200 bg-gray-50">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-lg font-medium text-gray-900">Hints Configuration</h4>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Display Mode:</span>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm bg-blue-600 text-white font-medium">
              <List size={14} />
              <span>Sequential</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          {hintDisplayMode === "sequential" && (
            <p className="text-sm text-blue-700">
              💡 Hints will be displayed in the order shown below. You can drag hints to reorder them or use the arrow buttons.
            </p>
          )}

          {hintDisplayMode === "random" && (
            <p className="text-sm text-blue-700">
              🎲 Hints will be displayed in random order when users request them.
            </p>
          )}
        </div>
      </div>

      {hints.length > 0 ? (
        <div className="mb-6 space-y-3">
          {hintDisplayMode === "sequential" ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={hints.map((_, index) => `hint-${index}`)}
                strategy={verticalListSortingStrategy}
              >
                {hints.map((hint, hintIndex) => (
                  <SortableHint
                    key={`hint-${hintIndex}`}
                    hint={hint}
                    index={hintIndex}
                    hintDisplayMode={hintDisplayMode}
                    onRemoveHint={onRemoveHint}
                    onMoveHint={onMoveHint}
                    hints={hints}
                  />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            hints.map((hint, hintIndex) => (
              <div
                key={hintIndex}
                className="flex items-center p-4 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full whitespace-nowrap">
                      Hint
                    </span>
                    <p className="text-sm text-gray-700 leading-relaxed">{hint.description}</p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveHint(hintIndex)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 ml-3"
                >
                  <Trash size={14} />
                </Button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="mb-6 text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-white">
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <List size={20} className="text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">No hints added yet</p>
            <p className="text-sm text-gray-500">Add helpful hints to guide users to this artefact.</p>
          </div>
        </div>
      )}

      {hints.length < 5 && (
        <div className="space-y-4 bg-white p-4 border border-gray-200 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add New Hint {hints.length > 0 && `(${hints.length}/5)`}
            </label>
            <Input
              type="text"
              className="w-full h-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 text-base p-4"
              placeholder="Add a hint to help find this artefact..."
              value={currentHint.description}
              onChange={(e) => onCurrentHintChange(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && currentHint.description.trim()) {
                  onAddHint();
                }
              }}
            />
          </div>
          <Button
            onClick={onAddHint}
            disabled={!currentHint.description.trim()}
            className="w-full h-12 flex items-center justify-center gap-2 hover:cursor-pointer disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            Add Hint
          </Button>
        </div>
      )}

      {hints.length >= 5 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-700">
            ⚠️ Maximum of 5 hints reached. Remove a hint to add a new one.
          </p>
        </div>
      )}
    </div>
  );
};