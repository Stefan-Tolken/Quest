// app/admin/page-builder/componentList.tsx
"use client";
import React from "react";
import { ComponentData } from "@/lib/types";
import { DraggableComponent } from "./draggableComponent";

const basicComponents: ComponentData[] = [
  { id: "1", type: "heading", content: "Heading" },
  { id: "2", type: "subheading", content: "SubHeading" },
  { id: "3", type: "paragraph", content: "Paragraph" },
  {
    id: "4",
    type: "details",
    content: {
      created: "",
      origin: "",
      currentLocation: "",
      dimensions: "",
      materials: ""
    },
  },
];

const advancedComponents: ComponentData[] = [
  {
    id: "5",
    type: "image",
    content: {
      url: "",
      points: [],
    },
  },
  {
    id: "6",
    type: "restoration",
    content: {
      restorations: [],
    },
  },
  {
    id: "7",
    type: "3DModel",
    content: {
      url: "",
    },
  },
];



export const ComponentList = () => {
  return (
    <div className="w-80 bg-white border-r border-gray-200 shadow-sm flex-shrink-0 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <h3 className="text-2xl font-semibold text-gray-900">Components</h3>
        <p className="text-sm text-gray-600 mt-1">Drag components to build your page</p>
      </div>

      {/* Component Lists - Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-500">
        <div className="p-6 space-y-8">
          {/* Basic Components */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Components</h4>
            <div className="space-y-3">
              {basicComponents.map((component) => (
                <DraggableComponent
                  key={component.id}
                  component={component}
                  displayName={capitalize(component.type)}
                />
              ))}
            </div>
          </div>

          {/* Advanced Components */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Advanced Components</h4>
            <div className="space-y-3">
              {advancedComponents.map((component) => (
                <DraggableComponent
                  key={component.id}
                  component={component}
                  displayName={component.type === "restoration" ? "Restoration" : capitalize(component.type)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}