// app/admin/page-builder/draggableComponent.tsx
"use client";
import { useDraggable } from "@dnd-kit/core";
import { ComponentData } from "@/lib/types";
import { Plus, Type, Image, FileText, Info, Wrench, Box } from "lucide-react";

interface DraggableComponentProps {
  component: ComponentData;
  displayName: string;
}

const getComponentIcon = (type: string) => {
  switch (type) {
    case "heading":
    case "subheading":
      return <Type size={16} className="text-blue-600" />;
    case "paragraph":
      return <FileText size={16} className="text-green-600" />;
    case "image":
      return <Image size={16} className="text-purple-600" />;
    case "details":
      return <Info size={16} className="text-orange-600" />;
    case "restoration":
      return <Wrench size={16} className="text-red-600" />;
    case "3DModel":
      return <Box size={16} className="text-indigo-600" />;
    default:
      return <Plus size={16} className="text-gray-600" />;
  }
};

const getComponentDescription = (type: string) => {
  switch (type) {
    case "heading":
      return "Used for large text for section headings and titles";
    case "subheading":
      return "Used for secondary heading for sub-sections";
    case "paragraph":
      return "Used for body text content for any descriptions needed";
    case "image":
      return "Used for images and with optional points of interest";
    case "details":
      return "Used for all of the artefacts main information";
    case "restoration":
      return "Used for describing the restoration timeline";
    case "3DModel":
      return "Used for interactive 3D models of certain artefacts";
    default:
      return "Component";
  }
};

export const DraggableComponent = ({ component, displayName }: DraggableComponentProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: component.id,
    data: { 
      isNew: true, 
      type: component.type 
    },
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`group relative bg-white border border-gray-200 rounded-lg p-4 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-gray-300 transition-all duration-200 ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      {/* Component Icon and Info */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center group-hover:bg-gray-100 transition-colors">
          {getComponentIcon(component.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <h5 className="font-medium text-gray-900 text-sm">{displayName}</h5>
          <p className="text-xs text-gray-600 mt-1">{getComponentDescription(component.type)}</p>
        </div>

        {/* Drag indicator */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </div>
      </div>

      {/* Hover State Enhancement */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-all duration-200 -z-10" />
    </div>
  );
};