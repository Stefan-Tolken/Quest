"use client";
import React from "react";
import { ComponentData } from "./types";
import DraggableComponent from "./draggableComponent";

const availableComponents: ComponentData[] = [
  { id: "1", type: "heading", content: "Heading" },
  { id: "2", type: "paragraph", content: "Paragraph" },
  { id: "3", type: "image", content: "Image" },
];

const ComponentList: React.FC = () => {
  return (
    <div style={{ padding: "10px", borderRight: "1px solid gray" }}>
      <h3>Available Components</h3>
      {availableComponents.map((component) => (
        <DraggableComponent key={component.id} component={component} />
      ))}
    </div>
  );
};

export default ComponentList;
