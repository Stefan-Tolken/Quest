"use client";

import { DateRange } from "@/lib/types";
import { DatePickerWithRange } from "./DatePickerWithRange";
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
}: QuestInfoProps) => (
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
        </label>
        <div className="relative">
          <textarea
            placeholder="Describe the quest story and objectives..."
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            className={`w-full placeholder:text-gray-400 p-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none text-base ${
              validationErrors.description ? "border-red-500" : "border-gray-300"
            }`}
          />
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