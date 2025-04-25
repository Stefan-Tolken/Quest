"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, CheckCircle } from "lucide-react";
import { QuestInfo } from "./components/QuestInfo";
import { ArtifactList } from "./components/ArtifactList";
import { ArtifactSearch } from "./components/ArtifactSearch";
import { HintsSection } from "./components/HintSection";
import { PrizeSection } from "./components/PrizeSection";
import { DateRange } from "react-day-picker";

// Type definitions
type Hint = {
  description: string;
  displayAfterAttempts: number;
};

type HintDisplayMode = "sequential" | "random";

type Artifact = {
  id: string;
  name: string;
  description?: string;
  hints: Hint[];
  hintDisplayMode: HintDisplayMode;
};

type QuestType = "sequential" | "concurrent";

type Quest = {
  title: string;
  description: string;
  artifacts: Artifact[];
  questType: QuestType;
  dateRange?: DateRange;
  prize?: {
    title: string;
    description: string;
    image?: File | null;
    imagePreview?: string;
  };
};

// Mock data for demonstration
const mockArtifacts = [
  {
    id: "art1",
    name: "Ancient Sword",
    description: "A mysterious sword from a forgotten era",
  },
  {
    id: "art2",
    name: "Crystal Orb",
    description: "A magical orb that shows visions of the past",
  },
  {
    id: "art3",
    name: "Dragon Scale",
    description: "A scale from the legendary dragon Fafnir",
  },
  {
    id: "art4",
    name: "Enchanted Amulet",
    description: "Amulet with protective powers",
  },
  { id: "art5", name: "Golden Key", description: "Opens ancient doors" },
  {
    id: "art6",
    name: "Magic Scroll",
    description: "Contains forgotten spells",
  },
  { id: "art7", name: "Mystic Ring", description: "Grants the wearer wisdom" },
  // Add more mock artifacts as needed
];

const QuestBuild = () => {
  const [quest, setQuest] = useState<Quest>({
    title: "",
    description: "",
    artifacts: [],
    questType: "sequential",
    dateRange: undefined,
    prize: { title: "", description: "", image: null },
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<typeof mockArtifacts>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showPrize, setShowPrize] = useState(false);
  const [activeArtifactIndex, setActiveArtifactIndex] = useState<number | null>(
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

  // Search artifacts whenever search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults([]);
      return;
    }

    const filteredResults = mockArtifacts.filter(
      (artifact) =>
        artifact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (artifact.description &&
          artifact.description
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
    setQuest((prev) => ({ ...prev, dateRange }));
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

  const addArtifact = (artifact: (typeof mockArtifacts)[0]) => {
    if (quest.artifacts.some((a) => a.id === artifact.id)) {
      return; // Prevent adding duplicates
    }

    const newArtifact: Artifact = {
      ...artifact,
      hints: [],
      hintDisplayMode: "sequential", // Default to sequential hints
    };

    setQuest((prev) => ({
      ...prev,
      artifacts: [...prev.artifacts, newArtifact],
    }));

    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);

    // Validate artifacts count
    validateArtifactsCount([...quest.artifacts, newArtifact]);
  };

  const validateArtifactsCount = (artifacts: Artifact[]) => {
    setValidationErrors((prev) => {
      const newErrors = { ...prev };

      if (artifacts.length < 1) {
        newErrors.artifacts = "At least one artifact is required";
      } else {
        delete newErrors.artifacts;
      }

      return newErrors;
    });
  };

  const removeArtifact = (index: number) => {
    const updatedArtifacts = quest.artifacts.filter((_, i) => i !== index);
    setQuest((prev) => ({ ...prev, artifacts: updatedArtifacts }));
    validateArtifactsCount(updatedArtifacts);

    if (activeArtifactIndex === index) {
      setActiveArtifactIndex(null);
    } else if (activeArtifactIndex !== null && activeArtifactIndex > index) {
      // Adjust active index after deletion
      setActiveArtifactIndex(activeArtifactIndex - 1);
    }
  };

  const moveArtifact = (index: number, direction: "up" | "down") => {
    if (quest.questType !== "sequential") return;

    const newIndex = direction === "up" ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= quest.artifacts.length) return;

    setQuest((prev) => {
      const newArtifacts = [...prev.artifacts];
      const temp = newArtifacts[index];
      newArtifacts[index] = newArtifacts[newIndex];
      newArtifacts[newIndex] = temp;
      return { ...prev, artifacts: newArtifacts };
    });

    // Update active artifact index if it was moved
    if (activeArtifactIndex === index) {
      setActiveArtifactIndex(newIndex);
    } else if (activeArtifactIndex === newIndex) {
      setActiveArtifactIndex(index);
    }
  };

  const reorderArtifacts = (newArtifactsOrder: Artifact[]) => {
    setQuest((prev) => {
      return {
        ...prev,
        artifacts: newArtifactsOrder,
      };
    });
  };

  const toggleArtifactDetails = (index: number) => {
    setActiveArtifactIndex(activeArtifactIndex === index ? null : index);
    setCurrentHint({ description: "", displayAfterAttempts: 1 });
  };

  const toggleHintDisplayMode = (artifactIndex: number) => {
    setQuest((prev) => {
      const updatedArtifacts = [...prev.artifacts];
      const currentMode = updatedArtifacts[artifactIndex].hintDisplayMode;
      updatedArtifacts[artifactIndex] = {
        ...updatedArtifacts[artifactIndex],
        hintDisplayMode: currentMode === "sequential" ? "random" : "sequential",
      };
      return { ...prev, artifacts: updatedArtifacts };
    });
  };

  const handleAddHint = (artifactIndex: number) => {
    if (!currentHint.description.trim()) return;

    setQuest((prev) => {
      const updatedArtifacts = [...prev.artifacts];
      // Create a new copy of the artifact and its hints array
      const updatedArtifact = {
        ...updatedArtifacts[artifactIndex],
        hints: [
          ...updatedArtifacts[artifactIndex].hints,
          {
            ...currentHint,
            displayAfterAttempts:
              updatedArtifacts[artifactIndex].hints.length + 1,
          },
        ],
      };

      updatedArtifacts[artifactIndex] = updatedArtifact;
      return { ...prev, artifacts: updatedArtifacts };
    });

    setCurrentHint({ description: "", displayAfterAttempts: 1 });
  };

  const removeHint = (artifactIndex: number, hintIndex: number) => {
    setQuest((prev) => {
      const updatedArtifacts = [...prev.artifacts];
      // Remove the hint
      const newHints = updatedArtifacts[artifactIndex].hints.filter(
        (_, i) => i !== hintIndex
      );

      // Reorder remaining hints
      const reorderedHints = newHints.map((hint, i) => ({
        ...hint,
        displayAfterAttempts: i + 1,
      }));

      updatedArtifacts[artifactIndex] = {
        ...updatedArtifacts[artifactIndex],
        hints: reorderedHints,
      };

      return { ...prev, artifacts: updatedArtifacts };
    });
  };

  const moveHint = (
    artifactIndex: number,
    hintIndex: number,
    direction: "up" | "down"
  ) => {
    const newHintIndex = direction === "up" ? hintIndex - 1 : hintIndex + 1;

    if (
      newHintIndex < 0 ||
      newHintIndex >= quest.artifacts[artifactIndex].hints.length
    ) {
      return;
    }

    setQuest((prev) => {
      const updatedArtifacts = [...prev.artifacts];
      const hints = [...updatedArtifacts[artifactIndex].hints];

      // Swap the hints
      const temp = hints[hintIndex];
      hints[hintIndex] = hints[newHintIndex];
      hints[newHintIndex] = temp;

      // Update display order
      const reorderedHints = hints.map((hint, i) => ({
        ...hint,
        displayAfterAttempts: i + 1,
      }));

      updatedArtifacts[artifactIndex] = {
        ...updatedArtifacts[artifactIndex],
        hints: reorderedHints,
      };

      return { ...prev, artifacts: updatedArtifacts };
    });
  };

  const reorderHints = (artifactIndex: number, newHintsOrder: any[]) => {
    setQuest((prev) => {
      const updatedArtifacts = [...prev.artifacts];

      // Update display order
      const reorderedHints = newHintsOrder.map((hint, i) => ({
        ...hint,
        displayAfterAttempts: i + 1,
      }));

      updatedArtifacts[artifactIndex] = {
        ...updatedArtifacts[artifactIndex],
        hints: reorderedHints,
      };

      return { ...prev, artifacts: updatedArtifacts };
    });
  };

  const setQuestType = (questType: QuestType) => {
    setQuest((prev) => ({ ...prev, questType }));

    // Validate based on new quest type
    if (questType === "concurrent" && quest.artifacts.length < 3) {
      setValidationErrors((prev) => ({
        ...prev,
        questType: "Concurrent quests require at least 3 artifacts",
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

    // Generate preview URL
    const imageUrl = URL.createObjectURL(file);

    setQuest((prev) => ({
      ...prev,
      prize: {
        ...prev.prize!,
        image: file,
        imagePreview: imageUrl,
      },
    }));
  };

  const removeImage = () => {
    if (quest.prize?.imagePreview) {
      URL.revokeObjectURL(quest.prize.imagePreview);
    }

    setQuest((prev) => ({
      ...prev,
      prize: {
        ...prev.prize!,
        image: null,
        imagePreview: undefined,
      },
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];

      // Check if it's an image
      if (!file.type.match("image.*")) {
        alert("Please upload an image file");
        return;
      }

      // Generate preview URL
      const imageUrl = URL.createObjectURL(file);

      setQuest((prev) => ({
        ...prev,
        prize: {
          ...prev.prize!,
          image: file,
          imagePreview: imageUrl,
        },
      }));
    }
  };

  const handleSaveQuest = async () => {
    // Validate required fields
    const errors: Record<string, string> = {};

    if (!quest.title.trim()) errors.title = "Title is required";
    if (!quest.description.trim())
      errors.description = "Description is required";
    if (quest.artifacts.length < 1)
      errors.artifacts = "At least one artifact is required";
    if (!quest.dateRange?.from || !quest.dateRange?.to) {
      errors.dateRange = "Date range is required";
    } else if (quest.dateRange.from > quest.dateRange.to) {
      errors.dateRange = "End date must be after start date";
    }

    if (quest.questType === "concurrent" && quest.artifacts.length < 3) {
      errors.questType = "Concurrent quests require at least 3 artifacts";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      // First, upload image if present
      let imageUrl = undefined;
      if (quest.prize?.image) {
        // In a real app, you would upload to S3 or similar
        // For this example, we'll just pretend it's uploaded
        imageUrl = `https://your-bucket.s3.amazonaws.com/quest-images/${Date.now()}-${
          quest.prize.image.name
        }`;

        // In a real implementation:
        // const uploadResponse = await uploadImageToS3(quest.prize.image);
        // imageUrl = uploadResponse.url;
      }

      // Prepare quest data for submission
      const questData = {
        title: quest.title,
        description: quest.description,
        artifacts: quest.artifacts,
        questType: quest.questType,
        dateRange: quest.dateRange
          ? {
              from: quest.dateRange.from
                ? quest.dateRange.from.toISOString()
                : undefined,
              to: quest.dateRange.from
                ? quest.dateRange.from.toISOString()
                : undefined,
            }
          : undefined,
        prize: quest.prize
          ? {
              title: quest.prize.title,
              description: quest.prize.description,
              imageUrl: imageUrl,
            }
          : undefined,
      };

      // Send quest data to API
      const response = await fetch("/api/save-quest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
      if (quest.prize?.imagePreview) {
        URL.revokeObjectURL(quest.prize.imagePreview);
      }

      setQuest({
        title: "",
        description: "",
        artifacts: [],
        questType: "sequential",
        dateRange: undefined,
        prize: { title: "", description: "", image: null },
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

        {/* Artifacts Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Artifacts to Collect
            </h2>
            <button
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Plus size={18} />
              Add Artifact
            </button>
          </div>

          {showSearch && (
            <ArtifactSearch
              searchQuery={searchQuery}
              searchResults={searchResults}
              onSearchChange={setSearchQuery}
              onAddArtifact={addArtifact}
            />
          )}

          {/* Quest Type Selection */}
          {quest.artifacts.length > 0 && (
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
                    quest.artifacts.length < 3 ? "opacity-50" : ""
                  }`}
                >
                  <input
                    type="radio"
                    className="h-4 w-4 text-indigo-600"
                    checked={quest.questType === "concurrent"}
                    onChange={() => setQuestType("concurrent")}
                    disabled={quest.artifacts.length < 3}
                  />
                  <span className="ml-2">Concurrent (Any order)</span>
                  {quest.artifacts.length < 3 && (
                    <span className="ml-2 text-xs text-gray-500">
                      (Requires 3+ artifacts)
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

          <ArtifactList
            artifacts={quest.artifacts}
            questType={quest.questType}
            activeArtifactIndex={activeArtifactIndex}
            validationErrors={validationErrors}
            onRemoveArtifact={removeArtifact}
            onMoveArtifact={moveArtifact}
            onToggleDetails={toggleArtifactDetails}
            onReorderArtifacts={reorderArtifacts}
          >
            {activeArtifactIndex !== null && (
              <HintsSection
                hints={quest.artifacts[activeArtifactIndex].hints}
                hintDisplayMode={
                  quest.artifacts[activeArtifactIndex].hintDisplayMode
                }
                currentHint={currentHint}
                onToggleDisplayMode={() =>
                  toggleHintDisplayMode(activeArtifactIndex)
                }
                onAddHint={() => handleAddHint(activeArtifactIndex)}
                onRemoveHint={(hintIndex) =>
                  removeHint(activeArtifactIndex, hintIndex)
                }
                onMoveHint={(hintIndex, direction) =>
                  moveHint(activeArtifactIndex, hintIndex, direction)
                }
                onCurrentHintChange={(value) =>
                  setCurrentHint({ ...currentHint, description: value })
                }
                onReorderHints={(newOrder) =>
                  reorderHints(activeArtifactIndex, newOrder)
                }
              />
            )}
          </ArtifactList>
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
