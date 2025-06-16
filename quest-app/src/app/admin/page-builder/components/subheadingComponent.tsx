// app/admin/page-builder/components/SubHeadingComponent.tsx
"use client";
import { useState } from "react";
import { Type } from "lucide-react";

interface SubHeadingProps {
  content: string;
  onUpdate: (content: string) => void;
}

export const SubHeadingComponent = ({ content, onUpdate }: SubHeadingProps) => {
  const [localContent, setLocalContent] = useState(content);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div>
      {/* Component Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
          <Type size={16} className="text-blue-600" />
        </div>
        <div className="flex-1">
          <h5 className="font-medium text-gray-900 text-sm">Subheading</h5>
        </div>
      </div>

      {/* Input Field */}
      <div className="relative">
        <input
          value={localContent}
          onChange={(e) => setLocalContent(e.target.value)}
          onBlur={() => {
            onUpdate(localContent);
            setIsFocused(false);
          }}
          onFocus={() => setIsFocused(true)}
          className={`text-xl font-semibold w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
            isFocused ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
          }`}
          placeholder="Enter subheading..."
        />
      </div>

      {/* Hover State Enhancement */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-all duration-200 -z-10" />
    </div>
  );
};