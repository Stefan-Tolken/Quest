import { Suspense, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useLoader, useThree, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Html, useProgress, Center, Text3D} from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";//check this 
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

export function Model3DSelector({ selectedModelId, onSelectModel }: { selectedModelId: string, onSelectModel: (id: string) => void }) {
  const [models, setModels] = useState<ModelObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [internalSelectedId, setInternalSelectedId] = useState<string>(selectedModelId);

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
    setInternalSelectedId(selectedModelId);
  }, [selectedModelId]);

  useEffect(() => {
    if (internalSelectedId) {
      const selected = models.find(m => m.id === internalSelectedId);
      if (selected) {
        console.log("Selected 3D Model:", selected);
      }
    }
  }, [internalSelectedId, models]);

  if (loading) return <div>Loading models...</div>;

  return (
    <div>
      <label className="block mb-2 font-semibold">Select 3D Model</label>
      <select
        value={internalSelectedId}
        onChange={e => {
          setInternalSelectedId(e.target.value);
          // Save the selected model's URL in the parent content
          const selectedModel = models.find(m => m.id === e.target.value);
          onSelectModel(selectedModel ? selectedModel.url : "");
        }}
        className="border p-2 rounded"
      >
        <option value="">-- Select a model --</option>
        {models.map(m => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>

      {internalSelectedId && (
        <div className="h-[300px] w-full mt-4 rounded">
          <Canvas className="h-full w-full" camera={{ position: [10, 5, 10], fov: 10, zoom: 5}}>
            <Suspense fallback={<Loader />}>
              <color attach="background" args={["#ffffff"]} />
              <OrbitControls />
              <ambientLight intensity={models.find(m => m.id === internalSelectedId)?.light ?? 5} />
              <pointLight position={[0, 1, 0]} />
              <MeshComponent
                gltfUrl={models.find(m => m.id === internalSelectedId)?.url || ""}
                points={models.find(m => m.id === internalSelectedId)?.points || []}
              />
            </Suspense>
          </Canvas>
        </div>
      )}
    </div>
  );
}

function Loader(){//set loading screen while 3d obj loads
    const { progress } = useProgress()
    return <Html center>{progress} % loaded</Html>
}


//this aint working chief, Url goes to localhost instead of s3
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