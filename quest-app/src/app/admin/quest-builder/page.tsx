"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, CheckCircle, ArrowLeft, Check } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { QuestInfo } from "./components/QuestInfo";
import { ArtefactList } from "./components/ArtefactList";
import { ArtefactSearch } from "./components/ArtefactSearch";
import { HintsSection } from "./components/HintSection";
import { PrizeSection } from "./components/PrizeSection";
import { Button } from "@/components/ui/button";
import type { QuestArtefact, Quest } from "@/lib/types";
import type { Artefact, DateRange } from "@/lib/types";

const QuestBuild = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;
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
  const [showSearch, setShowSearch] = useState(false);
  const [showPrize, setShowPrize] = useState(false);
  const [activeArtefactIndex, setActiveArtefactIndex] = useState<number | null>(null);
  const [currentHint, setCurrentHint] = useState({
    description: "",
    displayAfterAttempts: 1,
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setImagePreview("");
      setImageFile(null);
      setActiveArtefactIndex(null);
      setValidationErrors({});
    };

    const loadQuestData = async () => {
      if (!editId) {
        setIsLoading(false);
        return;
      }
      
      try {
        resetState();
        setIsLoading(true);

        console.log('Fetching quest data for ID:', editId);
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

        // Fetch artefact details for each artefact in the quest
        const artefactsWithDetails = await Promise.all(
          questToEdit.artefacts.map(async (artefact: QuestArtefact) => {
            try {
              console.log('Fetching artefact details for:', artefact.artefactId);
              const artefactResponse = await fetch(`/api/get-artefact?id=${artefact.artefactId}`);
              
              if (!artefactResponse.ok) {
                console.error('Failed to fetch artefact details for:', artefact.artefactId);
                return artefact;
              }
              
              const artefactData = await artefactResponse.json();
              console.log('Artefact details:', artefactData);
              return {
                ...artefact,
                details: artefactData.artefact || artefactData.artefacts?.[0]
              };
            } catch (error) {
              console.error('Error fetching artefact details:', error);
              return artefact;
            }
          })
        );
        
        console.log('Final quest data with artefact details:', {
          ...questToEdit,
          artefacts: artefactsWithDetails
        });
        
        setQuest({
          ...questToEdit,
          artefacts: artefactsWithDetails
        });
        
        if (questToEdit.prize?.image) {
          setImagePreview(questToEdit.prize.image);
        }
      } catch (error) {
        console.error('Error loading quest:', error);
        alert(`Failed to load quest data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

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
    setImagePreview("");
    setImageFile(null);

    if (editId) loadQuestData();
    else setIsLoading(false);
  }, [editId]);

  // Search artefacts whenever search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults([]);
      return;
    }

    const searchArtefacts = async () => {
      const artefacts = await fetchArtefacts();
      const filteredResults = artefacts.filter(
        (artefact: Artefact) =>
          artefact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (artefact.description &&
            artefact.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setSearchResults(filteredResults);
    };

    searchArtefacts();
  }, [searchQuery]);

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
    setValidationErrors((prev) => ({
      ...prev,
      dateRange:
        !dateRange?.from || !dateRange?.to
          ? "Date range is required"
          : dateRange.from > dateRange.to
          ? "End date must be after start date"
          : "",
    }));
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

    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);

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
            displayAfterAttempts: updatedArtefacts[artefactIndex].hints.length + 1,
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

      const reorderedHints = newHints.map((hint, i) => ({
        ...hint,
        displayAfterAttempts: i + 1,
      }));

      updatedArtefacts[artefactIndex] = {
        ...updatedArtefacts[artefactIndex],
        hints: reorderedHints,
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

      const reorderedHints = hints.map((hint, i) => ({
        ...hint,
        displayAfterAttempts: i + 1,
      }));

      updatedArtefacts[artefactIndex] = {
        ...updatedArtefacts[artefactIndex],
        hints: reorderedHints,
      };

      return { ...prev, artefacts: updatedArtefacts };
    });
  };

  const reorderHints = (
    artefactIndex: number,
    newHintsOrder: { description: string; displayAfterAttempts: number }[]
  ) => {
    setQuest((prev) => {
      const updatedArtefacts = [...prev.artefacts];

      const reorderedHints = newHintsOrder.map((hint, i) => ({
        ...hint,
        displayAfterAttempts: i + 1,
      }));

      updatedArtefacts[artefactIndex] = {
        ...updatedArtefacts[artefactIndex],
        hints: reorderedHints,
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
    URL.revokeObjectURL(imagePreview);
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
        questData["quest_id"] = editId;
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

      alert(isEditMode ? "Quest updated successfully!" : "Quest created successfully!");
      router.push('/admin');
    } catch (error) {
      console.error("Error saving quest:", error);
      alert(
        `Failed to save quest: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin');
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
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading quest data...</p>
            </div>
          </div>
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

              {/* Artefacts Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-semibold">
                    Artefacts to Collect <span className="text-red-500">*</span>
                  </h2>
                  <Button
                    onClick={() => setShowSearch(!showSearch)}
                    className="flex items-center gap-2 hover:cursor-pointer"
                  >
                    <Plus size={18} />
                    Add Artefact
                  </Button>
                </div>

                {showSearch && (
                  <ArtefactSearch
                    searchQuery={searchQuery}
                    searchResults={searchResults}
                    onSearchChange={setSearchQuery}
                    onAddArtifact={addArtefact}
                  />
                )}

                {/* Quest Type Selection */}
                {quest.artefacts.length > 0 && (
                  <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <label className="block text-lg font-medium text-gray-700 mb-3">
                      Quest Type
                    </label>
                    <div className="flex gap-6">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          checked={quest.questType === "sequential"}
                          onChange={() => setQuestType("sequential")}
                        />
                        <span className="ml-3 text-base">Sequential (Story-based order)</span>
                      </label>
                      <label
                        className={`flex items-center cursor-pointer ${
                          quest.artefacts.length < 3 ? "opacity-50" : ""
                        }`}
                      >
                        <input
                          type="radio"
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          checked={quest.questType === "concurrent"}
                          onChange={() => setQuestType("concurrent")}
                          disabled={quest.artefacts.length < 3}
                        />
                        <span className="ml-3 text-base">Concurrent (Any order)</span>
                        {quest.artefacts.length < 3 && (
                          <span className="ml-2 text-sm text-gray-500">
                            (Requires 3+ artefacts)
                          </span>
                        )}
                      </label>
                    </div>
                    {validationErrors.questType && (
                      <p className="mt-2 text-sm text-red-600">
                        {validationErrors.questType}
                      </p>
                    )}
                  </div>
                )}

                <ArtefactList
                  artifacts={quest.artefacts}
                  questType={quest.questType}
                  activeArtifactIndex={activeArtefactIndex}
                  validationErrors={validationErrors}
                  onRemoveArtifact={removeArtefact}
                  onMoveArtifact={moveArtefact}
                  onToggleDetails={toggleArtefactDetails}
                  onReorderArtifacts={reorderArtefacts}
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
                </ArtefactList>
              </div>

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
                  <Check size={18} />
                  {isEditMode ? "Save Changes" : "Create Quest"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestBuild;