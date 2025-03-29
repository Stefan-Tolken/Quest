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

export const PageComponent = ({
  component,
  onDelete,
  onUpdate,
  dragAttributes,
  dragListeners,
}: PageComponentProps) => {
  const [localContent, setLocalContent] = useState(component.content || "");

  const handleUpdate = () => onUpdate(component.id, localContent);

  return (
    <div className="group relative bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="text-red-500 hover:text-red-700"
          onClick={() => onDelete(component.id)}
        >
          Delete
        </button>
        <div
          className="cursor-grab text-gray-400 hover:text-gray-600"
          {...dragAttributes}
          {...dragListeners}
        >
          ⠿
        </div>
      </div>

      {component.type === "heading" && (
        <input
          value={localContent}
          onChange={(e) => setLocalContent(e.target.value)}
          onBlur={handleUpdate}
          className="text-2xl font-bold w-full border-b focus:outline-none"
          placeholder="Enter heading..."
        />
      )}

      {component.type === "paragraph" && (
        <textarea
          value={localContent}
          onChange={(e) => setLocalContent(e.target.value)}
          onBlur={handleUpdate}
          className="w-full h-32 p-2 border rounded focus:outline-none"
          placeholder="Enter paragraph..."
        />
      )}

      {component.type === "image" && (
        <div className="border-dashed border-2 p-4 rounded">
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
            className="w-full"
          />
        </div>
      )}
    </div>
  );
};