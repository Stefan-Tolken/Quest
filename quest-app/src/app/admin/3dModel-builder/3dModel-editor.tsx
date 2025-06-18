import { Suspense, useEffect, useState, useRef } from "react";
import { Canvas, useLoader, useThree, ThreeEvent, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, useProgress } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Settings, Plus, Save, Loader2, Info, Edit } from "lucide-react";
import SuccessPopup from "@/components/ui/SuccessPopup";

// Use the same type as Model3DSelector
export type ModelObject = {
  id: string;
  name: string;
  fileName: string;
  url: string;
  points: Array<{
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    text: string;
  }>;
  light?: number;
};

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />

      </div>
    </Html>
  );
}

function MeshComponent({ gltfUrl, points, onAddPoint, selectedIdx, onPointFocus, isTextModalOpen, hideNumbers }: { gltfUrl: string, points?: ModelObject["points"], onAddPoint?: (position: { x: number, y: number, z: number }, rotation: { x: number, y: number, z: number }) => void, selectedIdx?: number, onPointFocus?: (idx: number) => void, isTextModalOpen?: boolean, hideNumbers?: boolean }) {
  const mesh = useRef<THREE.Group>(null!);
  const gltf = useLoader(GLTFLoader, gltfUrl);
  const [visibleIndex, setVisibleIndex] = useState<number | null>(null);
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const [targetY, setTargetY] = useState<number | null>(null);

  useEffect(() => {
    setVisibleIndex(null); // Reset when points change
  }, [points]);

  // Only reset visibleIndex if the number of points changes (not when text changes)
  const prevPointsLength = useRef(points ? points.length : 0);
  useEffect(() => {
    if (points && points.length !== prevPointsLength.current) {
      // If a point was added, show its label
      if (points.length > prevPointsLength.current) {
        setVisibleIndex(points.length - 1);
      } else {
        setVisibleIndex(null);
      }
      prevPointsLength.current = points.length;
    }
  }, [points]);

  // When a point is selected, compute the y-axis rotation needed to face the camera (using atan2 for shortest path)
  useEffect(() => {
    if (
      typeof selectedIdx === "number" &&
      points &&
      points[selectedIdx] &&
      mesh.current
    ) {
      const point = points[selectedIdx];
      // The world position of the point
      const pointPos = new THREE.Vector3(point.position.x, point.position.y, point.position.z);
      // The world rotation of the point
      const pointRot = new THREE.Euler(point.rotation.x, point.rotation.y, point.rotation.z);
      // The direction from the point to the camera
      const camDir = camera.position.clone().sub(pointPos);
      camDir.y = 0; // Project to XZ
      camDir.normalize();
      // The local -Z axis in world space (after applying the point's rotation)
      const localMinusZ = new THREE.Vector3(0, 0, -1).applyEuler(pointRot);
      localMinusZ.y = 0;
      localMinusZ.normalize();
      // atan2 for signed angle
      const angleToCamera = Math.atan2(camDir.x, camDir.z);
      const angleOfPoint = Math.atan2(localMinusZ.x, localMinusZ.z);
      let targetY = angleToCamera - angleOfPoint;
      // Normalize to [-PI, PI]
      if (targetY > Math.PI) targetY -= 2 * Math.PI;
      if (targetY < -Math.PI) targetY += 2 * Math.PI;
      // Always rotate, no threshold
      setTargetY(targetY);
    }
  }, [selectedIdx, points, camera]);

  // Animate the model's rotation.y to the target
  useFrame(() => {
    if (mesh.current && targetY !== null) {
      // Animate to the absolute target, not incrementally
      // To slow down the rotation, decrease the multiplier (e.g., 0.03 for slower, 0.1 for faster)
      mesh.current.rotation.y += (targetY - mesh.current.rotation.y) * 0.02; // <--- Adjust this value to change speed
    }
  });

  const handleCircleClick = (idx: number) => {
    setVisibleIndex(v => v === idx ? null : idx);
    if (onPointFocus) onPointFocus(idx);
  };

  // Show label when input is focused
  useEffect(() => {
    if (typeof selectedIdx === 'number') {
      setVisibleIndex(selectedIdx);
    }
  }, [selectedIdx]);

  // Double-click handler for adding points
  const handleDoubleClick = (event: ThreeEvent<MouseEvent>) => {
    if (!onAddPoint) return;
    event.stopPropagation();
    // Use the exact double-clicked point, with a minimal offset to avoid z-fighting
    const cameraDir = camera.position.clone().sub(event.point).normalize();
    const position = event.point.clone().add(cameraDir.multiplyScalar(0.05)); // Minimal offset
    // Calculate rotation to face the camera from the new point
    const lookAtMatrix = new THREE.Matrix4();
    lookAtMatrix.lookAt(position, camera.position, new THREE.Vector3(0, 1, 0));
    const rotation = new THREE.Euler().setFromRotationMatrix(lookAtMatrix);
    console.log("Double-click at:", position);
    onAddPoint(
      { x: position.x, y: position.y, z: position.z },
      { x: rotation.x, y: rotation.y, z: rotation.z }
    );
  };

  return (
    <>
      <OrbitControls ref={controlsRef} />
      <group ref={mesh} onDoubleClick={handleDoubleClick}>
        <primitive object={gltf.scene}/>
        {points && points.map((point, index) => (
          <group key={index}>
            <group position={[point.position.x, point.position.y, point.position.z]} rotation={[point.rotation.x, point.rotation.y, point.rotation.z]}>
              <mesh onClick={() => handleCircleClick(index)}>
                <circleGeometry args={[0.02, 32]} />
                <meshBasicMaterial color="lightblue" transparent opacity={0.8} side={THREE.DoubleSide} />
              </mesh>
              {/* Add number label on top of the circle, hide if modal open or hideNumbers is true */}
              {!isTextModalOpen && !hideNumbers && (
                <Html
                  position={[0, 0, 0]}
                  center
                  style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#222',
                    background: 'rgba(255,255,255,0.8)',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                    border: '1px solid #b0b0b0',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                  }}
                >
                  {index + 1}
                </Html>
              )}
            </group>
            {visibleIndex === index && (
              <Html
                position={[point.position.x, point.position.y, point.position.z]}
                rotation={[point.rotation.x, point.rotation.y, point.rotation.z]}
                distanceFactor={2}
                style={{
                  background: "white",
                  padding: "2px 4px",
                  borderRadius: "4px",
                  fontSize: "30px",
                  border: "1px solid gray",
                  pointerEvents: "auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  boxSizing: "border-box",
                  width: "auto",
                  minWidth: "10px",
                  maxWidth: "300px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              >
                {point.text}
              </Html>
            )}
          </group>
        ))}
      </group>
    </>
  );
}

export default function ModelEditorOverlay({ onClose }: { onClose: () => void }) {
  const [models, setModels] = useState<ModelObject[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // For editing points, lighting, and name
  const [editedPoints, setEditedPoints] = useState<ModelObject["points"]>([]);
  const [editedLight, setEditedLight] = useState<number>(5);
  const [editedName, setEditedName] = useState<string>("");

  // For managing the selected point index
  const [selectedPointIdx, setSelectedPointIdx] = useState<number | null>(null);

  // For text editing modal
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [modalText, setModalText] = useState("");
  const [modalPointIdx, setModalPointIdx] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setIsLoading(true);
    fetch("/api/get-3dModels")
      .then(res => res.json())
      .then(data => {
        setModels(data.models || []);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const selectedModel = models.find(m => m.id === selectedModelId);

  // When a model is selected, load its points, light, and name for editing
  useEffect(() => {
    if (selectedModel) {
      setEditedPoints(selectedModel.points ? JSON.parse(JSON.stringify(selectedModel.points)) : []);
      setEditedLight(selectedModel.light ?? 5);
      setEditedName(selectedModel.name || "");
    } else {
      setEditedPoints([]);
      setEditedLight(5);
      setEditedName("");
    }
  }, [selectedModel]);

  // Auto-focus textarea when modal opens
  useEffect(() => {
    if (isTextModalOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isTextModalOpen]);

  // Open modal for editing point text
  const openTextModal = (idx: number) => {
    setModalPointIdx(idx);
    setModalText(editedPoints[idx]?.text || "");
    setIsTextModalOpen(true);
  };

  // Save text from modal
  const handleSaveTextModal = () => {
    if (modalPointIdx === null) return;
    setEditedPoints(prev => prev.map((p, i) => i === modalPointIdx ? { ...p, text: modalText } : p));
    setIsTextModalOpen(false);
  };

  // Cancel text modal
  const handleCancelTextModal = () => {
    setIsTextModalOpen(false);
  };

  // Handler for updating point text
  const handlePointTextChange = (idx: number, value: string) => {
    setEditedPoints(prev => prev.map((p, i) => i === idx ? { ...p, text: value } : p));
  };

  // Handler for updating lighting
  const handleLightChange = (value: number) => {
    setEditedLight(value);
  };

  // Handler for updating name
  const handleNameChange = (value: string) => {
    setEditedName(value);
  };

  // Handler for removing a point
  const handleRemovePoint = (idx: number) => {
    setEditedPoints(prev => prev.filter((_, i) => i !== idx));
  };

  // Handler for adding a new point
  const handleAddPointByDoubleClick = (position: { x: number, y: number, z: number }, rotation: { x: number, y: number, z: number }) => {
    console.log("Double-click at handleAddPoint:", position);
    setEditedPoints(prev => [
      ...prev,
      { position, rotation, text: "" }
    ]);
  };

  const handleSave = async () => {
    if (!selectedModel) return;
    if (!editedName.trim()) {
      alert("Model name cannot be empty.");
      return;
    }
    setIsSaving(true);
    try {
      // Prepare updated model object
      const updatedModel = {
        ...selectedModel,
        name: editedName,
        points: editedPoints,
        light: editedLight,
      };
      const response = await fetch("/api/save-3dModel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedModel),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error("Error updating 3D Model");
      }
      setShowSuccess(true);
    } catch (error) {
      console.error("Error updating 3D model:", error);
      alert("Error updating 3D Model");
    } finally {
      setIsSaving(false);
    }
  };

  // Handler for focusing a point (from MeshComponent or input focus)
  const handlePointFocus = (idx: number) => {
    setSelectedPointIdx(idx);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Success Popup */}
      {showSuccess && (
        <SuccessPopup
          message="3D Model updated successfully!"
          onOk={() => {
            setShowSuccess(false);
            onClose();
          }}
        />
      )}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Edit 3D Models</h2>
            <p className="text-sm text-gray-600 mt-1">Select and modify existing 3D models</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="flex items-center gap-2 hover:cursor-pointer"
          >
            <X className="h-4 w-4" />
            Close
          </Button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Model Selection */}
          <div className="w-96 border-r border-gray-200 p-6 flex flex-col">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select 3D Model
              </label>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-sm text-gray-600">Loading models...</span>
                </div>
              ) : (
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={selectedModelId}
                  onChange={e => setSelectedModelId(e.target.value)}
                >
                  <option value="">-- Select a model --</option>
                  {models.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              )}
            </div>

            {selectedModel && (
              <>
                {/* Model Info */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Model Info</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div><span className="font-medium">Name:</span> {selectedModel.name}</div>
                    <div><span className="font-medium">File:</span> {selectedModel.fileName}</div>
                    <div><span className="font-medium">Points:</span> {editedPoints.length}</div>
                  </div>
                </div>

                {/* Editable Name */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Edit Model Name</label>
                  <Input
                    type="text"
                    value={editedName}
                    onChange={e => handleNameChange(e.target.value)}
                    placeholder="Enter model name..."
                    className="text-sm border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Settings */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Settings className="h-4 w-4 text-gray-600" />
                    <h4 className="font-medium text-gray-900">Settings</h4>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Ambient Lighting
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={20}
                        step={0.1}
                        value={editedLight}
                        onChange={e => handleLightChange(Number(e.target.value))}
                        className="flex-1 accent-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-900 w-12 text-right">
                        {editedLight.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Points */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <Plus className="h-4 w-4 text-gray-600" />
                    <h4 className="font-medium text-gray-900">Interest Points</h4>
                    <span className="ml-auto text-xs text-gray-500">
                      {editedPoints.length} point{editedPoints.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {editedPoints.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Plus className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500">No points added yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {editedPoints.map((point, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200 flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500 rounded px-2 py-1">
                              Point {idx + 1}:
                            </span>
                            <button
                              className="flex-1 text-left bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[32px] truncate"
                              onClick={() => openTextModal(idx)}
                              style={{wordBreak: 'break-word', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'}}
                              title={point.text}
                            >
                              {point.text ? point.text : <span className="text-gray-400 italic">Enter point description...</span>}
                            </button>
                            <button
                              className="ml-2 p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              onClick={() => openTextModal(idx)}
                              title="Edit point"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemovePoint(idx)}
                              className="ml-2"
                              title="Delete point"
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Save Button */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full flex items-center gap-2 hover:cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Update Model
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Right Panel - 3D Preview */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 bg-gray-50 flex items-center justify-center">
              {selectedModel ? (
                <div className="w-full h-full relative">
                  <Canvas 
                    className="w-full h-full" 
                    camera={{ position: [10, 5, 10], fov: 10, zoom: 5 }}
                  >
                    <Suspense fallback={<Loader />}>
                      <color attach="background" args={["#ffffff"]} />
                      <ambientLight intensity={editedLight} />
                      <pointLight position={[0, 1, 0]} />
                      <MeshComponent gltfUrl={selectedModel.url} points={editedPoints} onAddPoint={handleAddPointByDoubleClick} selectedIdx={selectedPointIdx ?? undefined} onPointFocus={handlePointFocus} isTextModalOpen={isTextModalOpen} hideNumbers={showSuccess} />
                    </Suspense>
                  </Canvas>
                  
                  {/* Tip Button and Overlay */}
                  <div className="absolute bottom-4 right-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTip(!showTip)}
                      className="flex items-center gap-2 bg-white/90 backdrop-blur-sm hover:bg-white border-gray-300"
                    >
                      <Info className="h-4 w-4" />
                      Tip
                    </Button>
                    
                    {showTip && (
                      <div className="absolute bottom-12 right-0 w-2xs bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Tip:</span> Click on transparent points to view the points descriptions
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Settings className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Model Selected</h3>
                  <p className="text-gray-500">Select a 3D model from the left panel to preview and edit</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Text editing modal */}
      {isTextModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center backdrop-blur-sm bg-black/40 transition-all">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in">
            {/* Header Section */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Plus size={16} className="text-blue-600" />
                </div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Edit Point {modalPointIdx !== null ? modalPointIdx + 1 : ''}
                  </h2>
                </div>
              </div>
              <button
                onClick={handleCancelTextModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            {/* Content Area */}
            <div className="p-6">
              <textarea
                ref={textareaRef}
                value={modalText}
                onChange={e => setModalText(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px] resize-none text-sm"
                placeholder="Enter a detailed description for this point..."
                autoFocus
              />
            </div>
            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-white">
              <button
                className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={handleCancelTextModal}
              >
                Cancel
              </button>
              <button
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                onClick={handleSaveTextModal}
              >
                Save Description
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}