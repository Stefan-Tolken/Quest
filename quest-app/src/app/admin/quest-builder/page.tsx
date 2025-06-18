"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, CheckCircle, ArrowLeft, Check, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { QuestInfo } from "./components/QuestInfo";
import { UnifiedArtefactSection } from "./components/UnifiedArtefactSection";
import { HintsSection } from "./components/HintSection";
import { PrizeSection } from "./components/PrizeSection";
import { Button } from "@/components/ui/button";
import type { QuestArtefact, Quest, Artefact, DateRange, Hint } from "@/lib/types";
import { SaveSuccessPopup } from "./components/SaveSuccessPopup";
import { SaveConfirmationPopup } from "./components/SaveConfirmationPopup";
import { InlineQuestLoading, QuestFormSkeleton } from "./components/QuestLoading";
import { useNavigationGuardContext } from "@/context/NavigationGuardContext";
import { usePathname } from "next/navigation";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

const QuestBuild = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;
  const [initialLoading, setInitialLoading] = useState(true);
  const [quest, setQuest] = useState<Quest>({
    quest_id: editId || crypto.randomUUID(),
    title: "",
    description: "",
    artefacts: [],
    questType: "sequential",
    dateRange: undefined,
    prize: { title: "", description: "", image: "" },
    createdAt: new Date().toISOString(),
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Artefact[]>([]);
  const [allArtefacts, setAllArtefacts] = useState<Artefact[]>([]);
  const [showPrize, setShowPrize] = useState(false);
  const [activeArtefactIndex, setActiveArtefactIndex] = useState<number | null>(null);
  const [currentHint, setCurrentHint] = useState<Omit<Hint, "id" | "displayedHint">>({
    description: "",
    displayAfterAttempts: 1,
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [pendingNavigationPath, setPendingNavigationPath] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { registerGuard, unregisterGuard } = useNavigationGuardContext();
  const pathname = usePathname();
  
  // Determine if we should block navigation - check if any important fields have been filled
  const shouldBlock = 
    quest.title.trim() !== '' || 
    quest.description.trim() !== '' || 
    quest.artefacts.length > 0 ||
    (quest.prize && (quest.prize.title.trim() !== '' || quest.prize.description.trim() !== '' || !!imagePreview));
  
  // Register/unregister the navigation guard
  useEffect(() => {
    registerGuard(!!shouldBlock, pathname);
    
    return () => {
      unregisterGuard();
    };
  }, [shouldBlock, pathname, registerGuard, unregisterGuard]);

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

  // Load quest data when in edit mode
  useEffect(() => {
    const abortController = new AbortController();

    const resetState = () => {
      setQuest({
        quest_id: editId || crypto.randomUUID(),
        title: "",
        description: "",
        artefacts: [],
        questType: "sequential",
        dateRange: undefined,
        prize: { title: "", description: "", image: "" },
        createdAt: new Date().toISOString(),
      });

      setImageFile(null);
      setActiveArtefactIndex(null);
      setValidationErrors({});
    };

    const loadQuestData = async () => {
      if (!editId) {
        setIsLoading(false);
        return;
      }
      
      // Rest of your existing loadQuestData function...
      try {
        resetState();
        setIsLoading(true);

        console.log('Fetching quest data for ID:', editId);
        // Add a slight delay to show loading animation
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const response = await fetch(`/api/get-quests?id=${editId}`, {
          signal: abortController.signal,
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch quest');
        }
        
        const data = await response.json();
        console.log('Received quest data:', data);
        
        if (!data.quests || data.quests.length === 0) {
          throw new Error('No quest found with this ID');
        }

        const questToEdit = data.quests.find((quest: { quest_id: string; }) => quest.quest_id === editId);

        if (!questToEdit) {
          throw new Error(`No quest found with ID: ${editId}`);
        }

        console.log('Quest to edit:', questToEdit);

        const artefactsWithNames = questToEdit.artefacts.map((artefact: QuestArtefact) => ({
          ...artefact,
          name: artefact.name || "Unknown Artefact"
        }));
        
        console.log('Final quest data:', {
          ...questToEdit,
          artefacts: artefactsWithNames
        });
        
        setQuest({
          ...questToEdit,
          artefacts: artefactsWithNames
        });
        
        if (questToEdit.prize?.image) {
          setImagePreview(questToEdit.prize.image);
        }
      } catch (error) {
        // Check if the error is due to abort
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Quest loading was aborted');
          return;
        }
        
        console.error('Error loading quest:', error);
        alert(`Failed to load quest data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        // Add slight delay before removing loading state for smoother transition
        setTimeout(() => {
          setIsLoading(false);
        }, 300);
      }
    };

    // Set initial loading state
    setIsLoading(true);
    
    setQuest({
      quest_id: editId || crypto.randomUUID(),
      title: "",
      description: "",
      artefacts: [],
      questType: "sequential",
      dateRange: undefined,
      prize: { title: "", description: "", image: "" },
      createdAt: new Date().toISOString(),
    });
    setImageFile(null);

    if (editId) {
      loadQuestData();
    } else {
      // Even in create mode, show loading briefly for consistency
      setTimeout(() => {
        setIsLoading(false);
      }, 600);
    }

    return () => {
      abortController.abort();
    };
  }, [editId]);

  // Load all artefacts on component mount
  useEffect(() => {
    const loadAllArtefacts = async () => {
      try {
        const artefacts = await fetchArtefacts();
        setAllArtefacts(artefacts);
      } catch (error) {
        console.error('Error loading all artefacts:', error);
      }
    };
    
    loadAllArtefacts();
  }, []);

  const getRandomArtefacts = useCallback((count: number = 3): Artefact[] => {
    const addedArtefactIds = quest.artefacts.map(a => a.artefactId);
    const availableArtefacts = allArtefacts.filter(
      artefact => !addedArtefactIds.includes(artefact.id)
    );
    
    if (availableArtefacts.length <= count) {
      return availableArtefacts;
    }
    
    const shuffled = [...availableArtefacts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }, [quest.artefacts, allArtefacts]);

  const fetchArtefacts = async () => {
    try {
      const response = await fetch('/api/get-artefacts');
      if (!response.ok) throw new Error('Failed to fetch artefacts');
      const data = await response.json();
      return data.artifacts || [];
    } catch (error) {
      console.error('Error fetching artefacts:', error);
      return [];
    }
  };

  // Search artefacts whenever search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      // Show random artefacts when search is empty
      const randomArtefacts = getRandomArtefacts(3);
      setSearchResults(randomArtefacts);
      return;
    }

    const addedArtefactIds = quest.artefacts.map(a => a.artefactId);
    const filteredResults = allArtefacts.filter(
      (artefact: Artefact) =>
        !addedArtefactIds.includes(artefact.id) &&
        (
          artefact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (artefact.artist && artefact.artist.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (artefact.date && artefact.date.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (artefact.description && artefact.description.toLowerCase().includes(searchQuery.toLowerCase()))
        )
    );    
    setSearchResults(filteredResults);
  }, [searchQuery, allArtefacts, quest.artefacts, getRandomArtefacts]);

  const handleSetTitle = (title: string) => {
    setQuest((prev) => ({ ...prev, title }));
    validateField("title", title);
  };

  const handleSetDescription = (description: string) => {
    setQuest((prev) => ({ ...prev, description }));
    validateField("description", description);
  };

  const validateField = (field: string, value: string) => {
    setValidationErrors((prev) => {
      const newErrors = { ...prev };

      if (!value.trim()) {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      } else {
        delete newErrors[field];
      }

      return newErrors;
    });
  };

  const handleDateRangeChange = (dateRange: DateRange | undefined) => {
    setQuest((prev) => ({
      ...prev,
      dateRange: dateRange
        ? {
            from: dateRange.from || undefined,
            to: dateRange.to || undefined,
          }
        : undefined,
    }));
    validateDateRange(dateRange);
  };

  const validateDateRange = (dateRange?: DateRange) => {
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      
      if (!dateRange?.from || !dateRange?.to) {
        newErrors.dateRange = "Date range is required";
      } else if (dateRange.from > dateRange.to) {
        newErrors.dateRange = "End date must be after start date";
      } else {
        delete newErrors.dateRange;
      }
      
      return newErrors;
    });
  };

  const addArtefact = (artefact: Artefact) => {
    if (quest.artefacts.some((a) => a.artefactId === artefact.id)) {
      return;
    }

    const newArtefact: QuestArtefact = {
      artefactId: artefact.id,
      name: artefact.name,
      hints: [],
      hintDisplayMode: "sequential",
    };

    setQuest((prev) => ({
      ...prev,
      artefacts: [...prev.artefacts, newArtefact],
    }));

    // Update search results to show new random artefacts excluding the one just added
    const updatedRandomArtefacts = getRandomArtefacts(3);
    setSearchResults(updatedRandomArtefacts);

    validateArtefactsCount([...quest.artefacts, newArtefact]);
  };

  const validateArtefactsCount = (artefacts: QuestArtefact[]) => {
    setValidationErrors((prev) => {
      const newErrors = { ...prev };

      if (artefacts.length < 1) {
        newErrors.artefacts = "At least one artefact is required";
      } else {
        delete newErrors.artefacts;
      }

      return newErrors;
    });
  };

  const removeArtefact = (index: number) => {
    const updatedArtefacts = quest.artefacts.filter((_, i) => i !== index);
    setQuest((prev) => ({ ...prev, artefacts: updatedArtefacts }));
    validateArtefactsCount(updatedArtefacts);

    // Update search results to include newly available artefacts
    if (searchQuery.trim() === "") {
      const updatedRandomArtefacts = getRandomArtefacts(3);
      setSearchResults(updatedRandomArtefacts);
    } else {
      // Re-run search to include the removed artefact if it matches
      const addedArtefactIds = updatedArtefacts.map(a => a.artefactId);
      const filteredResults = allArtefacts.filter(
        (artefact: Artefact) =>
          !addedArtefactIds.includes(artefact.id) &&
          (
            artefact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (artefact.artist && artefact.artist.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (artefact.date && artefact.date.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (artefact.description && artefact.description.toLowerCase().includes(searchQuery.toLowerCase()))
          )
      );
      setSearchResults(filteredResults);
    }

    if (activeArtefactIndex === index) {
      setActiveArtefactIndex(null);
    } else if (activeArtefactIndex !== null && activeArtefactIndex > index) {
      setActiveArtefactIndex(activeArtefactIndex - 1);
    }
  };

  const moveArtefact = (index: number, direction: "up" | "down") => {
    if (quest.questType !== "sequential") return;

    const newIndex = direction === "up" ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= quest.artefacts.length) return;

    setQuest((prev) => {
      const newArtefacts = [...prev.artefacts];
      const temp = newArtefacts[index];
      newArtefacts[index] = newArtefacts[newIndex];
      newArtefacts[newIndex] = temp;
      return { ...prev, artefacts: newArtefacts };
    });

    if (activeArtefactIndex === index) {
      setActiveArtefactIndex(newIndex);
    } else if (activeArtefactIndex === newIndex) {
      setActiveArtefactIndex(index);
    }
  };

  const reorderArtefacts = (newArtefactsOrder: QuestArtefact[]) => {
    setQuest((prev) => ({
      ...prev,
      artefacts: newArtefactsOrder,
    }));
  };

  const toggleArtefactDetails = (index: number) => {
    setActiveArtefactIndex(activeArtefactIndex === index ? null : index);
    setCurrentHint({ description: "", displayAfterAttempts: 1 });
  };

  const handleAddHint = (artefactIndex: number) => {
    if (!currentHint.description.trim()) return;

    setQuest((prev) => {
      const updatedArtefacts = [...prev.artefacts];
      const updatedArtefact = {
        ...updatedArtefacts[artefactIndex],
        hints: [
          ...updatedArtefacts[artefactIndex].hints,
          {
            ...currentHint,
            id: crypto.randomUUID(),
            displayAfterAttempts: currentHint.displayAfterAttempts,
          },
        ],
      };

      updatedArtefacts[artefactIndex] = updatedArtefact;
      return { ...prev, artefacts: updatedArtefacts };
    });

    setCurrentHint({ description: "", displayAfterAttempts: 1 });
  };

  const removeHint = (artefactIndex: number, hintIndex: number) => {
    setQuest((prev) => {
      const updatedArtefacts = [...prev.artefacts];
      const newHints = updatedArtefacts[artefactIndex].hints.filter(
        (_, i) => i !== hintIndex
      );

      updatedArtefacts[artefactIndex] = {
        ...updatedArtefacts[artefactIndex],
        hints: newHints,
      };

      return { ...prev, artefacts: updatedArtefacts };
    });
  };

  const moveHint = (
    artefactIndex: number,
    hintIndex: number,
    direction: "up" | "down"
  ) => {
    const newHintIndex = direction === "up" ? hintIndex - 1 : hintIndex + 1;

    if (newHintIndex < 0 || newHintIndex >= quest.artefacts[artefactIndex].hints.length) {
      return;
    }

    setQuest((prev) => {
      const updatedArtefacts = [...prev.artefacts];
      const hints = [...updatedArtefacts[artefactIndex].hints];

      const temp = hints[hintIndex];
      hints[hintIndex] = hints[newHintIndex];
      hints[newHintIndex] = temp;

      updatedArtefacts[artefactIndex] = {
        ...updatedArtefacts[artefactIndex],
        hints: hints,
      };

      return { ...prev, artefacts: updatedArtefacts };
    });
  };

  const reorderHints = (
    artefactIndex: number,
    newHintsOrder: Hint[]
  ) => {
    setQuest((prev) => {
      const updatedArtefacts = [...prev.artefacts];

      updatedArtefacts[artefactIndex] = {
        ...updatedArtefacts[artefactIndex],
        hints: newHintsOrder,
      };

      return { ...prev, artefacts: updatedArtefacts };
    });
  };

  const setQuestType = (questType: "sequential" | "concurrent") => {
    setQuest((prev) => ({ ...prev, questType }));

    if (questType === "concurrent" && quest.artefacts.length < 3) {
      setValidationErrors((prev) => ({
        ...prev,
        questType: "Concurrent quests require at least 3 artefacts",
      }));
    } else {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.questType;
        return newErrors;
      });
    }
  };

  const handleSetPrize = (field: "title" | "description", value: string) => {
    setQuest((prev) => ({
      ...prev,
      prize: { ...prev.prize!, [field]: value },
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setQuest((prev) => ({
      ...prev,
      prize: { ...prev.prize!, image: "" },
    }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file?.type.match("image.*")) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSaveQuest = async () => {
    const errors: Record<string, string> = {};

    if (!quest.title.trim()) errors.title = "Title is required";
    if (!quest.description.trim()) errors.description = "Description is required";
    if (quest.artefacts.length < 1) errors.artefacts = "At least one artefact is required";
    if (!quest.dateRange?.from || !quest.dateRange?.to) {
      errors.dateRange = "Date range is required";
    } else if (quest.dateRange.from > quest.dateRange.to) {
      errors.dateRange = "End date must be after start date";
    }

    if (quest.questType === "concurrent" && quest.artefacts.length < 3) {
      errors.questType = "Concurrent quests require at least 3 artefacts";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Show confirmation popup instead of saving directly
    setShowConfirmationPopup(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirmationPopup(false);
    
    try {
      setIsSaving(true);
      const formData = new FormData();
      
      if (imageFile) {
        formData.append("prizeImage", imageFile);
      }

      const questData = {
        ...quest,
        prize: quest.prize || undefined,
      };

      if (editId) {
        questData.quest_id = editId;
      }

      formData.append("quest", JSON.stringify(questData));

      const response = await fetch("/api/save-quest", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save quest");
      }
    
      // Show success popup instead of alert
      setShowSuccessPopup(true);
      
    } catch (error) {
      console.error("Error saving quest:", error);
      alert(
        `Failed to save quest: ${error instanceof Error ? error.message : "Unknown error"}`
      );
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

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    if (shouldBlock) {
      setShowExitConfirmation(true);
      setPendingNavigationPath("/admin");
    } else {
      router.push('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-5xl mx-auto bg-white shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-4 p-6 border-b border-gray-200">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="flex items-center gap-2 hover:cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Button>
          <h1 className="text-2xl font-semibold">
            {isEditMode ? "Edit Quest" : "Create New Quest"}
          </h1>
        </div>

        {isLoading ? (
          // Check if we're in edit mode to show the right loading state
          editId ? (
            <InlineQuestLoading message="Loading quest data..." />
          ) : (
            <QuestFormSkeleton />
          )
        ) : (
          <div className="p-6">
            <div className="space-y-8">
              {/* Quest Information */}
              <div>
                <h2 className="text-2xl font-semibold mb-4">Quest Information <span className="text-red-500">*</span></h2>
                <QuestInfo
                  title={quest.title}
                  description={quest.description}
                  dateRange={quest.dateRange}
                  validationErrors={validationErrors}
                  onTitleChange={handleSetTitle}
                  onDescriptionChange={handleSetDescription}
                  onDateRangeChange={handleDateRangeChange}
                />
              </div>

              {/* Unified Artefacts Section */}
              <UnifiedArtefactSection
                searchQuery={searchQuery}
                searchResults={searchResults}
                onSearchChange={setSearchQuery}
                onAddArtifact={addArtefact}
                questArtefacts={quest.artefacts}
                questType={quest.questType}
                activeArtefactIndex={activeArtefactIndex}
                validationErrors={validationErrors}
                onRemoveArtifact={removeArtefact}
                onMoveArtifact={moveArtefact}
                onToggleDetails={toggleArtefactDetails}
                onReorderArtifacts={reorderArtefacts}
                onSetQuestType={setQuestType}
              >
                {activeArtefactIndex !== null && (
                  <HintsSection
                    hints={quest.artefacts[activeArtefactIndex].hints}
                    hintDisplayMode={
                      quest.artefacts[activeArtefactIndex].hintDisplayMode
                    }
                    currentHint={currentHint}
                    onAddHint={() => handleAddHint(activeArtefactIndex)}
                    onRemoveHint={(hintIndex) =>
                      removeHint(activeArtefactIndex, hintIndex)
                    }
                    onMoveHint={(hintIndex, direction) =>
                      moveHint(activeArtefactIndex, hintIndex, direction)
                    }
                    onCurrentHintChange={(value) =>
                      setCurrentHint({ ...currentHint, description: value })
                    }
                    onReorderHints={(newOrder) =>
                      reorderHints(activeArtefactIndex, newOrder)
                    }
                  />
                )}
              </UnifiedArtefactSection>

              {/* Prize Section */}
              <div>
                <h2 className="text-2xl font-semibold mb-4">Prize Details <span className="text-xs text-gray-400">(Optional)</span></h2>
                <PrizeSection
                  showPrize={showPrize}
                  prize={quest.prize ?? { title: "", description: "", image: "" }}
                  imagePreview={imagePreview}
                  fileInputRef={fileInputRef}
                  onTogglePrize={() => setShowPrize(!showPrize)}
                  onSetPrize={handleSetPrize}
                  onImageUpload={handleImageUpload}
                  onRemoveImage={removeImage}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons - Fixed at bottom */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 mt-8">
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="px-6 py-2 hover:cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveQuest}
              disabled={isSaving || isLoading}
              className="px-6 py-2 hover:cursor-pointer disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Check size={18} />
                  {isEditMode ? "Save Changes" : "Create Quest"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

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

      {/* Exit Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showExitConfirmation}
        onClose={handleCancelExit}
        onConfirm={handleConfirmExit}
        title="Leave Quest Builder?"
        message="You have unsaved changes. If you leave now, your progress will be lost and nothing will be saved."
        confirmText="Leave Page"
        cancelText="Stay Here"
        variant="warning"
      />
    </div>
  );
};

export default QuestBuild;