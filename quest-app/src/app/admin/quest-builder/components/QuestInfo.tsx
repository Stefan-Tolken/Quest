"use client";

import { DateRange } from "@/lib/types";
import { DatePickerWithRange } from "./DatePickerWithRange";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

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

  const handleEnhanceDescription = async () => {
    if (!description.trim()) return;
    
    setIsEnhancing(true);

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

      clearTimeout(timeoutId);      
      if (!response.ok) {
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

      console.log(errorMessage);
    } finally {
      setIsEnhancing(false);
    }
  };

  
  return(
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">
            Quest Title
          </label>
          <Input
            type="text"
            placeholder="Enter an epic quest title..."
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className={`w-full h-14 border placeholder:text-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base p-4 ${
              validationErrors.title ? "border-red-500" : "border-gray-300"
            }`}
          />
          {validationErrors.title && (
            <p className="mt-2 text-sm text-red-600">{validationErrors.title}</p>
          )}
        </div>

        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">
            Quest Description
          </label>          <div className="space-y-2">
            <textarea
              placeholder="Describe the quest story and objectives..."
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className={`w-full placeholder:text-gray-400 p-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none text-base ${
                validationErrors.description ? "border-red-500" : "border-gray-300"
              }`}
            />
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleEnhanceDescription}
                disabled={isEnhancing || !description.trim()}
              >
                {isEnhancing ? "Enhancing..." : "Enhance Description"}
              </Button>
            </div>
          </div>
          {validationErrors.description && (
            <p className="mt-2 text-sm text-red-600">
              {validationErrors.description}
            </p>
          )}
        </div>

        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">
            Quest Duration
          </label>
          <DatePickerWithRange
            dateRange={dateRange}
            onDateRangeChange={onDateRangeChange}
          />
          {validationErrors.dateRange && (
            <p className="mt-2 text-sm text-red-600">
              {validationErrors.dateRange}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}