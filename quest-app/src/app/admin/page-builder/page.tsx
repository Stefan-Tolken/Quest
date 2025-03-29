// app/admin/page-builder/page.tsx
"use client";
import { DndContext } from "@dnd-kit/core";
import { useState } from "react";
import ComponentList from "./componentList";
import DropZone from "./dropZone";
import { ComponentData } from "./types";

/**
 * Main page builder component
 */
const PageBuilder: React.FC = () => {
  const [components, setComponents] = useState<ComponentData[]>([]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    // Add new component to drop zone
    if (over?.id === "dropzone" && active.data.current?.isNew) {
      const newComponent = {
        id: crypto.randomUUID(),
        type: active.data.current?.type,
        content: "",
      };
      setComponents((prev) => [...prev, newComponent]);
    }
  };

  const handleDelete = (id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
  };

  const handleUpdate = (id: string, content: string) => {
    setComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, content } : c))
    );
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex h-screen bg-gray-50">
        {/* Components List */}
        <div className="w-64 p-4 bg-white border-r">
          <ComponentList />
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 p-4 overflow-auto">
          <DropZone
            components={components}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
          />
          
          {/* Debug Preview */}
          <div className="mt-8 p-4 bg-gray-100 rounded">
            <pre>{JSON.stringify(components, null, 2)}</pre>
          </div>
        </div>
      </div>
    </DndContext>
  );
};

export default PageBuilder;