// app/admin/page-builder/page.tsx
"use client";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay } from "@dnd-kit/core";
import { useState, useEffect, useCallback } from "react";
import Image from 'next/image';
import { ComponentList } from "./componentList";
import { DropZone } from "./dropZone";
import { ComponentData, RestorationContent } from "@/lib/types";
import { arrayMove } from "@dnd-kit/sortable";
import AuthGuard from "@/components/authGuard";
import { ImageContent } from "@/lib/types";
import { ImageEditor } from "./components/imageEditor";
import { ArtifactDetails } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import SuccessPopup from "@/components/ui/SuccessPopup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { DraggableComponent } from "./draggableComponent";

// Component templates for drag overlay
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

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Helper function to get display name for component types
const getDisplayName = (type: string) => {
  switch (type) {
    case "restoration":
      return "Restoration";
    default:
      return capitalize(type);
  }
};

const PageBuilder = () => {
  const [components, setComponents] = useState<ComponentData[]>([]);
  const [artefact, setartefactName] = useState("");
  const [artist, setArtist] = useState("");
  const [type, setType] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | string>("");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showErrorArtist, setShowErrorArtist] = useState(false);
  const [editingImage, setEditingImage] = useState<ComponentData | null>(null);
  const [step, setStep] = useState(0);
  const [createdAt, setCreatedAt] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeComponent, setActiveComponent] = useState<ComponentData | null>(null);
  const [dragType, setDragType] = useState<'new' | 'existing' | null>(null);
  const [draggedComponent, setDraggedComponent] = useState<ComponentData | null>(null);
  const [tempComponents, setTempComponents] = useState<ComponentData[]>([]);
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const router = useRouter();

  // Load artefact for editing
  useEffect(() => {
    if (!editId) return;
    (async () => {
      const res = await fetch(`/api/get-artefacts`);
      const data = await res.json();
      if (data.success) {
        const found = data.artefacts.find((a: { id: string }) => a.id === editId);
        if (found) {
          setartefactName(found.name || "");
          setArtist(found.artist || "");
          setType(found.type || "");
          setDescription(found.description || "");
          setImage(found.image || "");
          setImagePreview(typeof found.image === "string" ? found.image : "");
          setComponents(found.components || []);
          setCreatedAt(found.createdAt || "");
        }
      }
    })();
  }, [editId]);

  const handleSubmit = async () => {
    if (!artefact) {
      setShowError(true);
      return;
    }

    if(!artist) {
      setShowErrorArtist(true);
      return;
    }

    // Add order property to each component before saving
    const componentsWithOrder = components.map((component, index) => ({
      ...component,
      order: index
    }));

    // If the image is a File, convert to base64 string for backend upload
    let imageToSend = image;
    if (image && typeof image !== "string") {
      imageToSend = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(image as File);
      });
    }

    const artefactData = {
      id: editId || crypto.randomUUID(),
      name: artefact,
      artist,
      type,
      description,
      image: imageToSend,
      components: componentsWithOrder,
      createdAt: editId ? createdAt : new Date().toISOString(),
    };

    try {
      setIsSaving(true);
      const response = await fetch("/api/save-artifact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(artefactData),
      });

      if (!response.ok) {
        let errorMsg = "Save failed";
        try {
          const errorData = await response.json() as { error?: string };
          errorMsg = errorData?.error || errorMsg;
        } catch {
          try {
            errorMsg = await response.text();
          } catch {
            throw new Error("Unknown error occurred while saving artefact.");
          }
        }
        throw new Error(errorMsg);
      }

      setComponents([]);
      setartefactName("");
      setShowSuccess(true);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Error saving artefact:", error);
      alert("Error saving artefact: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle drag start to track active component
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    
    // Set dragging state
    setIsDragging(true);
    
    // Check if it's a new component from sidebar or existing component from canvas
    if (active.data.current?.isNew) {
      setDragType('new');
      // Find the component template for new components
      const componentTemplate = [...basicComponents, ...advancedComponents].find(
        comp => comp.id === active.id
      );
      setActiveComponent(componentTemplate || null);
    } else {
      setDragType('existing');
      // Find the existing component being dragged
      const existingComponent = components.find(comp => comp.id === active.id);
      if (existingComponent) {
        // Store the full component data
        setDraggedComponent(existingComponent);
        
        // Remove from displayed components
        const remainingComponents = components.filter(comp => comp.id !== active.id);
        setTempComponents(remainingComponents);
        
        // Create a simplified version for the drag overlay that looks like a component list item
        const simplifiedComponent: ComponentData = {
          id: existingComponent.id,
          type: existingComponent.type,
          content: existingComponent.type === "heading" ? "Heading" :
                  existingComponent.type === "subheading" ? "SubHeading" :
                  existingComponent.type === "paragraph" ? "Paragraph" :
                  existingComponent.type === "image" ? { url: "", points: [] } :
                  existingComponent.type === "restoration" ? { restorations: [] } :
                  existingComponent.type === "details" ? {
                    created: "",
                    origin: "",
                    currentLocation: "",
                    dimensions: "",
                    materials: ""
                  } : ""
        };
        setActiveComponent(simplifiedComponent);
      }
    }
  };

  // Drag end handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Clear dragging state and active component
    setIsDragging(false);
    setActiveComponent(null);
    
    // If we were dragging an existing component, we need to handle it
    if (dragType === 'existing' && draggedComponent) {
      if (!over?.id) {
        // No valid drop target - restore the component to its original position
        setTempComponents([]);
        setDraggedComponent(null);
        setDragType(null);
        return;
      }

      // Handle insertion points (insert-0, insert-1, etc.)
      if (typeof over.id === 'string' && over.id.startsWith('insert-')) {
        const insertIndex = parseInt(over.id.replace('insert-', ''));
        const newComponents = [...tempComponents];
        newComponents.splice(insertIndex, 0, draggedComponent);
        
        // Re-assign order after insertion
        const finalComponents = newComponents.map((component, index) => ({
          ...component,
          order: index
        }));
        
        setComponents(finalComponents);
        setTempComponents([]);
        setDraggedComponent(null);
        setDragType(null);
        return;
      }

      // Handle main dropzone (add to end)
      if (over.id === "dropzone") {
        const newComponents = [...tempComponents, { ...draggedComponent, order: tempComponents.length }];
        setComponents(newComponents);
        setTempComponents([]);
        setDraggedComponent(null);
        setDragType(null);
        return;
      }

      // Handle dropping on another component (reorder)
      const targetIndex = tempComponents.findIndex((c) => c.id === over.id);
      if (targetIndex !== -1) {
        const newComponents = [...tempComponents];
        newComponents.splice(targetIndex, 0, draggedComponent);
        
        // Re-assign order after insertion
        const finalComponents = newComponents.map((component, index) => ({
          ...component,
          order: index
        }));
        
        setComponents(finalComponents);
        setTempComponents([]);
        setDraggedComponent(null);
        setDragType(null);
        return;
      }

      // If we get here, restore to original position
      setTempComponents([]);
      setDraggedComponent(null);
      setDragType(null);
      return;
    }

    // Reset drag type and dragged component for new components
    setDragType(null);
    setDraggedComponent(null);
    setTempComponents([]);

    if (!over?.id) return;

    // Handle reordering existing components (this shouldn't happen with our new approach)
    if (active.id !== over.id && dragType !== 'new') {
      const oldIndex = components.findIndex((c) => c.id === active.id);
      const newIndex = components.findIndex((c) => c.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        setComponents((items) => arrayMove(items, oldIndex, newIndex));
        return;
      }
    }

    // Handle dropping new components
    if (active.data.current?.isNew) {
      const type = active.data.current?.type as ComponentData['type'];
      const newComponent: ComponentData = {
        id: crypto.randomUUID(),
        type,
        content: (() => {
          switch (type) {
            case "image":
              return { url: "", points: [] };
            case "restoration":
              return { restorations: [] };
            case "details":
              return {
                created: "",
                origin: "",
                currentLocation: "",
                dimensions: "",
                materials: ""
              };            
            case "heading":
            case "subheading":
            case "paragraph":
              return "";
            default:
              return "";
          }
        })(),
      };

      // Handle insertion points (insert-0, insert-1, etc.)
      if (typeof over.id === 'string' && over.id.startsWith('insert-')) {
        const insertIndex = parseInt(over.id.replace('insert-', ''));
        setComponents(items => {
          const newItems = [...items];
          newItems.splice(insertIndex, 0, newComponent);
          // Re-assign order after insertion
          return newItems.map((component, index) => ({
            ...component,
            order: index
          }));
        });
        return;
      }

      // Handle main dropzone (add to end)
      if (over.id === "dropzone") {
        newComponent.order = components.length;
        setComponents(items => [...items, newComponent]);
      }
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

  const handleUpdate = useCallback((id: string, content: string | ImageContent | RestorationContent | ArtifactDetails) => {
    console.log('Updating component:', id, content);
    setComponents((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;

        if (c.type === "image" && typeof content !== "string" && 'url' in content) {
          return { ...c, content } as ComponentData;
        } else if (
          (c.type === "heading" || c.type === "paragraph" || c.type === "subheading") &&
          typeof content === "string"
        ) {
          return { ...c, content } as ComponentData;
        } else if (c.type === "restoration" && typeof content !== "string" && 'restorations' in content) {
          console.log('Updating restoration component with:', content);
          return { ...c, content } as ComponentData;
        } else if (c.type === "details" && typeof content !== "string" && 'created' in content) {
          console.log('Updating details component with:', content);
          return { ...c, content } as ComponentData;
        }

        return c;
      })
    );
  }, [setComponents]);

  return (
    <AuthGuard adminOnly={true}>
      {showSuccess && (
        <SuccessPopup
          message="artefact saved successfully!"
          onOk={() => (window.location.href = "/admin")}
        />
      )}

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

      <DndContext 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Step 0: Basic Info, Description & Image */}
        {step === 0 && (
          <div className="min-h-screen bg-gray-50">
            <div className="w-full max-w-5xl mx-auto bg-white shadow-sm">
              <div className="flex items-center gap-4 p-6 border-b border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/admin")}
                  className="flex items-center gap-2 hover:cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Admin
                </Button>
                <h1 className="text-2xl font-semibold">{editId ? "Edit Artefact" : "Create New Artefact"}</h1>
              </div>

              {showError && (
                <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm">* Please enter a name for your artefact.</p>
                </div>
              )}

              {showErrorArtist && (
                <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm">* Please enter a name for your artist.</p>
                </div>
              )}

              <div className="p-6">
                <div className="space-y-8">
                  {/* Basic Information */}
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Basic Information <span className="text-red-500">*</span></h2>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-lg font-medium text-gray-700 mb-2">
                          Artefact Title
                        </label>
                        <Input
                          type="text"
                          required
                          placeholder="Enter artefact name"
                          value={artefact}
                          onChange={(e) => setartefactName(e.target.value)}
                          onFocus={() => setShowError(false)}
                          className="w-full h-14 border placeholder:text-gray-400 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base p-4"
                        />
                      </div>
                      <div>
                        <label className="block text-lg font-medium text-gray-700 mb-2">
                          Artist
                        </label>                        
                        <Input
                          type="text"
                          required
                          placeholder="Enter artist name"
                          value={artist}
                          onChange={(e) => setArtist(e.target.value)}
                          onFocus={() => setShowErrorArtist(false)}
                          className="w-full h-14 border placeholder:text-gray-400 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base p-4"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Description <span className="text-xs text-gray-400">(Optional)</span></h2>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Short description to entice students (max 80 words)
                      </label>
                      <div className="relative">
                        <textarea
                          placeholder="Enter description..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="w-full placeholder:text-gray-400 p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none text-sm pr-20"
                        />
                        <div className={`absolute bottom-3 right-3 text-sm ${
                          description.split(/\s+/).filter(word => word.length > 0).length > 80 
                            ? 'text-red-600 font-semibold' 
                            : 'text-gray-500'
                        }`}>
                          {description.split(/\s+/).filter(word => word.length > 0).length > 80 
                            ? `-${description.split(/\s+/).filter(word => word.length > 0).length - 80}` 
                            : `${description.split(/\s+/).filter(word => word.length > 0).length}/80`
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Artefact Image <span className="text-xs text-gray-400">(Optional)</span></h2>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      This image will appear at the top of the artefacts page and can provide users with additional context about the artefact.
                    </label>
                    <div
                      className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                        const files = e.dataTransfer.files;
                        if (files.length > 0 && files[0].type.startsWith('image/')) {
                          const file = files[0];
                          setImage(file);
                          setImagePreview(URL.createObjectURL(file));
                        }
                      }}
                      onClick={() => document.getElementById('file-input')?.click()}
                    >
                      <input
                        id="file-input"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setImage(file);
                            setImagePreview(URL.createObjectURL(file));
                          } else {
                            setImage("");
                            setImagePreview("");
                          }
                        }}
                        className="hidden"
                      />
                      
                      {!imagePreview ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">
                              Drag and drop or click to browse
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              PNG, JPG, GIF up to 10MB
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center space-y-3">
                          <div className="relative w-full h-96 border border-gray-300 rounded-md overflow-hidden">
                            <Image
                              src={imagePreview}
                              alt="Preview"
                              fill
                              className="object-contain"
                            />
                          </div>
                          <p className="text-sm font-medium text-gray-700">
                            Click to change image
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Fixed at bottom with proper spacing */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 mt-8">
                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      if (!artefact) {
                        setShowError(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        return;
                      }

                      if (!artist) {
                        setShowErrorArtist(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        return;
                      }
                      setStep(1);
                    }}
                    className="px-6 py-2 hover:cursor-pointer"
                  >
                    <Check />
                    Continue to Page Builder
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Page Builder */}
        {step === 1 && (
          <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
            <div className="bg-white shadow-sm border-b p-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStep(0)}
                    className="flex items-center gap-2 hover:cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Details
                  </Button>
                  <div>
                    <h1 className="text-2xl ml-25 font-semibold">Page Builder</h1>
                    <p className="text-sm ml-25 text-gray-600 mt-1">Building: {artefact}</p>
                  </div>
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="px-6 py-2 hover:cursor-pointer disabled:cursor-not-allowed"
                >
                  <Check />
                  {isSaving ? "Saving..." : "Save artefact"}
                </Button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <ComponentList />
              <div className="flex-1 h-full min-h-full flex flex-col overflow-y-auto">
                <DropZone
                  components={isDragging && dragType === 'existing' ? tempComponents : components}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                  onEditPoints={setEditingImage}
                  isDragging={isDragging}
                />
              </div>
            </div>
          </div>
        )}

        {/* DragOverlay - Enhanced to show component list style for both new and existing components */}
        <DragOverlay>
          {activeComponent ? (
            <div className={`transform opacity-95 shadow-2xl ${
              dragType === 'existing' ? 'rotate-2' : 'rotate-2'
            }`}>
              <DraggableComponent
                component={activeComponent}
                displayName={getDisplayName(activeComponent.type)}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </AuthGuard>
  );
};

export default PageBuilder;