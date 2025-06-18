import { Suspense, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useLoader, useThree, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Html, useProgress, Center, Text3D} from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Loader2 , Info} from 'lucide-react';

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

function MeshComponent({ gltfUrl, points, selectedIdx }: { gltfUrl: string, points?: ModelObject["points"], selectedIdx: number | null }) {
  const mesh = useLoader(GLTFLoader, gltfUrl);
  const groupRef = useRef<THREE.Group>(null!);
  const { camera } = useThree();
  const [targetY, setTargetY] = useState<number | null>(null);

  // Rotate model to face selected point (Y axis only)
  useEffect(() => {
    if (
      typeof selectedIdx === "number" &&
      points &&
      points[selectedIdx] &&
      groupRef.current
    ) {
      const point = points[selectedIdx];
      const pointPos = new THREE.Vector3(point.position.x, point.position.y, point.position.z);
      const pointRot = new THREE.Euler(point.rotation.x, point.rotation.y, point.rotation.z);
      const camDir = camera.position.clone().sub(pointPos);
      camDir.y = 0;
      camDir.normalize();
      const localMinusZ = new THREE.Vector3(0, 0, -1).applyEuler(pointRot);
      localMinusZ.y = 0;
      localMinusZ.normalize();
      const angleToCamera = Math.atan2(camDir.x, camDir.z);
      const angleOfPoint = Math.atan2(localMinusZ.x, localMinusZ.z);
      let targetY = angleToCamera - angleOfPoint;
      if (targetY > Math.PI) targetY -= 2 * Math.PI;
      if (targetY < -Math.PI) targetY += 2 * Math.PI;
      setTargetY(targetY);
    }
  }, [selectedIdx, points, camera]);

  useFrame(() => {
    if (groupRef.current && targetY !== null) {
      groupRef.current.rotation.y += (targetY - groupRef.current.rotation.y) * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={mesh.scene} dispose={null} />
      {points && points.map((point, index) => (
        <group key={index}>
          <group position={[point.position.x, point.position.y, point.position.z]} rotation={[point.rotation.x, point.rotation.y, point.rotation.z]}>
            {/* Number label styled like imageWithPoints */}
            <Html
              position={[0, 0, 0]}
              center
              style={{
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '14px',
                color: '#fff',
                background: selectedIdx === index ? '#000000' : '#222',
                borderRadius: '50%',
                border: selectedIdx === index ? '2px solid #fff' : 'none',
                opacity: selectedIdx === null || selectedIdx === index ? 1 : 0.3,
                transition: 'all 0.2s',
                pointerEvents: 'none',
              }}
            >
              {index + 1}
            </Html>
          </group>
        </group>
      ))}
    </group>
  );
}

export function Model3DSelector({ 
  selectedModelUrl, 
  onSelectModel 
}: { 
  selectedModelUrl: string, 
  onSelectModel: (url: string) => void 
}) {
  const [models, setModels] = useState<ModelObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [internalSelectedId, setInternalSelectedId] = useState<string>(selectedModelId);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showModelEditor, setShowModelEditor] = useState(false);

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

  // Reset point selection when model changes
  useEffect(() => {
    const model = models.find(m => m.id === internalSelectedId);
    setSelectedIdx(model && model.points && model.points.length > 0 ? 0 : null);
  }, [internalSelectedId, models]);

  if (loading) return (<div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-sm text-gray-600">Loading models...</span>
                </div>);

  const selectedModel = models.find(m => m.id === internalSelectedId);

  const handleNextPoint = () => {
    if (!selectedModel?.points?.length) return;
    setSelectedIdx(idx => {
      if (idx === null) return 0;
      return (idx + 1) % selectedModel.points.length;
    });
  };

  const handlePrevPoint = () => {
    if (!selectedModel?.points?.length) return;
    setSelectedIdx(idx => {
      if (idx === null) return selectedModel.points.length - 1;
      return idx === 0 ? selectedModel.points.length - 1 : idx - 1;
    });
  };

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
        setInternalSelectedId(e.target.value);
        const selectedModel = models.find(m => m.id === e.target.value);
          onSelectModel(selectedModel ? selectedModel.url : "");
        }}
        className="border p-2 rounded"
      >
        <option value="">-- Select a model --</option>
        {models.map(m => (
          <option key={m.id} value={m.url}>{m.name}</option>
        ))}
      </select>

      {selectedModel && (
        <>
        <div className="w-full flex justify-center mt-4">
          <div className="w-full max-w-[720px] h-[30vw] max-h-[720px] min-h-[300px] bg-gray-100 rounded-lg flex flex-col items-center justify-center">
            <div className="w-full h-full flex-1 flex items-center justify-center">
              <Canvas camera={{ position: [10, 5, 10], fov: 10, zoom: 5 }} className="h-full w-full rounded-lg">
                <Suspense fallback={<Loader />}>
                  <color attach="background" args={["#ffffff"]} />
                  <OrbitControls minDistance={5} maxDistance={20}/>
                  <ambientLight intensity={selectedModel.light ?? 5} />
                  <pointLight position={[0, 1, 0]} />
                  <MeshComponent gltfUrl={selectedModel.url} points={selectedModel.points} selectedIdx={selectedIdx} />
                </Suspense>
              </Canvas>
            </div>
          </div>
        </div>
        {/* Controls and description */}
        {selectedModel.points && selectedModel.points.length > 0 && (
          <div className="w-full max-w-md mx-auto mt-2 flex flex-col items-center">
            <div className="flex items-center justify-evenly gap-3">
              <Button
                onClick={handlePrevPoint}
                size={"icon"}
              >
                <ArrowLeft size={24} />
              </Button>
              <span className="text-sm font-medium min-w-[100px] text-center">
                {selectedIdx !== null ? `Point ${selectedIdx + 1} of ${selectedModel.points.length}` : 'Select Point'}
              </span>
              <Button
                onClick={handleNextPoint}
                size={"icon"}
              >
                <ArrowRight size={24} />
              </Button>
            </div>
            <div className="w-full glass rounded-lg shadow p-3 text-center min-h-[40px] mt-4 flex items-center gap-2">
              {selectedIdx !== null && selectedModel.points[selectedIdx]?.text ? (
                <div className="flex gap-2 items-start">
                  <div className="w-6 h-6 bg-foreground ring-2 ring-background rounded-full flex-shrink-0 flex items-center justify-center text-background text-sm font-bold">
                    {selectedIdx + 1}
                  </div>
                  <p className="text-base text-gray-800 text-left">{selectedModel.points[selectedIdx].text}</p>
                </div>
              ) : (
                <span className="text-gray-400">No description for this point.</span>
              )}
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm hover:bg-white border-gray-300 mt-4 text-gray-400 text-xs">
          <Info className="h-4 w-4"/>
          To edit the model, you will have to go to the 3D Model Page
        </div>
        </>
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