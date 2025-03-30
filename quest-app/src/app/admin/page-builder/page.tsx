// app/admin/page-builder/page.tsx
"use client";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { useState } from "react";
import { ComponentList } from "./componentList";
import { DropZone } from "./dropZone";
import { ComponentData } from "./types";
import { arrayMove } from "@dnd-kit/sortable";

const PageBuilder = () => {
  const [components, setComponents] = useState<ComponentData[]>([]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Handle reordering
    if (over?.id && active.id !== over.id) {
      const oldIndex = components.findIndex((c) => c.id === active.id);
      const newIndex = components.findIndex((c) => c.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        setComponents((items) => arrayMove(items, oldIndex, newIndex));
        return;
      }
    }

    // Handle new component addition
    if (over?.id === "dropzone" && active.data.current?.isNew) {
      setComponents((items) => [
        ...items,
        {
          id: crypto.randomUUID(),
          type: active.data.current?.type,
          content: "",
        },
      ]);
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
        <ComponentList />
        <DropZone
          components={components}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />
      </div>
    </DndContext>
  );
};

export default PageBuilder;
