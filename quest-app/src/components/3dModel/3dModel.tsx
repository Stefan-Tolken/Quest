"use client"

import { Suspense, useEffect, useState } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Html, useProgress } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";

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
  // Show model
  // Render points as clickable circles with labels
  const [visibleIndex, setVisibleIndex] = useState<number | null>(null);

  useEffect(() => {
    setVisibleIndex(null); // Reset when points change
  }, [points]);

  const handleCircleClick = (idx: number) => {
    setVisibleIndex(v => v === idx ? null : idx);
  };

  return (
    <group>
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
    </group>
  );
}

export default function Model3DViewer({ modelUrl }: { modelUrl: string }) {
  const [model, setModel] = useState<ModelObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!modelUrl) return;
    console.log("Fetching 3D model from URL:", modelUrl);
    setLoading(true);
    setError(null);
    fetch(`/api/get-3dModels`)
      .then(res => res.json())
      .then(data => {
        if (data && data.models) {
          const found = data.models.find((m: ModelObject) => m.url === modelUrl);
          if (found) {
            setModel(found);
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

  if (!modelUrl) return <div className="text-center text-gray-400">No 3D model linked.</div>;
  if (loading) return <div className="text-center text-gray-400">Loading 3D model...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;
  if (!model) return <div className="text-center text-gray-400">Model not found.</div>;

  return (
    <div className="w-full h-[300px] h-min-[300px] bg-gray-100 rounded-lg flex items-center justify-center">
      <Canvas camera={{ position: [10, 5, 10], fov: 10, zoom: 5 }} className="h-full w-full ">
        <Suspense fallback={<Loader />}>
          <color attach="background" args={["#ffffff"]} />
          <OrbitControls />
          <ambientLight intensity={model.light ?? 5} />
          <pointLight position={[0, 1, 0]} />
          <MeshComponent gltfUrl={model.url} points={model.points} />
        </Suspense>
      </Canvas>
    </div>
  );
}