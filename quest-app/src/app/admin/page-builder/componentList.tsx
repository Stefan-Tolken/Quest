// app/admin/page-builder/componentList.tsx
"use client";
import React from "react";
import { ComponentData } from "./types";
import { DraggableComponent } from "./draggableComponent";

const availableComponents: ComponentData[] = [
  { id: "1", type: "heading", content: "Heading" },
  { id: "2", type: "paragraph", content: "Paragraph" },
  {
    id: "3",
    type: "image",
    content: {
      url: "",
      points: [],
      texts: [],
    },
  },
];

export const ComponentList = () => {
  return (
    <div className="p-4 border-r">
      <h3 className="text-lg font-bold mb-4">Available Components</h3>
      <div className="space-y-2">
        {availableComponents.map((component) => (
          <DraggableComponent key={component.id} component={component} />
        ))}
      </div>
    </div>
  );
};
