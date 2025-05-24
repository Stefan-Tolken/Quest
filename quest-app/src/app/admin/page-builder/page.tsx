// app/admin/page-builder/page.tsx
"use client";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { useState } from "react";
import { ComponentList } from "./componentList";
import { DropZone } from "./dropZone";
import { ComponentData, RestorationContent } from "@/lib/types";
import { arrayMove } from "@dnd-kit/sortable";
import AuthGuard from "@/components/authGuard";
import { ImageContent } from "@/lib/types";
import { ImageEditor } from "./components/imageEditor";

const PageBuilder = () => {
  const [components, setComponents] = useState<ComponentData[]>([]);
  const [artifactName, setArtifactName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showError, setShowError] = useState(false);
  const [editingImage, setEditingImage] = useState<ComponentData | null>(null);

  const handleSubmit = async () => {
    if (!artifactName) {
      setShowError(true);
      return;
    }

    // Add order property to each component before saving
    const componentsWithOrder = components.map((component, index) => ({
      ...component,
      order: index
    }));

    const artifactData = {
      id: crypto.randomUUID(), // UUID string
      name: artifactName,
      components: componentsWithOrder,
      createdAt: new Date().toISOString(),
      partOfQuest: false,
    };

    try {
      setIsSaving(true);
      const response = await fetch("/api/save-artifact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(artifactData),
      });

      if (!response.ok) throw new Error("Save failed");
      alert("Artifact saved successfully!");
      setComponents([]);
      setArtifactName("");
    } catch (error) {
      console.error("Error saving artifact:", error);
      alert("Error saving artifact");
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
          order: items.length, // Add order based on current array length
          content: 
            active.data.current?.type === "image"
              ? { url: "", points: [] }
              : active.data.current?.type === "restoration"
              ? { restorations: [] }
              : "New Content",
        },
      ]);
    }
  };

  const handleDelete = (id: string) => {
    setComponents((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      // Re-assign order after deletion to maintain sequential order
      return filtered.map((component, index) => ({
        ...component,
        order: index
      }));
    });
  };

  const handleUpdate = (id: string, content: string | ImageContent | RestorationContent) => {
    console.log('Updating component:', id, content);
    setComponents((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;

        if (c.type === "image" && typeof content !== "string" && 'url' in content) {
          return { ...c, content } as ComponentData;
        } else if (
          (c.type === "heading" || c.type === "paragraph") &&
          typeof content === "string"
        ) {
          return { ...c, content } as ComponentData;
        } else if (c.type === "restoration" && typeof content !== "string" && 'restorations' in content) {
          console.log('Updating restoration component with:', content);
          return { ...c, content } as ComponentData;
        }

        return c;
      })
    );
  };

  return (
    <AuthGuard adminOnly={true}>
      {editingImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <ImageEditor
            imageUrl={(editingImage.content as ImageContent).url}
            points={(editingImage.content as ImageContent).points}
            onSave={(points) => {
              handleUpdate(editingImage.id, {
                ...(editingImage.content as ImageContent),
                points,
              });
              setEditingImage(null);
            }}
            onClose={() => setEditingImage(null)}
          />
        </div>
      )}

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
                {isSaving ? "Saving..." : "Save Artifact"}
              </button>
            </div>
          </div>

          {/* Make the main content area scrollable */}
          <div className="flex flex-1 overflow-hidden">
            <ComponentList />
            <div className="flex-1 h-full min-h-full flex flex-col overflow-y-auto">
              <DropZone
                components={components}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                onEditPoints={setEditingImage}
              />
            </div>
          </div>
        </div>
      </DndContext>
    </AuthGuard>
  );
};

export default PageBuilder;