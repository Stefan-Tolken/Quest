// app/admin/page-builder/page.tsx
"use client";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { useState } from "react";
import { ComponentList } from "./componentList";
import { DropZone } from "./dropZone";
import { ComponentData } from "./types";
import { arrayMove } from "@dnd-kit/sortable";
import AuthGuard from "@/components/authGuard";

const PageBuilder = () => {
  const [components, setComponents] = useState<ComponentData[]>([]);
  const [artifactName, setArtifactName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleSubmit = async () => {
    if (!artifactName) {
      setShowError(true);
      return;
    }

    const artifactData = {
      id: crypto.randomUUID(), // UUID string
      name: artifactName,
      components,
      createdAt: new Date().toISOString(),
      partOfQuest: false
    };

    try {
      setIsSaving(true);
      const response = await fetch('/api/save-artifact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(artifactData),
      });

      if (!response.ok) throw new Error('Save failed');
      alert('Artifact saved successfully!');
      setComponents([]);
      setArtifactName("");
    } catch (error) {
      console.error('Error saving artifact:', error);
      alert('Error saving artifact');
    } finally {
      setIsSaving(false);
    }
  };

  // Existing drag end handler remains the same
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over?.id && active.id !== over.id) {
      const oldIndex = components.findIndex((c) => c.id === active.id);
      const newIndex = components.findIndex((c) => c.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        setComponents((items) => arrayMove(items, oldIndex, newIndex));
        return;
      }
    }

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
    <AuthGuard adminOnly={true}>
      <DndContext onDragEnd={handleDragEnd}>
        <div className="flex flex-col h-screen bg-gray-50">
          <div className="p-4 border-b bg-white">
            <div className="max-w-3xl mx-auto space-y-4">
              <h1 className="text-2xl font-bold">Create New Artifact</h1>
              <p className="text-red-500 text-sm" hidden={!showError}>
                * Please enter a name for your artifact.
              </p>
              
              <input
                type="text"
                required
                placeholder="Artifact Name *"
                value={artifactName}
                onChange={(e) => setArtifactName(e.target.value)}
                onFocus={() => setShowError(false)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="fixed bottom-4 right-4 bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                {isSaving ? 'Saving...' : 'Save Artifact'}
              </button>
            </div>
          </div>
          
          <div className="flex flex-1 overflow-hidden">
            <ComponentList />
            <DropZone
              components={components}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          </div>
        </div>
      </DndContext>
    </AuthGuard>
  );
};

export default PageBuilder;