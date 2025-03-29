"use client";
import { useDraggable } from "@dnd-kit/core";
import React from "react";
import { ComponentData } from "./types";

interface DraggableProps {
  component: ComponentData;
}

const DraggableComponent: React.FC<DraggableProps> = ({ component }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: component.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        transform: transform
          ? `translate(${transform.x}px, ${transform.y}px)`
          : undefined,
        padding: "10px",
        margin: "5px",
        backgroundColor: "#e0e0e0",
        cursor: "grab",
        borderRadius: "5px",
      }}
    >
      {component.type}
    </div>
  );
};

export default DraggableComponent;
