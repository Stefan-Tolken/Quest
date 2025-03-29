"use client";
import React, { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { ComponentData } from "./types";
import DraggableComponent from "./draggableComponent";

const DropZone: React.FC = () => {
  const [components, setComponents] = useState<ComponentData[]>([]);
  const { isOver, setNodeRef } = useDroppable({ id: "dropzone" });

  return (
    <div
      ref={setNodeRef}
      style={{
        width: "100%",
        minHeight: "300px",
        border: "2px dashed gray",
        backgroundColor: isOver ? "#f0f0f0" : "white",
        padding: "10px",
      }}
    >
      <h3>Drop Components Here</h3>
      {components.length === 0 && <p>Drag items here</p>}
      {components.map((component) => (
        <DraggableComponent key={component.id} component={component} />
      ))}
    </div>
  );
};

export default DropZone;
