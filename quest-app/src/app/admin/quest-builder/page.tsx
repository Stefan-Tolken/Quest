"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, CheckCircle } from "lucide-react";
import { QuestInfo } from "./components/QuestInfo";
import { ArtefactList } from "./components/ArtefactList";
import { ArtefactSearch } from "./components/ArtefactSearch";
import { HintsSection } from "./components/HintSection";
import { PrizeSection } from "./components/PrizeSection";
import { DateRange } from "react-day-picker";
import type { QuestArtefact, Quest } from "@/lib/types";

// Mock data for demonstration
const mockArtefacts = [
  {
    id: "art1",
    name: "Ancient Sword",
    description: "A mysterious sword from a forgotten era",
  },
];

const QuestBuild = () => {
  const [quest, setQuest] = useState<Quest>({
    quest_id: "",
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

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<typeof mockArtefacts>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showPrize, setShowPrize] = useState(false);
  const [activeArtefactIndex, setActiveArtefactIndex] = useState<number | null>(
    null
  );
  const [currentHint, setCurrentHint] = useState({
    description: "",
    displayAfterAttempts: 1,
  });
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search artefacts whenever search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults([]);
      return;
    }

    const filteredResults = mockArtefacts.filter(
      (artefact) =>
        artefact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (artefact.description &&
          artefact.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()))
    );

    setSearchResults(filteredResults);
  }, [searchQuery]);

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
        newErrors[field] = `${
          field.charAt(0).toUpperCase() + field.slice(1)
        } is required`;
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

  const addArtefact = (artefact: (typeof mockArtefacts)[0]) => {
    if (quest.artefacts.some((a) => a.artefactId === artefact.id)) {
      return; // Prevent adding duplicates
    }

    const newArtefact: QuestArtefact = {
      artefactId: artefact.id,
      hints: [],
      hintDisplayMode: "sequential",
    };

    setQuest((prev) => ({
      ...prev,
      artifacts: [...prev.artefacts, newArtefact],
    }));

    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);

    // Validate artefacts count
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
      // Adjust active index after deletion
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

    // Update active artefact index if it was moved
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

  const toggleHintDisplayMode = (artefactIndex: number) => {
    setQuest((prev) => {
      const updatedArtefacts = [...prev.artefacts];
      const currentMode = updatedArtefacts[artefactIndex].hintDisplayMode;
      updatedArtefacts[artefactIndex] = {
        ...updatedArtefacts[artefactIndex],
        hintDisplayMode: currentMode === "sequential" ? "random" : "sequential",
      };
      return { ...prev, artefacts: updatedArtefacts };
    });
  };

  const handleAddHint = (artefactIndex: number) => {
    if (!currentHint.description.trim()) return;

    setQuest((prev) => {
      const updatedArtefacts = [...prev.artefacts];
      // Create a new copy of the artefact and its hints array
      const updatedArtefact = {
        ...updatedArtefacts[artefactIndex],
        hints: [
          ...updatedArtefacts[artefactIndex].hints,
          {
            ...currentHint,
            displayAfterAttempts:
              updatedArtefacts[artefactIndex].hints.length + 1,
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
      // Remove the hint
      const newHints = updatedArtefacts[artefactIndex].hints.filter(
        (_, i) => i !== hintIndex
      );

      // Reorder remaining hints
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

    if (
      newHintIndex < 0 ||
      newHintIndex >= quest.artefacts[artefactIndex].hints.length
    ) {
      return;
    }

    setQuest((prev) => {
      const updatedArtefacts = [...prev.artefacts];
      const hints = [...updatedArtefacts[artefactIndex].hints];

      // Swap the hints
      const temp = hints[hintIndex];
      hints[hintIndex] = hints[newHintIndex];
      hints[newHintIndex] = temp;

      // Update display order
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

  const reorderHints = (artefactIndex: number, newHintsOrder: any[]) => {
    setQuest((prev) => {
      const updatedArtefacts = [...prev.artefacts];

      // Update display order
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

    // Validate based on new quest type
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
    // Validate required fields
    const errors: Record<string, string> = {};

    if (!quest.title.trim()) errors.title = "Title is required";
    if (!quest.description.trim())
      errors.description = "Description is required";
    if (quest.artefacts.length < 1)
      errors.artefacts = "At least one artefact is required";
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
      // Convert image to base64 if present
      let imageUrl = quest.prize?.image || "";

      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);

        const uploadResponse = await fetch("/api/upload-image", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) throw new Error("Image upload failed");

        const { imageUrl: uploadedUrl } = await uploadResponse.json();
        imageUrl = uploadedUrl;
      }

      // Prepare quest data for submission
      const questData = {
        ...quest,
        prize: quest.prize
          ? {
              ...quest.prize,
              image: imageUrl,
            }
          : undefined,
      };

      // Send quest data to API
      const response = await fetch("/api/save-quest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(questData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save quest");
      }

      const result = await response.json();
      console.log("Quest saved successfully:", result);

      // Show success message
      alert("Quest saved successfully!");

      // Reset form
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setImageFile(null);
      setImagePreview("");

      setQuest({
        quest_id: "",
        title: "",
        description: "",
        artefacts: [],
        questType: "sequential",
        dateRange: undefined,
        prize: { title: "", description: "", image: "" },
        createdAt: new Date().toISOString(),
      });

      setShowPrize(false);
      setValidationErrors({});
    } catch (error) {
      console.error("Error saving quest:", error);
      alert(
        `Failed to save quest: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6 text-indigo-700">
          Quest Builder
        </h1>

        <QuestInfo
          title={quest.title}
          description={quest.description}
          dateRange={quest.dateRange}
          validationErrors={validationErrors}
          onTitleChange={handleSetTitle}
          onDescriptionChange={handleSetDescription}
          onDateRangeChange={handleDateRangeChange}
        />

        {/* Artefacts Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Artefacts to Collect
            </h2>
            <button
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Plus size={18} />
              Add Artefact
            </button>
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
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quest Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    className="h-4 w-4 text-indigo-600"
                    checked={quest.questType === "sequential"}
                    onChange={() => setQuestType("sequential")}
                  />
                  <span className="ml-2">Sequential (Story-based order)</span>
                </label>
                <label
                  className={`flex items-center cursor-pointer ${
                    quest.artefacts.length < 3 ? "opacity-50" : ""
                  }`}
                >
                  <input
                    type="radio"
                    className="h-4 w-4 text-indigo-600"
                    checked={quest.questType === "concurrent"}
                    onChange={() => setQuestType("concurrent")}
                    disabled={quest.artefacts.length < 3}
                  />
                  <span className="ml-2">Concurrent (Any order)</span>
                  {quest.artefacts.length < 3 && (
                    <span className="ml-2 text-xs text-gray-500">
                      (Requires 3+ artefacts)
                    </span>
                  )}
                </label>
              </div>
              {validationErrors.questType && (
                <p className="mt-1 text-sm text-red-500">
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
                onToggleDisplayMode={() =>
                  toggleHintDisplayMode(activeArtefactIndex)
                }
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

        <PrizeSection
          showPrize={showPrize}
          prize={quest.prize}
          fileInputRef={fileInputRef}
          onTogglePrize={() => setShowPrize(!showPrize)}
          onSetPrize={handleSetPrize}
          onImageUpload={handleImageUpload}
          onRemoveImage={removeImage}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
            onClick={handleSaveQuest}
          >
            <CheckCircle size={18} />
            Save Quest
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestBuild;
