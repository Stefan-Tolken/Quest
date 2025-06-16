// app/admin/page-builder/pageComponent.tsx
"use client";

import { ImageContent, RestorationContent } from "@/lib/types";
import { ComponentData } from "@/lib/types";
import {
  HeadingComponent,
  ParagraphComponent,
  ImageComponent,
  RestorationComponent,
  Model3DSelector
} from "./components";
import { SubHeadingComponent } from "./components/subheadingComponent";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { GripVertical, X } from "lucide-react";
import { DetailsComponent } from "./components/detailsComponent";
import { ArtifactDetails } from "@/lib/types";
import { Model3DContent } from "@/lib/types";

interface PageComponentProps {
  component: ComponentData;
  onDelete: (id: string) => void;
  onUpdate: (id: string, content: string | ImageContent | RestorationContent | ArtifactDetails) => void;
  dragAttributes?: React.HTMLAttributes<HTMLDivElement>;
  dragListeners?: SyntheticListenerMap;
  onEditPoints: (component: ComponentData) => void;
}

export const PageComponent = ({
  component,
  onDelete,
  onUpdate,
  dragAttributes,
  dragListeners,
  onEditPoints,
}: PageComponentProps) => {
  console.log('PageComponent rendered with:', component);
  
  const handleUpdate = (content: string | ImageContent | RestorationContent | ArtifactDetails) => {
    console.log('handleUpdate called with:', content);
    onUpdate(component.id, content);
  };

  return (
    <div className="group relative mb-6">
      {/* Delete Button - Positioned outside top-right */}
      <button
        className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 z-20 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105"
        onClick={() => onDelete(component.id)}
        aria-label="Delete component"
        title="Delete component"
      >
        <X size={16} />
      </button>

      {/* Main Component Container */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 overflow-hidden">
        
        {/* Drag Handle - Top left corner */}
        <div
          className="absolute top-4 left-4 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 p-1 rounded hover:bg-gray-100"
          {...dragAttributes}
          {...dragListeners}
          aria-label="Drag to reorder"
          title="Drag to reorder"
        >
          <GripVertical size={18} className="text-gray-400 hover:text-gray-600" />
        </div>

        {/* Component Content - Matching page.tsx padding and spacing */}
        <div className="p-6 pl-12 pr-16">
          {component.type === "heading" && (
            <HeadingComponent
              content={component.content as string}
              onUpdate={handleUpdate}
            />
          )}

          {component.type === "subheading" && (
            <SubHeadingComponent
              content={component.content as string}
              onUpdate={handleUpdate}
            />
          )}

          {component.type === "paragraph" && (
            <ParagraphComponent
              content={component.content as string}
              onUpdate={handleUpdate}
            />
          )}

          {component.type === "image" && (
            <ImageComponent
              content={
                (component.content as ImageContent) || {
                  url: "",
                  points: [],
                  texts: [],
                }
              }
              onUpdate={handleUpdate}
              onEditPoints={() => onEditPoints(component)}
            />
          )}

          {component.type === "details" && (
            <DetailsComponent
              content={
                (component.content as ArtifactDetails) || {
                  created: "",
                  origin: "",
                  dimensions: "",
                  materials: ""
                }
              }
              onUpdate={handleUpdate}
            />
          )}

          {component.type === "restoration" && (
            <RestorationComponent
              content={
                (component.content as RestorationContent) || {
                  restorations: []
                }
              }
              onUpdate={handleUpdate}
            />
          )}

          {component.type === "3DModel" && (
            <Model3DSelector
              selectedModelId={typeof component.content === 'object' && component.content !== null && 'modelId' in component.content ? (component.content as any).modelId || "" : ""}
              onSelectModel={modelId => handleUpdate({ modelId })}
            />
          )}
        </div>
      </div>
    </div>
  );
};

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}