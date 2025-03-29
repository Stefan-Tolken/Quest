// app/admin/page-builder/pageComponent.tsx
"use client";
import { ComponentData } from "./types";
import { useState } from "react";

interface PageComponentProps {
  component: ComponentData;
  onDelete: (id: string) => void;
  onUpdate: (id: string, content: string) => void;
  dragAttributes?: any;
  dragListeners?: any;
}

/**
 * Renders the actual component content with edit controls
 */
const PageComponent: React.FC<PageComponentProps> = ({
  component,
  onDelete,
  onUpdate,
  dragAttributes,
  dragListeners,
}) => {
  const [localContent, setLocalContent] = useState(component.content || "");

  const handleUpdate = () => {
    onUpdate(component.id, localContent);
  };

  return (
    <div className="p-4 bg-white border rounded mb-2 hover:shadow-lg transition-shadow">
      {/* Drag handle */}
      <div 
        className="absolute top-1 right-1 cursor-move text-gray-400 hover:text-gray-600"
        {...dragAttributes}
        {...dragListeners}
      >
        ⠿
      </div>

      {/* Delete button */}
      <button
        className="absolute top-1 left-1 text-red-400 hover:text-red-600"
        onClick={() => onDelete(component.id)}
      >
        ×
      </button>

      {/* Content display/edit */}
      {component.type === "heading" && (
        <input
          type="text"
          value={localContent}
          onChange={(e) => setLocalContent(e.target.value)}
          onBlur={handleUpdate}
          className="text-xl font-bold w-full border-b focus:outline-none"
          placeholder="Enter heading..."
        />
      )}

      {component.type === "paragraph" && (
        <textarea
          value={localContent}
          onChange={(e) => setLocalContent(e.target.value)}
          onBlur={handleUpdate}
          className="w-full h-24 p-2 border rounded focus:outline-none"
          placeholder="Enter paragraph..."
        />
      )}

      {component.type === "image" && (
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  onUpdate(component.id, event.target?.result as string);
                };
                reader.readAsDataURL(file);
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default PageComponent;