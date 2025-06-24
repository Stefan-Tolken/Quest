"use client";

import Image from "next/image";
import { Award, Upload, X, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";

type Prize = {
  title?: string;
  description?: string;
  image?: string;
};

interface UploadProgress {
  progress: number;
  status: string;
  isUploading: boolean;
}

type PrizeSectionProps = {
  showPrize: boolean;
  prize: Prize;
  imagePreview: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  uploadProgress: UploadProgress; // Add this prop
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
  uploadProgress,
  onTogglePrize,
  onSetPrize,
  onImageUpload,
  onRemoveImage,
  onDragOver,
  onDrop,
}: PrizeSectionProps) => {
  // Use imagePreview if available (for new uploads), otherwise use the prize.image from database
  const displayImage = imagePreview || prize.image;

  return (
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
                disabled={uploadProgress.isUploading}
              />

              {displayImage ? (
                <div className="relative w-full h-64 border border-gray-300 rounded-lg overflow-hidden bg-white">
                  <Image
                    src={displayImage}
                    alt="Prize preview"
                    fill
                    className="object-contain"
                    onError={(e) => {
                      console.error('Error loading prize image:', e);
                    }}
                  />
                  {!uploadProgress.isUploading && (
                    <button
                      type="button"
                      className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                      onClick={onRemoveImage}
                    >
                      <X size={16} />
                    </button>
                  )}

                  {/* Upload Progress Overlay */}
                  {uploadProgress.isUploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <div className="bg-white rounded-lg p-4 max-w-xs w-full mx-4">
                        <div className="text-center mb-3">
                          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          <p className="text-sm font-medium text-gray-700">Uploading Prize Image</p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-600 text-center">{uploadProgress.status}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className={`w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors bg-white ${
                    uploadProgress.isUploading ? 'pointer-events-none' : ''
                  }`}
                  onClick={() => {
                    if (!uploadProgress.isUploading) {
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                >
                  {uploadProgress.isUploading ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <div className="text-center">
                        <p className="font-medium text-gray-700 mb-1">Uploading Prize Image</p>
                        <div className="w-48 bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress.progress}%` }}
                          />
                        </div>
                        <p className="text-sm text-gray-600">{uploadProgress.status}</p>
                        <p className="text-xs text-gray-500">{uploadProgress.progress}% complete</p>
                      </div>
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};