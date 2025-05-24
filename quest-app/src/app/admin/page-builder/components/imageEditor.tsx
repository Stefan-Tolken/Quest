"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash } from "lucide-react";

interface Point {
  id: string;
  x: number;
  y: number;
  text: string;
}

interface ImageEditorProps {
  imageUrl: string;
  points: Point[];
  onSave: (points: Point[]) => void;
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
  const [draggedPointIndex, setDraggedPointIndex] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Add drag and drop functionality for reordering points
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Auto-focus textarea when modal opens
  useEffect(() => {
    if (isTextModalOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isTextModalOpen]);

  // Add delete point functionality
  const handleDeletePoint = (index: number) => {
    const newPoints = currentPoints.filter((_, i) => i !== index);
    setCurrentPoints(newPoints);
    if (selectedIndex === index) setSelectedIndex(null);
  };

  // Add drag and drop reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = currentPoints.findIndex(p => p.id === active.id);
      const newIndex = currentPoints.findIndex(p => p.id === over.id);
      setCurrentPoints(arrayMove(currentPoints, oldIndex, newIndex));
    }
  };

  // Modified point rendering with drag handles and delete buttons
  const SortablePoint = ({ point, index }: { point: Point; index: number }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: point.id });
    
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`p-4 flex items-start justify-between hover:cursor-pointer transition-colors ${
          selectedIndex === index ? "bg-blue-50 border-l-4 border-blue-500" : "hover:bg-gray-50"
        }`}
        onClick={() => {
          setSelectedIndex(index);
          setCurrentText(currentPoints[index]?.text || "");
        }}
      >
        <div className="flex items-start space-x-3 flex-1">
          <div {...attributes} {...listeners} className="cursor-grab hover:text-blue-600 active:cursor-grabbing">
            <GripVertical size={16} />
          </div>
          <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-600 line-clamp-2">
              {point.text ? 
                (point.text.length > 50 ? point.text.substring(0, 50) + "..." : point.text) : 
                <span className="italic text-gray-400">No description</span>
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="text-red-500 hover:text-red-700 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              handleDeletePoint(index);
            }}
            title="Delete point"
          >
            <Trash size={16} />
          </button>
          <button
            className="text-blue-500 hover:text-blue-700 px-2 py-1 text-sm font-medium transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              handleEditText(index);
            }}
          >
            Edit
          </button>
        </div>
      </div>
    );
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent adding new points while dragging
    if (draggedPointIndex !== null) return;

    // Get the container bounds (the image container div)
    const containerRect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    const y = ((e.clientY - containerRect.top) / containerRect.height) * 100;

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

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (draggedPointIndex === null || !imageContainerRef.current) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setCurrentPoints(prev => prev.map((point, index) => 
      index === draggedPointIndex ? { ...point, x, y } : point
    ));
  }, [draggedPointIndex]);

  const handleMouseUp = () => {
    setDraggedPointIndex(null);
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

  useEffect(() => {
    if (draggedPointIndex !== null) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggedPointIndex, handleMouseMove]);

  return (
    <>
      {/* Main modal backdrop */}
      <div className="fixed inset-0 bg-gray-800 bg-opacity-50 z-50 flex items-center justify-center p-4">
        
        <div className="bg-white rounded-xl shadow-2xl w-full h-full max-w-[80vw] max-h-[80vh] min-w-[1000px] min-h-[700px] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b bg-gray-50">
            <h1 className="text-2xl font-bold text-gray-800">Image Editor</h1>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
            >
              ×
            </button>
          </div>

          {/* Main content area - now with 3 columns */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left sidebar - Preview */}
            <div className="w-80 border-r bg-gray-50 p-6 flex flex-col">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Point Preview</h2>
              <div className="flex-1 border rounded-lg bg-white overflow-hidden">
                {selectedIndex !== null ? (
                  <div className="p-4 h-full">
                    <div className="mb-2 text-sm font-medium text-gray-700">
                      Point {selectedIndex + 1} Content:
                    </div>
                    <div className="p-3 border rounded bg-gray-50 h-[calc(100%-60px)] overflow-y-auto text-sm">
                      {currentPoints[selectedIndex]?.text || (
                        <p className="text-gray-400 italic">No content to preview</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 h-full flex items-center justify-center">
                    <div>
                      <div className="text-4xl mb-2">📝</div>
                      <p className="text-sm">Select a point to preview</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Image section - updated to be taller */}
            <div className="flex-1 p-6 flex flex-col">
              <div 
                ref={imageContainerRef}
                className="flex-1 relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center cursor-crosshair"
                style={{ minHeight: "500px" }}
              >
                <div 
                  className="relative w-full h-full flex items-center justify-center"
                  onClick={handleImageClick}
                >
                  <Image
                    src={imageUrl}
                    alt="Edit points"
                    width={800}
                    height={600}
                    className="object-contain max-w-full max-h-full pointer-events-none"
                    style={{ minWidth: "300px", minHeight: "300px" }}
                  />
                  {/* Updated point display with highlighting */}
                  {currentPoints.map((point, index) => (
                    <div
                      key={point.id}
                      className={`absolute w-6 h-6 border-2 border-white rounded-full shadow-lg cursor-grab active:cursor-grabbing transition-colors ${
                        selectedIndex === index ? "bg-blue-500 hover:bg-blue-600" : "bg-red-500 hover:bg-red-600"
                      }`}
                      style={{ 
                        left: `${point.x}%`, 
                        top: `${point.y}%`,
                        transform: 'translate(-50%, -50%)',
                        touchAction: "none" 
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDraggedPointIndex(index);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIndex(index);
                        setCurrentText(point.text);
                      }}
                    >
                      <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right sidebar - Points list with drag and drop */}
            <div className="w-80 border-l bg-gray-50 p-6 flex flex-col">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Points ({currentPoints.length})</h2>
              <div className="flex-1 border rounded-lg bg-white overflow-hidden">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={currentPoints.map(p => p.id)} strategy={verticalListSortingStrategy}>
                    <div className="divide-y max-h-full overflow-y-auto">
                      {currentPoints.map((point, index) => (
                        <SortablePoint key={point.id} point={point} index={index} />
                      ))}
                      {currentPoints.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                          <div className="text-4xl mb-2">📍</div>
                          <p className="text-sm">No points added yet</p>
                          <p className="text-xs text-gray-400 mt-1">Click on the image to add points</p>
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t bg-gray-50 flex justify-end gap-4">
            <button
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              onClick={() => onSave(currentPoints)}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Text editing modal */}
      {isTextModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
          <div
            ref={modalRef}
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
          >
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-800">Edit Point Description</h3>
            </div>
            <div className="p-6 overflow-y-auto" style={{ maxHeight: "calc(80vh - 140px)" }}>
              <textarea
                ref={textareaRef}
                value={currentText}
                onChange={handleTextChange}
                className="w-full p-4 border border-gray-300 rounded-lg min-h-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Enter a detailed description for this point..."
                autoFocus
              />
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-4">
              <button
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={handleCancelText}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                onClick={handleSaveText}
              >
                Save Text
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};