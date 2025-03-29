// app/admin/page-builder/sortableComponent.tsx
"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSSProperties } from "react";
import { ComponentData } from "./types";
import PageComponent from "./pageComponent";

interface SortableProps {
  component: ComponentData;
  onDelete: (id: string) => void;
  onUpdate: (id: string, content: string) => void;
}

/**
 * Handles sorting logic for components in the drop zone
 */
const SortableComponent: React.FC<SortableProps> = ({ 
  component, 
  onDelete,
  onUpdate 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: component.id });

  const style: CSSProperties = {
    transform: transform 
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="relative group"
    >
      <PageComponent
        component={component}
        onDelete={onDelete}
        onUpdate={onUpdate}
        dragAttributes={attributes}
        dragListeners={listeners}
      />
    </div>
  );
};

export default SortableComponent;