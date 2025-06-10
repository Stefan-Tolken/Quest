"use client";

import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "./DatePickerWithRange";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

type QuestInfoProps = {
  title: string;
  description: string;
  dateRange?: DateRange;
  validationErrors: Record<string, string>;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onDateRangeChange: (dateRange: DateRange | undefined) => void;
};

export const QuestInfo = ({
  title,
  description,
  dateRange,
  validationErrors,
  onTitleChange,
  onDescriptionChange,
  onDateRangeChange,
}: QuestInfoProps) => {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(() => 
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setEnhanceError(null);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setEnhanceError("You are offline. Description enhancement will retry when connection is restored.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleEnhanceDescription = async () => {
    if (!description.trim()) return;
    
    setIsEnhancing(true);
    setEnhanceError(null);

    if (!isOnline) {
      setEnhanceError("You are offline. Description enhancement will retry when connection is restored.");
      setIsEnhancing(false);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch("/api/enhance-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description,
          title,
          type: "quest",
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again in a moment.");
        }
        if (response.status === 500) {
          throw new Error("The AI service is temporarily unavailable. Please try again in a few minutes.");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || response.statusText || "Failed to enhance description");
      }

      const { enhancedDescription } = await response.json();
      onDescriptionChange(enhancedDescription);
      setEnhanceError(null);
    } catch (error) {      console.error("Failed to enhance description:", error);
      let errorMessage = "Failed to enhance description. Please try again.";
      
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMessage = "Request timed out. Please try again.";
        } else if (error.message.includes("temporarily unavailable")) {
          errorMessage = error.message;
        } else {
          errorMessage = "The AI service is currently unavailable. Please try again later.";
        }
      }
      
      setEnhanceError(errorMessage);
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
  <div className="space-y-4 mb-8">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Quest Title
      </label>
      <input
        type="text"
        className={`w-full p-3 border rounded-lg ${
          validationErrors.title ? "border-red-500" : "border-gray-300"
        }`}
        placeholder="Enter an epic quest title..."
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
      />
      {validationErrors.title && (
        <p className="mt-1 text-sm text-red-500">{validationErrors.title}</p>
      )}
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Quest Description
      </label>      <div className="relative">
        <textarea
          className={`w-full p-3 border rounded-lg h-32 ${
            validationErrors.description ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Describe the quest story and objectives..."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"          className="absolute right-2 top-2"
          onClick={handleEnhanceDescription}
          disabled={isEnhancing || !description.trim()}
        >
          {isEnhancing ? "Enhancing..." : "Enhance Description"}
        </Button>
      </div>
      {validationErrors.description && (
        <p className="mt-1 text-sm text-red-500">
          {validationErrors.description}
        </p>
      )}
      {enhanceError && (
        <p className="mt-1 text-sm text-red-500">
          {enhanceError}
        </p>
      )}
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Quest Duration
      </label>
      <DatePickerWithRange
        dateRange={dateRange}
        onDateRangeChange={onDateRangeChange}
      />
      {validationErrors.dateRange && (
        <p className="mt-1 text-sm text-red-500">
          {validationErrors.dateRange}
        </p>
      )}
    </div>
  </div>
);
}
