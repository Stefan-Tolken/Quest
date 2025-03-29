// app/admin/page-builder/dropZone.tsx
"use client";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ComponentData } from "./types";
import SortableComponent from "./sortableComponent";

interface DropZoneProps {
  components: ComponentData[];
  onAdd: (component: Omit<ComponentData, "id">) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, content: string) => void;
}

/**
 * Main drop area with sorting capabilities
 */
const DropZone: React.FC<DropZoneProps> = ({
  components,
  onDelete,
  onUpdate,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: "dropzone" });

  return (
    <div
      ref={setNodeRef}
      className={`w-full min-h-[300px] p-4 border-2 border-dashed ${
        isOver ? "border-blue-500 bg-gray-100" : "border-gray-400"
      }`}
    >
      <h3 className="text-lg font-bold mb-2">Page Preview</h3>

      <SortableContext 
        items={components} 
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {components.map((component) => (
            <SortableComponent
              key={component.id}
              component={component}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      </SortableContext>

      {components.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          Drag components here to build your page
        </p>
      )}
    </div>
  );
};

export default DropZone;