"use client";
import { useState } from "react";
import Image from "next/image";

interface ImageEditorProps {
  imageUrl: string;
  points: Array<{ x: number; y: number }>;
  texts: Array<string>;
  onSave: (
    points: Array<{ x: number; y: number }>,
    texts: Array<string>
  ) => void;
  onClose: () => void;
}

export const ImageEditor = ({
  imageUrl,
  points,
  texts,
  onSave,
  onClose,
}: ImageEditorProps) => {
  const [currentPoints, setCurrentPoints] = useState([...points]);
  const [currentTexts, setCurrentTexts] = useState([...texts]);
  const [currentText, setCurrentText] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCurrentPoints([...currentPoints, { x, y }]);
    setCurrentTexts([...currentTexts, ""]);
    setSelectedIndex(currentTexts.length);
    setCurrentText("");
  };

  const handleSaveText = () => {
    if (selectedIndex === null) return;
    const newTexts = [...currentTexts];
    newTexts[selectedIndex] = currentText;
    setCurrentTexts(newTexts);
    setCurrentText("");
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Image Editor</h1>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
      >
        Close
      </button>
      <div className="relative w-full aspect-video border rounded-lg overflow-hidden">
        <Image
          src={imageUrl}
          alt="Edit points"
          fill
          className="object-contain"
          onClick={handleImageClick}
        />
        {currentPoints.map((point, index) => (
          <div
            key={index}
            className="absolute w-5 h-5 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIndex(index);
              setCurrentText(currentTexts[index] || "");
            }}
          />
        ))}
      </div>

      <div className="mt-6 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-4">Point Details</h2>
        <textarea
          value={currentText}
          onChange={(e) => setCurrentText(e.target.value)}
          className="w-full p-2 border rounded mb-4"
          placeholder="Enter point description"
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={handleSaveText}
          disabled={selectedIndex === null}
        >
          Save Text
        </button>
      </div>

      <div className="mt-4 flex justify-end gap-4">
        <button
          className="bg-gray-500 text-white px-4 py-2 rounded"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => onSave(currentPoints, currentTexts)}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};
