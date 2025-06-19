// app/admin/page-builder/page.tsx
"use client";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay } from "@dnd-kit/core";
import { useState, useEffect, useCallback } from "react";
import Image from 'next/image';
import { ComponentList } from "./componentList";
import { DropZone } from "./dropZone";
import { ComponentData, RestorationContent, Model3DContent } from "@/lib/types";
import { arrayMove } from "@dnd-kit/sortable";
import AuthGuard from "@/components/authGuard";
import { ImageContent } from "@/lib/types";
import { ImageEditor } from "./components/imageEditor";
import { ArtifactDetails } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { DraggableComponent } from "./draggableComponent";
import { InlineArtefactsLoading, ArtefactFormSkeleton, PageBuilderSkeleton } from "./components/ArtefactsLoading";
import { SaveConfirmationPopup } from "./components/SaveConfirmationPopup";
import { SaveSuccessPopup } from "./components/SaveSuccessPopup";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useNavigationGuardContext } from "@/context/NavigationGuardContext";
import { usePathname } from "next/navigation";

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
  const [date, setDate] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | string>("");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showErrorImage, setShowErrorImage] = useState(false);
  const [showErrorArtist, setShowErrorArtist] = useState(false);
  const [editingImage, setEditingImage] = useState<ComponentData | null>(null);
  const [step, setStep] = useState(0);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [pendingNavigationPath, setPendingNavigationPath] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string>("");
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [activeComponent, setActiveComponent] = useState<ComponentData | null>(null);
  const [dragType, setDragType] = useState<'new' | 'existing' | null>(null);
  const [draggedComponent, setDraggedComponent] = useState<ComponentData | null>(null);
  const [tempComponents, setTempComponents] = useState<ComponentData[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isTransitionLoading, setIsTransitionLoading] = useState(false);
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;
  const router = useRouter();

  const { registerGuard, unregisterGuard } = useNavigationGuardContext();
  const pathname = usePathname();
  
  // Determine if we should block navigation
  const shouldBlock = (step === 0 && (
    artefact.trim() !== '' || 
    artist.trim() !== '' ||
    description.trim() !== '' ||
    date.trim() !== '' ||
    type.trim() !== '' ||
    image !== ''
  )) || (step === 1);
  
  // Register/unregister the navigation guard
  useEffect(() => {
    registerGuard(shouldBlock, pathname);
    
    return () => {
      unregisterGuard();
    };
  }, [shouldBlock, pathname, registerGuard, unregisterGuard]);

  useEffect(() => {
      const handleNavigationAttempt = (event: CustomEvent) => {
          if (shouldBlock) {
              setShowExitConfirmation(true);
              setPendingNavigationPath(event.detail.targetPath);
          } else if (event.detail.targetPath) {
              router.push(event.detail.targetPath);
          }
      };

      // Add event listener
      window.addEventListener('navigationAttempt', handleNavigationAttempt as EventListener);
      
      return () => {
          window.removeEventListener('navigationAttempt', handleNavigationAttempt as EventListener);
      };
  }, [shouldBlock, router]);

  // Handle confirmation dialog responses
  const handleConfirmExit = useCallback(() => {
    setShowExitConfirmation(false);
    
    // If we have a pending navigation path, navigate to it
    if (pendingNavigationPath) {
      router.push(pendingNavigationPath);
      setPendingNavigationPath(null);
    } else {
      // Resolve the pending navigation promise for the context-based navigation
      if ((window as any).pendingNavigationResolve) {
        (window as any).pendingNavigationResolve(true);
        delete (window as any).pendingNavigationResolve;
      }
    }
  }, [pendingNavigationPath, router]);

  // Handle the Canle of the confirm popup
  const handleCancelExit = useCallback(() => {
    setShowExitConfirmation(false);
    setPendingNavigationPath(null);
    
    // Resolve the pending navigation promise with false
    if ((window as any).pendingNavigationResolve) {
      (window as any).pendingNavigationResolve(false);
      delete (window as any).pendingNavigationResolve;
    }
  }, []);

  // Initial page load effect
  useEffect(() => {
    // Simulate initial page load delay
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  // Load artefact for editing
  useEffect(() => {
    if (!editId) {
      setIsLoading(false);
      return;
    }
    
    const abortController = new AbortController();

    const loadArtefactData = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching artifact data for ID:', editId);
        
        // Add a slight delay to show loading animation
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const res = await fetch(`/api/get-artefacts`, {
          signal: abortController.signal,
        });
        const data = await res.json();
        
        console.log('API Response:', data);
        
        if (data.success && data.artifacts) {
          const found = data.artifacts.find((a: { id: string }) => a.id === editId);
          
          if (found) {
            console.log('Found artefact:', found);
            setartefactName(found.name || "");
            setArtist(found.artist || "");
            setType(found.type || "");
            setDate(found.date || "");
            setDescription(found.description || "");
            setImage(found.image || "");
            setImagePreview(typeof found.image === "string" ? found.image : "");
            setComponents(found.components || []);
            setCreatedAt(found.createdAt || "");
          } else {
            console.error("Artifact not found with ID:", editId);
          }

        } else {
          console.error("Failed to fetch artifacts or no artefacts array:", data);
        }
      } catch (error) {
        // Check if the error is due to abort
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Artifact loading was aborted');
          return;
        }
        
        console.error("Error fetching artifacts:", error);
        alert("Failed to load artifact data");
      } finally {
        setTimeout(() => {
          setIsLoading(false);
        }, 300);
      }
    };

    loadArtefactData();

    return () => {
      abortController.abort();
    };
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

    if (!image) {
      setShowErrorImage(true);
      return;
    }

    // Show confirmation popup instead of saving directly
    setShowConfirmationPopup(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirmationPopup(false);

    try {
      setIsSaving(true);

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
        date,
        description,
        image: imageToSend,
        components: componentsWithOrder,
        createdAt: editId ? createdAt : new Date().toISOString(),
      };

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
      setShowSuccessPopup(true);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Error saving artefact:", error);
      alert("Error saving artefact: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelSave = () => {
    setShowConfirmationPopup(false);
  };

  const handleSuccessPopupClose = () => {
    setShowSuccessPopup(false);
    // Navigate with force reload after popup is closed
    window.location.href = '/admin';
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

  const handleUpdate = useCallback((id: string, content: string | ImageContent | RestorationContent | ArtifactDetails | Model3DContent) => {
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
        }else if( c.type === "3DModel" && typeof content !== "string" && 'url' in content) {
          console.log('Updating 3D model component with:', content);
          return { ...c, content } as ComponentData;
        }

        return c;
      })
    );
  }, [setComponents]);

  return (
    <AuthGuard adminOnly={true}>
      {editingImage && (
        <div>
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
        {step === 0 && !isTransitioning && (
          <div className="min-h-screen bg-gray-50">
            <div className="w-full max-w-5xl mx-auto bg-white shadow-sm">
              <div className="flex items-center gap-4 p-6 border-b border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    if (shouldBlock) {
                      setShowExitConfirmation(true);
                      setPendingNavigationPath("/admin");
                    } else {
                      router.push("/admin");
                    }
                  }}
                  className="flex items-center gap-2 hover:cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Admin
                </Button>
                <h1 className="text-2xl font-semibold">{editId ? "Edit Artefact" : "Create New Artefact"}</h1>
              </div>

              {initialLoading || isLoading || isTransitionLoading ? (
                initialLoading ? (
                  <ArtefactFormSkeleton />
                ) : isTransitionLoading ? (
                  <InlineArtefactsLoading message="Preparing page builder..." />
                ) : (
                  editId ? (
                    <InlineArtefactsLoading message="Loading artifact data..." />
                  ) : (
                    <ArtefactFormSkeleton />
                  )
                )
              ) : (
                <>
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

                  {showErrorImage && (
                    <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-red-600 text-sm">* Please upload an header image for your artefact.</p>
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

                      {/* Optional Data */}
                      <div>
                        <h2 className="text-2xl font-semibold mb-4">Extra Information</h2>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="block text-lg font-medium text-gray-700 mb-2">
                              Artefact Date Created <span className="text-xs text-gray-400">(Optional)</span>
                            </label>
                            <Input
                              type="text"
                              required
                              placeholder="Enter artefact date or year (e.g. 25 May 1602, 1400s, unknown)"
                              value={date}
                              onChange={(e) => setDate(e.target.value)}
                              className="w-full h-14 border placeholder:text-gray-400 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base p-4"
                            />
                          </div>
                          <div>
                            <label className="block text-lg font-medium text-gray-700 mb-2">
                              Artefact Type <span className="text-xs text-gray-400">(Optional)</span>
                            </label>                        
                            <Input
                              type="text"
                              required
                              placeholder="Enter artefact type (.e.g. Painting, Sculpture)"
                              value={type}
                              onChange={(e) => setType(e.target.value)}
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
                        <h2 className="text-2xl font-semibold mb-4">Artefact Image <span className="text-red-500">*</span></h2>
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
                              setShowErrorImage(false);
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
                                setShowErrorImage(false);
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
                        onClick={async () => {
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

                          if (!image) {
                            setShowErrorImage(true);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            return;
                          }
                          
                          // First show the transition loading
                          setIsTransitionLoading(true);
                          
                          // Wait for loading animation to display (2 seconds)
                          await new Promise(resolve => setTimeout(resolve, 2000));
                          
                          // Set transition state to true before changing steps
                          setIsTransitioning(true);
                          
                          // Hide the transition loading
                          setIsTransitionLoading(false);
                          
                          // Change step *after* isTransitioning is true
                          setStep(1);
                          
                          // After a short delay, set isTransitioning to false 
                          // to complete the transition
                          setTimeout(() => {
                            setIsTransitioning(false);
                          }, 100);
                        }}
                        disabled={isTransitionLoading || isTransitioning}
                        className="px-6 py-2 hover:cursor-pointer disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isTransitionLoading || isTransitioning ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            {isTransitionLoading ? "Preparing Page Builder..." : "Loading Page Builder..."}
                          </>
                        ) : (
                          <>
                            <Check />
                            Continue to Page Builder
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 1: Page Builder */}
        {step === 1 && !isTransitioning && (
          <>
            {isTransitioning ? (
              <PageBuilderSkeleton />
            ) : (
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
                      className="px-6 py-2 hover:cursor-pointer disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check />
                          Save artefact
                        </>
                      )}
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
          </>
        )}

        {isTransitioning && (
          <PageBuilderSkeleton />
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

      {/* Exit Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showExitConfirmation}
        onClose={handleCancelExit}
        onConfirm={handleConfirmExit}
        title="Leave Page Builder?"
        message="You have unsaved changes. If you leave now, your progress will be lost and nothing will be saved."
        confirmText="Leave Page"
        cancelText="Stay Here"
        variant="warning"
      />

      {/* Confirmation Popup */}
      {showConfirmationPopup && (
        <SaveConfirmationPopup
          isEditMode={isEditMode}
          onConfirm={handleConfirmSave}
          onCancel={handleCancelSave}
        />
      )}

      {/* Success Popup */}
      {showSuccessPopup && (
        <SaveSuccessPopup
          isEditMode={isEditMode}
          onClose={handleSuccessPopupClose}
        />
      )}

    </AuthGuard>
  );
};

export default PageBuilder;