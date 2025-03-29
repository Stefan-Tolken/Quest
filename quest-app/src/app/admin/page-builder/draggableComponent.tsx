// app/admin/page-builder/draggableComponent.tsx
"use client";
import { useDraggable } from "@dnd-kit/core";
import { ComponentData } from "./types";

interface DraggableProps {
  component: ComponentData;
}

export const DraggableComponent = ({ component }: DraggableProps) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: component.id,
    data: { 
      type: component.type,
      isNew: true
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="p-2 bg-gray-100 border rounded cursor-move hover:bg-gray-200 transition-colors"
    >
      {component.type}
    </div>
  );
};