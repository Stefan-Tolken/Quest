"use client";

import Image from "next/image";
import { Award, Upload, X, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";

type Prize = {
  title?: string;
  description?: string;
  imagePreview?: string;
};

type PrizeSectionProps = {
  showPrize: boolean;
  prize: Prize;
  imagePreview: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onTogglePrize: () => void;
  onSetPrize: (field: "title" | "description", value: string) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
};

export const PrizeSection = ({
  showPrize,
  prize,
  imagePreview,
  fileInputRef,
  onTogglePrize,
  onSetPrize,
  onImageUpload,
  onRemoveImage,
  onDragOver,
  onDrop,
}: PrizeSectionProps) => (
  <div>
    <button
      className="flex items-center gap-3 mb-4 text-blue-600 font-medium hover:text-blue-700 transition-colors p-2 -m-2 rounded-md hover:bg-blue-50"
      onClick={onTogglePrize}
    >
      <Award size={20} />
      <span className="text-base">{showPrize ? "Hide Prize Details" : "Add Prize Details"}</span>
      {showPrize ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
    </button>

    {showPrize && (
      <div className="p-6 border border-gray-200 rounded-lg bg-gray-50 space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              Prize Title
            </label>
            <Input
              type="text"
              placeholder="What will the player win?"
              value={prize.title || ""}
              onChange={(e) => onSetPrize("title", e.target.value)}
              className="w-full h-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 text-base p-4"
            />
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              Prize Description
            </label>
            <textarea
              className="w-full placeholder:text-gray-400 p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none text-base"
              placeholder="Describe the prize in detail..."
              value={prize.description || ""}
              onChange={(e) => onSetPrize("description", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              Prize Image
            </label>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={onImageUpload}
            />

            {imagePreview ? (
              <div className="relative w-full h-64 border border-gray-300 rounded-lg overflow-hidden bg-white">
                <Image
                  src={imagePreview}
                  alt="Prize preview"
                  fill
                  className="object-contain"
                />
                <button
                  type="button"
                  className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                  onClick={onRemoveImage}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div
                className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors bg-white"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={onDragOver}
                onDrop={onDrop}
              >
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Upload size={24} className="text-gray-400" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-700 mb-1">
                    Drag and drop or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
  </div>
);