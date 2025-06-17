import { Suspense, useEffect, useState } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Html, useProgress } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Settings, Plus, Save, Loader2, Info } from "lucide-react";

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
        <span className="text-sm font-medium">{Math.round(progress)}% loaded</span>
      </div>
    </Html>
  );
}

function MeshComponent({ gltfUrl, points }: { gltfUrl: string, points?: ModelObject["points"] }) {
  const gltf = useLoader(GLTFLoader, gltfUrl);
  // Only one label can be visible at a time
  const [visibleIndex, setVisibleIndex] = useState<number | null>(null);

  useEffect(() => {
    setVisibleIndex(null); // Reset when points change
  }, [points]);

  const handleCircleClick = (idx: number) => {
    setVisibleIndex(v => v === idx ? null : idx);
  };

  return (
    <mesh>
      <primitive object={gltf.scene} dispose={null} />
      {points && points.map((point, index) => (
        <group key={index}>
          <group position={[point.position.x, point.position.y, point.position.z]} rotation={[point.rotation.x, point.rotation.y, point.rotation.z]}>
            <mesh onClick={() => handleCircleClick(index)}>
              <circleGeometry args={[0.02, 32]} />
              <meshBasicMaterial color="lightblue" transparent opacity={0.8} side={THREE.DoubleSide} />
            </mesh>
          </group>
          {visibleIndex === index && (
            <Html
              position={[point.position.x, point.position.y, point.position.z]}
              rotation={[point.rotation.x, point.rotation.y, point.rotation.z]}
              distanceFactor={1}
              style={{
                background: "white",
                padding: "2px 4px",
                borderRadius: "4px",
                fontSize: "20px",
                border: "1px solid gray",
                pointerEvents: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                boxSizing: "border-box",
                width: "auto",
                minWidth: "40px",
                maxWidth: "200px",
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
    </mesh>
  );
}

export default function ModelEditorOverlay({ onClose }: { onClose: () => void }) {
  const [models, setModels] = useState<ModelObject[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showTip, setShowTip] = useState(false);

  // For editing points and lighting
  const [editedPoints, setEditedPoints] = useState<ModelObject["points"]>([]);
  const [editedLight, setEditedLight] = useState<number>(5);

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

  // When a model is selected, load its points and light for editing
  useEffect(() => {
    if (selectedModel) {
      setEditedPoints(selectedModel.points ? JSON.parse(JSON.stringify(selectedModel.points)) : []);
      setEditedLight(selectedModel.light ?? 5);
    } else {
      setEditedPoints([]);
      setEditedLight(5);
    }
  }, [selectedModel]);

  // Handler for updating point text
  const handlePointTextChange = (idx: number, value: string) => {
    setEditedPoints(prev => prev.map((p, i) => i === idx ? { ...p, text: value } : p));
  };

  // Handler for updating lighting
  const handleLightChange = (value: number) => {
    setEditedLight(value);
  };

  const handleSave = async () => {
    if (!selectedModel) return;
    
    setIsSaving(true);
    try {
      // Prepare updated model object
      const updatedModel = {
        ...selectedModel,
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
      
      alert("3D Model updated successfully!");
      onClose();
    } catch (error) {
      console.error("Error updating 3D model:", error);
      alert("Error updating 3D Model");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
                          <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-medium text-gray-500 bg-white rounded px-2 py-1">
                                Point {idx + 1}
                              </span>
                            </div>
                            <Input
                              type="text"
                              value={point.text}
                              onChange={e => handlePointTextChange(idx, e.target.value)}
                              placeholder="Enter point description..."
                              className="text-sm"
                            />
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
                      <OrbitControls />
                      <ambientLight intensity={editedLight} />
                      <pointLight position={[0, 1, 0]} />
                      <MeshComponent gltfUrl={selectedModel.url} points={editedPoints} />
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
    </div>
  );
}