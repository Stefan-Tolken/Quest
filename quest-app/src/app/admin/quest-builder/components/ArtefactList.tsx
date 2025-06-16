"use client";

import {
  Trash,
  ChevronUp,
  ChevronDown,
  ArrowUp,
  ArrowDown,
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
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

type ArtefactListProps = {
  artifacts: any[];
  questType: string;
  activeArtifactIndex: number | null;
  validationErrors: Record<string, string>;
  onRemoveArtifact: (index: number) => void;
  onMoveArtifact: (index: number, direction: "up" | "down") => void;
  onToggleDetails: (index: number) => void;
  onReorderArtifacts: (newOrder: any[]) => void;
  children: ReactNode;
  artifactLookup?: Record<string, { name: string; description?: string }>;
};

type SortableArtifactProps = {
  artifact: any;
  index: number;
  questType: string;
  isActive: boolean;
  artifactsLength: number;
  onRemoveArtifact: (index: number) => void;
  onMoveArtifact: (index: number, direction: "up" | "down") => void;
  onToggleDetails: (index: number) => void;
  children?: ReactNode;
  artifactLookup?: Record<string, { name: string; description?: string }>;
};

const SortableArtifact = ({
  artifact,
  index,
  questType,
  isActive,
  artifactsLength,
  onRemoveArtifact,
  onMoveArtifact,
  onToggleDetails,
  children,
  artifactLookup,
}: SortableArtifactProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: artifact.artefactId || artifact.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  const artifactName = artifactLookup?.[artifact.artefactId]?.name || 
                      artifact.name || 
                      `Artifact ${index + 1}`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm ${
        isDragging ? "border-blue-400 shadow-lg" : ""
      }`}
    >
      <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {questType === "sequential" && (
            <>
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab hover:text-blue-600 transition-colors p-1 -m-1 rounded"
              >
                <GripVertical size={18} />
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-6 w-6 p-0 ${
                    index === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-blue-100"
                  }`}
                  onClick={() => onMoveArtifact(index, "up")}
                  disabled={index === 0}
                >
                  <ArrowUp size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-6 w-6 p-0 ${
                    index === artifactsLength - 1
                      ? "opacity-30 cursor-not-allowed"
                      : "hover:bg-blue-100"
                  }`}
                  onClick={() => onMoveArtifact(index, "down")}
                  disabled={index === artifactsLength - 1}
                >
                  <ArrowDown size={14} />
                </Button>
              </div>
              <span className="text-sm font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded">
                #{index + 1}
              </span>
            </>
          )}
          <h3
            className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors text-base"
            onClick={() => onToggleDetails(index)}
          >
            {artifactName}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
            {artifact.hints?.length || 0}{" "}
            {(artifact.hints?.length || 0) === 1 ? "hint" : "hints"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemoveArtifact(index)}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleDetails(index)}
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            {isActive ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </Button>
        </div>
      </div>
      {isActive && children}
    </div>
  );
};

export const ArtefactList = ({
  artifacts,
  questType,
  activeArtifactIndex,
  validationErrors,
  onRemoveArtifact,
  onMoveArtifact,
  onToggleDetails,
  onReorderArtifacts,
  children,
  artifactLookup,
}: ArtefactListProps) => {
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
      const oldIndex = artifacts.findIndex(
        (artifact) => (artifact.artefactId || artifact.id) === active.id
      );
      const newIndex = artifacts.findIndex(
        (artifact) => (artifact.artefactId || artifact.id) === over.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        const newArtifactsOrder = arrayMove(artifacts, oldIndex, newIndex);
        onReorderArtifacts(newArtifactsOrder);
      }
    }
  };

  return (
    <div className="space-y-4">
      {validationErrors.artifacts && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">
            {validationErrors.artifacts}
          </p>
        </div>
      )}

      {artifacts.length > 0 ? (
        <div className="space-y-3">
          {questType === "sequential" ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={artifacts.map((artifact) => artifact.artefactId || artifact.id)}
                strategy={verticalListSortingStrategy}
              >
                {artifacts.map((artifact, index) => (
                  <SortableArtifact
                    key={artifact.artefactId || artifact.id}
                    artifact={artifact}
                    index={index}
                    questType={questType}
                    isActive={activeArtifactIndex === index}
                    artifactsLength={artifacts.length}
                    onRemoveArtifact={onRemoveArtifact}
                    onMoveArtifact={onMoveArtifact}
                    onToggleDetails={onToggleDetails}
                    artifactLookup={artifactLookup}
                  >
                    {activeArtifactIndex === index ? children : null}
                  </SortableArtifact>
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            artifacts.map((artifact, index) => {
              const artifactName = artifactLookup?.[artifact.artefactId]?.name || artifact.name || `Artifact ${index + 1}`;
              
              return (
                <div
                  key={artifact.artefactId || artifact.id}
                  className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm"
                >
                  <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <h3
                        className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors text-base"
                        onClick={() => onToggleDetails(index)}
                      >
                        {artifactName}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                        {artifact.hints?.length || 0}{" "}
                        {(artifact.hints?.length || 0) === 1 ? "hint" : "hints"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveArtifact(index)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleDetails(index)}
                        className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                      >
                        {activeArtifactIndex === index ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </Button>
                    </div>
                  </div>
                  {activeArtifactIndex === index && children}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">
              No artefacts added yet
            </p>
            <p className="text-sm text-gray-500">
              Click &#39;Add Artefact&#39; to begin building your quest.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};