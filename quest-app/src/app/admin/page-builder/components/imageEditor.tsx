"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface ImageEditorProps {
  imageUrl: string;
  points: Array<{ id: string; x: number; y: number; text: string }>;
  onSave: (
    points: Array<{ id: string; x: number; y: number; text: string }>
  ) => void;
  onClose: () => void;
}

export const ImageEditor = ({
  imageUrl,
  points,
  onSave,
  onClose,
}: ImageEditorProps) => {
  const [currentPoints, setCurrentPoints] = useState([...points]);
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [currentText, setCurrentText] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newPoint = {
      id: crypto.randomUUID(),
      x,
      y,
      text: "",
    };
    setCurrentPoints([...currentPoints, newPoint]);
    setSelectedIndex(currentPoints.length);
    setCurrentText("");
    setIsTextModalOpen(true);
  };

  useEffect(() => {
    if (selectedIndex !== null) {
      setCurrentText(currentPoints[selectedIndex]?.text || "");
    }
  }, [selectedIndex, currentPoints]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentText(e.target.value);
  };

  const handleSaveText = () => {
    if (selectedIndex === null) return;

    const newPoints = [...currentPoints];
    newPoints[selectedIndex].text = currentText;

    if (!currentText.trim()) {
      newPoints.splice(selectedIndex, 1);
    }

    setCurrentPoints(newPoints);
    setIsTextModalOpen(false);
  };

  const handleCancelText = () => {
    if (selectedIndex !== null && currentPoints[selectedIndex]?.text === "") {
      setCurrentPoints(currentPoints.filter((_, i) => i !== selectedIndex));
    }
    setIsTextModalOpen(false);
  };

  const handleEditText = (index: number) => {
    setSelectedIndex(index);
    setCurrentText(currentPoints[index]?.text || "");
    setIsTextModalOpen(true);
  };

  // Enable body scrolling when modal is closed, disable when open
  useEffect(() => {
    if (isTextModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isTextModalOpen]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Image Editor</h1>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
      >
        Close
      </button>

      {isTextModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div
            ref={modalRef}
            className="bg-white p-6 rounded-lg w-full max-w-2xl my-8 mx-4"
            style={{ maxHeight: "calc(100vh - 4rem)" }}
          >
            <div
              className="overflow-y-auto"
              style={{ maxHeight: "calc(100vh - 8rem)" }}
            >
              <h3 className="text-lg font-semibold mb-4">Point Description</h3>
              <textarea
                value={currentText}
                onChange={handleTextChange}
                className="w-full p-4 border rounded-lg min-h-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter point description..."
              />
              <div className="flex justify-end gap-4 mt-4">
                <button
                  className="bg-gray-500 text-white px-4 py-2 rounded"
                  onClick={handleCancelText}
                >
                  Cancel
                </button>
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                  onClick={handleSaveText}
                >
                  Save Text
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-6">
        <div className="flex-1">
          <div className="relative w-full aspect-video border rounded-lg overflow-hidden">
            <Image
              src={imageUrl}
              alt="Edit points"
              fill
              className="object-contain max-h-[600px]"
              onClick={handleImageClick}
            />
            {currentPoints.map((point, index) => (
              <div
                key={point.id}
                className="absolute w-5 h-5 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1/2 cursor-pointer flex items-center justify-center text-white text-xs"
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex(index);
                  setCurrentText(point.text);
                }}
              >
                {index + 1}
              </div>
            ))}
          </div>

          {selectedIndex !== null && (
            <div className="mt-4 p-4 border rounded">
              <h2 className="text-lg font-semibold mb-4">Point Preview</h2>
              <div className="p-4 border rounded bg-gray-50 min-h-[100px]">
                {currentPoints[selectedIndex]?.text || (
                  <p className="text-gray-400">No content to preview</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 max-w-md">
          <h2 className="text-lg font-semibold mb-2">All Points</h2>
          <div className="border rounded divide-y max-h-[300px] overflow-y-auto">
            {currentPoints.map((point, index) => (
              <div
                key={point.id}
                className={`p-3 flex items-center justify-between hover:cursor-pointer hover:bg-blue-100 ${
                  selectedIndex === index ? "bg-blue-100" : ""
                }`}
                onClick={() => {
                  setSelectedIndex(index);
                  setCurrentText(currentPoints[index]?.text || "");
                }}
              >
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">
                    Point {index + 1} -{" "}
                    {currentPoints[index]?.text?.substring(0, 50)}
                    {currentPoints[index]?.text?.length > 20 ? "..." : ""}
                  </span>
                </div>
                <button
                  className="text-blue-500 hover:text-blue-700 px-2 py-1"
                  onClick={() => handleEditText(index)}
                >
                  Edit
                </button>
              </div>
            ))}
            {currentPoints.length === 0 && (
              <div className="p-3 text-center text-gray-500">
                No points added yet. Click on the image to add points.
              </div>
            )}
          </div>
        </div>
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
          onClick={() => onSave(currentPoints)}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};
