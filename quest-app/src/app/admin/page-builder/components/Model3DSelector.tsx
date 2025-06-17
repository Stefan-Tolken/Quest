import { Suspense, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useLoader, useThree, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Html, useProgress, Center, Text3D} from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";

// Use the same type as in page.tsx for consistency
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
  light?: number; // Add light property
};

export function Model3DSelector({ 
  selectedModelUrl, 
  onSelectModel 
}: { 
  selectedModelUrl: string, 
  onSelectModel: (url: string) => void 
}) {
  const [models, setModels] = useState<ModelObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [internalSelectedUrl, setInternalSelectedUrl] = useState<string>(selectedModelUrl);

  useEffect(() => {
    fetch("/api/get-3dModels")
      .then(res => res.json())
      .then(data => {
        setModels(data.models || []);
        setLoading(false);
      });
  }, []);

  // Keep internal state in sync with prop
  useEffect(() => {
    setInternalSelectedUrl(selectedModelUrl);
  }, [selectedModelUrl]);

  // Find the selected model by URL
  const selectedModel = models.find(m => m.url === internalSelectedUrl);

  useEffect(() => {
    if (selectedModel) {
      console.log("Selected 3D Model:", selectedModel);
    }
  }, [selectedModel]);

  if (loading) return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        {/* Spinner */}
        <div className="relative mb-3">
          <div className="w-8 h-8 border-3 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
        </div>
        
        {/* Message */}
        <p className="text-gray-600 text-sm">Loading 3D models...</p>
      </div>
    </div>
  );

  return (
    <div>
      <label className="block mb-2 font-semibold">Select 3D Model</label>
      <select
        value={internalSelectedUrl}
        onChange={e => {
          setInternalSelectedUrl(e.target.value);
          // Pass the selected model's URL to the parent
          onSelectModel(e.target.value);
        }}
        className="border p-2 rounded"
      >
        <option value="">-- Select a model --</option>
        {models.map(m => (
          <option key={m.id} value={m.url}>{m.name}</option>
        ))}
      </select>

      {internalSelectedUrl && selectedModel && (
        <div className="h-[300px] w-full mt-4 rounded">
          <Canvas className="h-full w-full" camera={{ position: [10, 5, 10], fov: 10, zoom: 5}}>
            <Suspense fallback={<Loader />}>
              <color attach="background" args={["#ffffff"]} />
              <OrbitControls />
              <ambientLight intensity={selectedModel.light ?? 5} />
              <pointLight position={[0, 1, 0]} />
              <MeshComponent
                gltfUrl={selectedModel.url}
                points={selectedModel.points || []}
              />
            </Suspense>
          </Canvas>
        </div>
      )}
    </div>
  );
}

function Loader(){
    const { progress } = useProgress()
    return <Html center>{progress} % loaded</Html>
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

  // Render the model and the points as circles with text
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