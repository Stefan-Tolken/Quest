"use client"

import { Suspense, useEffect, useState, useRef } from "react";
import { Canvas, useLoader, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, useProgress } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

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

export default function Model3DViewer({ modelUrl }: { modelUrl: string }) {
  const [model, setModel] = useState<ModelObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!modelUrl) return;
    setLoading(true);
    setError(null);
    fetch(`/api/get-3dModels`)
      .then(res => res.json())
      .then(data => {
        if (data && data.models) {
          const found = data.models.find((m: ModelObject) => m.url === modelUrl);
          if (found) {
            setModel(found);
            setSelectedIdx(found.points && found.points.length > 0 ? 0 : null);
          } else {
            setError("Model not found");
          }
        } else {
          setError("Model not found");
        }
      })
      .catch(() => setError("Failed to fetch model"))
      .finally(() => setLoading(false));
  }, [modelUrl]);

  const handleNextPoint = () => {
    if (!model?.points?.length) return;
    setSelectedIdx(idx => {
      if (idx === null) return 0;
      return (idx + 1) % model.points.length;
    });
  };

  const handlePrevPoint = () => {
    if (!model?.points?.length) return;
    setSelectedIdx(idx => {
      if (idx === null) return model.points.length - 1;
      return idx === 0 ? model.points.length - 1 : idx - 1;
    });
  };

  if (!modelUrl) return <div className="text-center text-gray-400">No 3D model linked.</div>;
  if (loading) return (<div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                          <span className="ml-2 text-sm text-gray-600">Loading models...</span>
                      </div>);
  if (error) return <div className="text-center text-red-500">{error}</div>;
  if (!model) return <div className="text-center text-gray-400">Model not found.</div>;

  return (
    <div>
    <div className="w-full flex justify-center">
      <div className="w-full max-w-[720px] h-[100vw] max-h-[720px] min-h-[300px] bg-gray-100 rounded-lg flex flex-col items-center justify-center">
        <div className="w-full h-full flex-1 flex items-center justify-center">
          <Canvas camera={{ position: [10, 5, 10], fov: 10, zoom: 5 }} className="h-full w-full rounded-lg">
            <Suspense fallback={<Loader />}>
              <color attach="background" args={["#ffffff"]} />
              <OrbitControls minDistance={5} maxDistance={30}/>
              <ambientLight intensity={model.light ?? 5} />
              <pointLight position={[0, 1, 0]} />
              <MeshComponent gltfUrl={model.url} points={model.points} selectedIdx={selectedIdx} />
            </Suspense>
          </Canvas>
        </div>
      </div>
    </div>
    {/* Controls and description */}
      {model.points && model.points.length > 0 && (
        <div className="w-full max-w-md mx-auto mt-4 flex flex-col items-center">
          <div className="flex items-center justify-evenly gap-3">
            <Button
              onClick={handlePrevPoint}
              size={"icon"}
            >
              <ArrowLeft size={24} />
            </Button>
            <span className="text-sm font-medium min-w-[100px] text-center">
              {selectedIdx !== null ? `Point ${selectedIdx + 1} of ${model.points.length}` : 'Select Point'}
            </span>
            <Button
              onClick={handleNextPoint}
              size={"icon"}
            >
              <ArrowRight size={24} />
            </Button>
          </div>
          <div className="w-full glass rounded-lg shadow p-3 text-center min-h-[40px] mt-4 flex items-center gap-2">
            {selectedIdx !== null && model.points[selectedIdx]?.text ? (
              <div className="flex gap-2 items-start">
                <div className="w-6 h-6 bg-foreground ring-2 ring-background rounded-full flex-shrink-0 flex items-center justify-center text-background text-sm font-bold">
                  {selectedIdx + 1}
                </div>
                <p className="text-base text-gray-800 text-left">{model.points[selectedIdx].text}</p>
              </div>
            ) : (
              <span className="text-gray-400">No description for this point.</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}