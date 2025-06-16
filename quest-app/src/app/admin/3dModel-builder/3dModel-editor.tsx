import { Suspense, useEffect, useState } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Html, useProgress } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";

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
  return <Html center>{progress} % loaded</Html>;
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

  // For editing points and lighting
  const [editedPoints, setEditedPoints] = useState<ModelObject["points"]>([]);
  const [editedLight, setEditedLight] = useState<number>(5);

  useEffect(() => {
    fetch("/api/get-3dModels")
      .then(res => res.json())
      .then(data => {
        setModels(data.models || []);
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

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-6 min-w-[700px] flex flex-row gap-8 relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          ✕
        </button>
        <div className="flex-1 min-w-0">
          <label className="block mb-2 font-semibold">Select 3D Model</label>
          <select
            className="w-full border rounded px-3 py-2 mb-4"
            value={selectedModelId}
            onChange={e => setSelectedModelId(e.target.value)}
          >
            <option value="">-- Select a model --</option>
            {models.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <div className="h-[300px] w-full rounded bg-gray-100 flex items-center justify-center">
            {selectedModel ? (
              <Canvas className="h-full w-full" camera={{ position: [10, 5, 10], fov: 10, zoom: 5 }}>
                <Suspense fallback={<Loader />}>
                  <color attach="background" args={["#ffffff"]} />
                  <OrbitControls />
                  <ambientLight intensity={editedLight} />
                  <pointLight position={[0, 1, 0]} />
                  <MeshComponent gltfUrl={selectedModel.url} points={editedPoints} />
                </Suspense>
              </Canvas>
            ) : (
              <span className="text-gray-400">No model selected</span>
            )}
          </div>
        </div>
        {/* Right sidebar for lighting and points */}
        {selectedModel && (
          <div className="w-80 flex-shrink-0 bg-white/80 border-l p-4 overflow-y-auto rounded-lg">
            <div className="mb-4">
              <label className="text-xs font-medium">Lighting:</label>
              <input
                type="range"
                min={0}
                max={20}
                step={0.1}
                value={editedLight}
                onChange={e => handleLightChange(Number(e.target.value))}
                className="w-32 accent-blue-500 mx-2"
              />
              <span className="ml-2 text-xs w-8 inline-block text-right">{editedLight}</span>
            </div>
            <h3 className="font-semibold mb-2">Points</h3>
            {editedPoints.length === 0 && <div className="text-gray-400">No points added yet.</div>}
            <ul className="space-y-3">
              {editedPoints.map((point, idx) => (
                <li key={idx} className="flex items-center gap-2 border rounded p-2">
                  <span className="text-xs text-gray-500">{idx + 1}.</span>
                  <input
                    type="text"
                    value={point.text}
                    onChange={e => handlePointTextChange(idx, e.target.value)}
                    className="flex-1 border rounded px-2 py-1 text-sm"
                  />
                </li>
              ))}
            </ul>
            <div className="w-full flex justify-end mt-6">
              <button
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 shadow-lg"
                onClick={async () => {
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
                    alert("Error updating 3D Model.");
                    return;
                  }
                  alert("3D Model updated successfully!");
                  onClose();
                }}
                disabled={!selectedModel}
              >
                Update Model
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
