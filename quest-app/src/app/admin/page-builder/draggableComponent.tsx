// app/admin/page-builder/draggableComponent.tsx
"use client";
import { useDraggable } from "@dnd-kit/core";
import { ComponentData } from "./types";

interface DraggableProps {
  component: ComponentData;
}

/**
 * Component for draggable items in the components list
 * Should only be used in the left panel list
 */
const DraggableComponent: React.FC<DraggableProps> = ({ component }) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: component.id,
    data: { 
      type: component.type, 
      isNew: true // Flag to identify new vs existing components
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="p-2 bg-gray-200 border rounded cursor-move mb-2"
    >
      {component.type}
    </div>
  );
};

export default DraggableComponent;