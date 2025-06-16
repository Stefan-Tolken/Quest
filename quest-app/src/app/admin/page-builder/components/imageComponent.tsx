"use client";

import { useCallback, useRef, useState } from "react";
import { ImageContent } from "@/lib/types";
import { Image as ImageIcon, Upload, Edit3 } from "lucide-react";
import Image from "next/image";

export const ImageComponent = ({
  content,
  onUpdate,
  onEditPoints,
}: {
  content: ImageContent;
  onUpdate: (content: ImageContent) => void;
  onEditPoints: () => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        onUpdate({
          ...content,
          url: e.target?.result as string,
        });
      };
      reader.readAsDataURL(file);
    },
    [content, onUpdate]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file?.type.startsWith("image/")) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      {/* Component Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-shrink-0 w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition-colors">
          <ImageIcon size={16} className="text-purple-600" />
        </div>
        <div className="flex-1">
          <h5 className="font-medium text-gray-900 text-sm">Interactive Image</h5>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
      />

      {/* Image Upload Area */}
      <div
        className={`relative w-full aspect-video border-2 rounded-lg cursor-pointer transition-all duration-200 ${
          isDragging
            ? "border-purple-500 bg-purple-50"
            : content.url
            ? "border-gray-200"
            : "border-dashed border-gray-300 hover:border-purple-400 hover:bg-purple-50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {content.url ? (
          <div className="relative w-full h-full">
            <Image
              src={content.url}
              alt="Preview"
              fill
              className="object-contain rounded-md"
            />
            {/* Overlay on hover */}
            <div className="absolute opacity-0 inset-0 bg-transparent hover:opacity-100 hover:bg-black/20 transition-all duration-200 rounded-md flex items-center justify-center group">
              <div className="invisible group-hover:visible bg-white rounded-lg p-2 shadow-lg">
                {Upload && <Upload size={20} className="text-gray-600" />}
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-500">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <ImageIcon size={24} className="text-gray-400" />
            </div>
            <div className="text-center">
              <p className="font-medium">Click to select or drag & drop image</p>
              <p className="text-sm text-gray-400 mt-1">Supports JPG, PNG, GIF up to 10MB</p>
            </div>
          </div>
        )}

        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-purple-50 border-2 border-purple-400 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <Upload size={32} className="text-purple-600" />
              <span className="text-purple-700 font-medium">Drop image here</span>
            </div>
          </div>
        )}
      </div>

      {/* Edit Points Button */}
      {content.url && (
        <div className="mt-4">
          <button
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            onClick={onEditPoints}
          >
            <Edit3 size={16} />
            Edit Hotspots
          </button>
        </div>
      )}

      {/* Hover State Enhancement */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-all duration-200 -z-10" />
    </div>
  );
};