// app/admin/page-builder/components/ParagraphComponent.tsx
"use client";
import { useState } from "react";
import { FileText } from "lucide-react";

interface ParagraphProps {
  content: string;
  onUpdate: (content: string) => void;
}

export const ParagraphComponent = ({ content, onUpdate }: ParagraphProps) => {
  const [localContent, setLocalContent] = useState(content);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div>
      {/* Component Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-shrink-0 w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
          <FileText size={16} className="text-green-600" />
        </div>
        <div className="flex-1">
          <h5 className="font-medium text-gray-900 text-sm">Paragraph</h5>
        </div>
      </div>

      {/* Textarea Field */}
      <div className="relative">
        <textarea
          value={localContent}
          onChange={(e) => setLocalContent(e.target.value)}
          onBlur={() => {
            onUpdate(localContent);
            setIsFocused(false);
          }}
          onFocus={() => setIsFocused(true)}
          className={`w-full h-32 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 resize-vertical ${
            isFocused ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'
          }`}
          placeholder="Enter paragraph content..."
        />
      </div>

      {/* Character Count */}
      <div className="flex justify-end mt-2">
        <span className="text-xs text-gray-500">
          {localContent.length} characters
        </span>
      </div>

      {/* Hover State Enhancement */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-green-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-all duration-200 -z-10" />
    </div>
  );
};