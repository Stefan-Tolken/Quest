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
import { GripVertical, Trash, BadgeInfo, X, Edit, Plus } from "lucide-react";
import { Point, ImageEditorProps } from "@/lib/types";

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
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
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

  // Handle image load to get dimensions
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    setImageDimensions({
      width: img.offsetWidth,
      height: img.offsetHeight
    });
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
          selectedIndex === index ? "bg-purple-50 border-l-4 border-purple-500" : "hover:bg-gray-50"
        }`}
        onClick={() => {
          setSelectedIndex(index);
          setCurrentText(currentPoints[index]?.text || "");
        }}
      >
        <div className="flex items-start space-x-3 flex-1">
          <div {...attributes} {...listeners} className="cursor-grab hover:text-purple-600 active:cursor-grabbing">
            {GripVertical && <GripVertical size={16} />}
          </div>
          <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
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
            className="text-gray-400 hover:text-purple-600 transition-colors p-1"
            onClick={(e) => {
              e.stopPropagation();
              handleDeletePoint(index);
            }}
            title="Delete point"
          >
            {Trash && <Trash size={14} />}
          </button>
          <button
            className="text-gray-400 hover:text-blue-600 transition-colors p-1"
            onClick={(e) => {
              e.stopPropagation();
              handleEditText(index);
            }}
            title="Edit point"
          >
            {Edit && <Edit size={14} />}
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
  
  const Tooltip = ({ text }: { text: string }) => {
    return (
      <div className="relative inline-block group">
        <span className="text-gray-400 hover:text-gray-500 cursor-help">
          {BadgeInfo && <BadgeInfo size={18} className="text-purple-500 hover:text-purple-600" />}
        </span>
        <div className="absolute invisible group-hover:visible z-[99999] top-full left-1/2 -translate-x-1/2 mt-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg shadow-lg w-64 transition-opacity duration-200">
          {text}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-gray-200"></div>
        </div>
      </div>
    );
  };
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (draggedPointIndex === null || !imageContainerRef.current) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Use functional update to ensure we're always working with the latest state
    setCurrentPoints(prevPoints => {
      const pointToUpdate = prevPoints[draggedPointIndex];
      if (!pointToUpdate) return prevPoints;
      
      // Only update if the position has actually changed
      if (pointToUpdate.x === x && pointToUpdate.y === y) return prevPoints;
      
      const newPoints = [...prevPoints];
      newPoints[draggedPointIndex] = { ...pointToUpdate, x, y };
      return newPoints;
    });
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
      <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40 transition-all">
        {/* Main editor container */}
        <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-[80vw] max-h-[80vh] min-w-[1000px] min-h-[700px] flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                {Plus && <Plus size={16} className="text-purple-600" />}
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-gray-900">Image Points Editor</h1>
                <Tooltip text="Click anywhere on the image to create a point of interest. Each point can have a detailed description. You can drag points around the image, reorder points in the list, or delete individual points." />
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {X && <X size={24} />}
            </button>
          </div>

          {/* Main content area - now with 3 columns */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left sidebar - Preview */}
            <div className="w-80 border-r border-gray-200 bg-white p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-medium text-gray-900">Point Preview</h2>
                <Tooltip text="When you select a point, its content will appear here for quick reference." />
              </div>
              
              <div className="flex-1 border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
                {selectedIndex !== null ? (
                  <div className="p-4 h-full">
                    <div className="mb-2 text-sm font-medium text-gray-700">
                      Point {selectedIndex + 1} Content:
                    </div>
                    <div className="p-3 border rounded bg-white h-[calc(100%-60px)] overflow-y-auto text-sm">
                      {currentPoints[selectedIndex]?.text || (
                        <p className="text-gray-400 italic">No content to preview</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 h-full flex items-center justify-center">
                    <div>
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-gray-400 text-lg">📝</span>
                      </div>
                      <p className="text-sm">Select a point to preview</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Image section */}
            <div className="flex-1 p-6 flex flex-col">
              {/* Outer container with red border - keeps the same size */}
              <div 
                className="flex-1 flex items-center justify-center"
                style={{ minHeight: "500px" }}
              >
                {/* Image container that sizes to the actual image with gray background */}
                <div 
                  ref={imageContainerRef}
                  className="relative inline-block border-2 border-dashed rounded-lg"
                >
                  <Image
                    src={imageUrl}
                    alt="Edit points"
                    width={0}
                    height={0}
                    sizes="100vw"
                    className="object-contain max-h-[500px] max-w-full min-w-[300px] min-h-[200px] w-auto h-auto block rounded-lg"
                    onLoad={handleImageLoad}
                  />
                  
                  {/* Clickable overlay that exactly matches the image size */}
                  <div 
                    className="absolute inset-0 cursor-crosshair"
                    onClick={handleImageClick}
                  />
                  
                  {/* Points */}
                  {currentPoints.map((point, index) => (
                    <div
                      key={point.id}
                      className={`absolute w-6 h-6 border-2 border-white rounded-full shadow-lg cursor-grab active:cursor-grabbing transition-colors ${
                        selectedIndex === index ? "bg-purple-600 hover:bg-purple-700" : "bg-purple-500 hover:bg-purple-600"
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
            <div className="w-80 border-l border-gray-200 bg-white p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-medium text-gray-900">Points ({currentPoints.length})</h2>
                <Tooltip text="Drag points to reorder them. Use the trash icon to delete points. Click 'Edit' to modify descriptions." />
              </div>

              <div className="flex-1 border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={currentPoints.map(p => p.id)} strategy={verticalListSortingStrategy}>
                    <div className="divide-y max-h-full overflow-y-auto">
                      {currentPoints.map((point, index) => (
                        <SortablePoint key={point.id} point={point} index={index} />
                      ))}
                      {currentPoints.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-gray-400 text-lg">📍</span>
                          </div>
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
          <div className="p-6 border-t border-gray-200 bg-white flex justify-end gap-3">
            <button
              className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
              onClick={() => onSave(currentPoints)}
            >
              {Plus && <Plus size={16} />}
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Text editing modal */}
      {isTextModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center backdrop-blur-sm bg-black/40 transition-all">
          <div
            ref={modalRef}
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in"
          >
            {/* Header Section */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                  {Edit && <Edit size={16} className="text-purple-600" />}
                </div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Edit Point {selectedIndex !== null ? selectedIndex + 1 : ''}
                  </h2>
                  <Tooltip text="Write a detailed description for this point. The text will be associated with the numbered marker on the image." />
                </div>
              </div>
              <button
                onClick={handleCancelText}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                {X && <X size={24} />}
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6">
              <textarea
                ref={textareaRef}
                value={currentText}
                onChange={handleTextChange}
                className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 min-h-[220px] resize-none text-sm"
                placeholder="Enter a detailed description for this point..."
                autoFocus
              />
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-white">
              <button
                className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={handleCancelText}
              >
                Cancel
              </button>
              <button
                className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                onClick={handleSaveText}
              >
                Save Description
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};