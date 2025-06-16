// app/admin/page-builder/dropZone.tsx
"use client";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ComponentData, ImageContent, RestorationContent, Model3DContent } from "@/lib/types";
import { SortableComponent } from "./sortableComponent";
import { ArtifactDetails } from "@/lib/types";

interface DropZoneProps {
  components: ComponentData[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, content: string | ImageContent | RestorationContent | ArtifactDetails | Model3DContent) => void;
  onEditPoints: (component: ComponentData) => void;
  isDragging?: boolean;
}

// Individual insertion point component
const InsertionPoint = ({ 
  id, 
  isDragging, 
  label = "Drop here" 
}: { 
  id: string; 
  isDragging: boolean; 
  label?: string; 
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  if (!isDragging) return null;

  return (
    <div 
      ref={setNodeRef}
      className={`my-4 p-3 border-2 border-dashed rounded-lg transition-all duration-200 ${
        isOver 
          ? 'border-blue-400 bg-blue-100' 
          : 'border-gray-300 bg-transparent hover:border-blue-300 hover:bg-blue-50'
      }`}
    >
      <div className="flex items-center justify-center py-2">
        <div className={`flex-1 h-px transition-colors duration-200 ${
          isOver ? 'bg-blue-400' : 'bg-gray-300'
        }`}></div>
        <span className={`px-3 text-sm transition-colors duration-200 ${
          isOver 
            ? 'text-blue-700 font-medium bg-blue-100' 
            : 'text-gray-500 bg-white'
        }`}>
          {isOver ? `Drop component ${label.toLowerCase()}` : label}
        </span>
        <div className={`flex-1 h-px transition-colors duration-200 ${
          isOver ? 'bg-blue-400' : 'bg-gray-300'
        }`}></div>
      </div>
    </div>
  );
};

export const DropZone = ({ components, onDelete, onUpdate, onEditPoints, isDragging = false }: DropZoneProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: "dropzone",
  });

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      {/* Canvas Header */}
      <div className="bg-white border-b border-gray-200 p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-900">Page Canvas</h2>
        <p className="text-sm text-gray-600 mt-1">
          {components.length === 0 
            ? "Drop components here to start building your page" 
            : `${components.length} component${components.length !== 1 ? 's' : ''} added`
          }
        </p>
      </div>

      {/* Drop Zone Area */}
      <div 
        ref={setNodeRef}
        className={`min-h-full p-8 transition-all duration-200 ${
          isOver && components.length === 0
            ? 'bg-blue-50 border-2 border-dashed border-blue-300' 
            : 'bg-gray-50'
        }`}
      >
        {components.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center min-h-96 text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-200 ${
              isOver 
                ? 'bg-blue-100 border-2 border-dashed border-blue-300' 
                : 'bg-gray-100 border-2 border-dashed border-gray-300'
            }`}>
              <svg 
                className={`w-10 h-10 transition-colors duration-200 ${
                  isOver ? 'text-blue-500' : 'text-gray-400'
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
                />
              </svg>
            </div>
            <h3 className={`text-xl font-medium mb-2 transition-colors duration-200 ${
              isOver ? 'text-blue-900' : 'text-gray-900'
            }`}>
              {isOver ? 'Drop component here' : 'Start building your page'}
            </h3>
            <p className={`text-sm max-w-md transition-colors duration-200 ${
              isOver ? 'text-blue-700' : 'text-gray-600'
            }`}>
              {isOver 
                ? 'Release to add this component to your page' 
                : 'Drag components from the sidebar to begin creating your artifact page. You can reorder and edit them after adding.'
              }
            </p>
          </div>
        ) : (
          /* Components List with Insertion Points */
          <div className="max-w-4xl mx-auto">
            <SortableContext items={components} strategy={verticalListSortingStrategy}>
              {/* Top insertion point */}
              <InsertionPoint 
                id="insert-0" 
                isDragging={isDragging} 
                label="at top"
              />

              {components.map((component, index) => (
                <div key={component.id}>
                  <SortableComponent
                    component={component}
                    onDelete={onDelete}
                    onUpdate={onUpdate}
                    onEditPoints={onEditPoints}
                  />
                  
                  {/* Insertion point after each component */}
                  <InsertionPoint 
                    id={`insert-${index + 1}`} 
                    isDragging={isDragging}
                    label={`after ${component.type}`}
                  />
                </div>
              ))}
            </SortableContext>
          </div>
        )}
      </div>
    </div>
  );
};