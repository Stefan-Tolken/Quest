"use client";

import AuthGuard from "@/components/authGuard";
import { Suspense, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useLoader, useThree, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Html, useProgress, SpotLight} from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";//check this 
import * as THREE from "three";
import { v4 as uuidv4 } from "uuid";
import ModelEditorOverlay from "./3dModel-editor";

type CircleData = {
    position: THREE.Vector3;
    rotation: THREE.Euler;
    text: string;
    editing: boolean;
    showText: boolean;
}

type MeshComponentProps = {
  gltfUrl: string;
  circles: CircleData[];
  setCircles: React.Dispatch<React.SetStateAction<CircleData[]>>;
};

type ModelObject = {
    id: string,
    name: string,         // Name of the model (from input)
    fileName: string,     // The .glb file name (e.g. "myModel.glb")
    url: string,          // S3 URL of the uploaded .glb
    points: Array<{
        position: { x: number, y: number, z: number },
        rotation: { x: number, y: number, z: number },
        text: string
    }>;
    light?: number; // Ambient light intensity
};

function MeshComponent({ gltfUrl, circles, setCircles }: MeshComponentProps){
    //const fileURL = "/3dModel/3DModel_Custom.glb";
    const mesh = useRef<THREE.Mesh>(null!);
    const gltf = useLoader(GLTFLoader, gltfUrl);
    const { camera } = useThree();

    const handleDoubleClick = (event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        const offset = camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(-0.05);
        const position = event.point.clone().add(offset);

        const lookAtMatrix = new THREE.Matrix4();
        lookAtMatrix.lookAt(position, camera.position, new THREE.Vector3(0, 1, 0));
        const rotation = new THREE.Euler().setFromRotationMatrix(lookAtMatrix);

        console.log("Double-click at:", position);
        setCircles((prev) => [
            ...prev,
            { position, rotation, text: "", editing: true, showText: true },
        ]);
    };

    const handleTextChange = (index: number, value: string) => {
        setCircles((prev) => {
            const copy = [...prev];
            copy[index].text = value;
            return copy;
        });
    };

    const finishEditing = (index: number) => {
        setCircles((prev) => {
            const copy = [...prev];
            copy[index].editing = false;
            return copy;
        });
    };

    const toggleShowText = (index: number) => {
        setCircles(prev => {
        return prev.map((circle, i) =>
            i === index
                ? { ...circle, showText: !circle.showText }
                : circle
        );
    });
    };

    return (
        <mesh ref={mesh}>
            <primitive object={gltf.scene} onDoubleClick={handleDoubleClick}/>
            {circles.map((circle, index) => (
                <group key={index}>
                    <group position={circle.position} rotation={circle.rotation}>
                        <mesh onClick={() => toggleShowText(index)}>
                            <circleGeometry args={[0.03, 32]} />
                            <meshBasicMaterial color="lightblue" transparent opacity={0.8} side={THREE.DoubleSide} />
                        </mesh>
                    </group>

                    {circle.showText && (<Html
                        position={circle.position.clone().add(new THREE.Vector3(0, 0.01, 0))}
                        rotation={circle.rotation}
                        transform
                        distanceFactor={0.5}
                        style={{
                            pointerEvents: "auto",
                            transform: "translateY(-30px) rotateY(180deg)",
                        }}
                    >
                        {circle.editing ? (
                            <input
                                type="text"
                                placeholder="Enter text..."
                                autoFocus
                                onChange={(e) => handleTextChange(index, e.target.value)}
                                onBlur={() => finishEditing(index)}
                                onKeyDown={(e) => {
                                    if(e.key === "Enter") finishEditing(index);
                                }}
                                style={{
                                fontSize: "12px",
                                padding: "2px 4px",
                                borderRadius: "4px",
                                border: "1px solid gray",
                                background: "white",
                                }}
                            />
                            ) : (
                                <div
                                    style={{
                                    background: "white",
                                    padding: "2px 4px",
                                    borderRadius: "4px",
                                    fontSize: "12px",
                                    }}
                                >
                                    {circle.text}
                                </div>
                        )}
                    </Html>
                    )}
                </group>
            ))}
        </mesh>
    );
}

function Loader(){//set loading screen while 3d obj loads
    const { progress } = useProgress()
    return <Html center>{progress} % loaded</Html>
}

export default function ThreeDModelBuilderPage() {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [gltfUrl, setGltfUrl] = useState<string | null>(null);
    const [modelName, setModelName] = useState("");
    const [base64Glb, setBase64Glb] = useState<string | null>(null);
    const [circles, setCircles] = useState<CircleData[]>([]);
    const [ambientIntensity, setAmbientIntensity] = useState(5);
    const [showEditOverlay, setShowEditOverlay] = useState(false);
    const [models, setModels] = useState<{ id: string, name: string }[]>([]);
    const [selectedModelId, setSelectedModelId] = useState<string>("");

    // Fetch models when overlay is opened
    useEffect(() => {
        if (showEditOverlay) {
            fetch("/api/get-3dModels")
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setModels(data.map((m: any) => ({ id: m.id, name: m.name })));
                    } else if (Array.isArray(data.models)) {
                        setModels(data.models.map((m: any) => ({ id: m.id, name: m.name })));
                    }
                });
        }
    }, [showEditOverlay]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.name.endsWith(".glb")) {
            setUploadedFile(file);
            setGltfUrl(URL.createObjectURL(file)); // For local preview

            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target?.result as string;
                // Save base64 to state for upload
                setBase64Glb(base64);
            };
            reader.readAsDataURL(file);

        } else {
            alert("Please upload a .glb file");
        }
    };

    const handleSave = async () => {
        if (!uploadedFile || !modelName) {
            alert("Please upload a file and enter a model name.");
            return;
        }

        // Convert the file to base64 if not already done
        let base64Data = base64Glb;
        if (!base64Data) {
            base64Data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(uploadedFile);
            });
        }

        // Build the model object for API
        const modelObject: ModelObject = {
            id: uuidv4(),
            name: modelName,
            fileName: uploadedFile.name,
            url: base64Data || "", // base64 string for now, backend will handle S3 upload
            points: circles.map(c => ({
                position: { x: c.position.x, y: c.position.y, z: c.position.z },
                rotation: { x: c.rotation.x, y: c.rotation.y, z: c.rotation.z },
                text: c.text,
            })),
            light: ambientIntensity, // Save the ambient light value
        };

        // Send to /api/save-3dModel, backend will handle S3 upload and return S3 url
        const response = await fetch("/api/save-3dModel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(modelObject),
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            alert("Error saving 3D Model.");
            return;
        }
        alert("3D Model saved successfully!");
    };

    return (
        <AuthGuard adminOnly={false}>
            <div className="flex flex-col h-screen bg-gray-50">
              <div className="p-4 border-b bg-white">
                <div className="max-w-3xl mx-auto space-y-4">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Create New 3D Model</h1>
                    <button
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 z-10 ml-4"
                      onClick={() => setShowEditOverlay(true)}
                    >
                      Edit existing models
                    </button>
                  </div>
                  <p className="text-red-500 text-sm">
                    * Please enter a name for your 3D Model.
                  </p>
    
                  <input
                    type="text"
                    required
                    placeholder="3D Model Name*"
                    value={modelName}
                    onChange={e => setModelName(e.target.value)}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-1">
                {/* 3D Model Canvas */}
                <div className="flex-1 flex flex-col justify-center items-center">
                    {!gltfUrl ? (
                        <div className="text-center">
                            <h2 className="mb-4 text-lg font-semibold">Upload a .glb 3D model</h2>
                            <input type="file" accept=".glb" onChange={handleFileUpload} className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"/>
                        </div>
                    ) : (
                        <Canvas className="h-2x1 w-2x1" camera={{ position: [10, 5, 10], fov: 3 }}>
                            <Suspense fallback={<Loader />}>
                                <color attach="background" args={["#ffffff"]} />
                                <OrbitControls />
                                <ambientLight intensity={ambientIntensity} />
                                <pointLight position={[0, 1, 5]} intensity={1}/>
                                <spotLight position={[0, 10, 0]} intensity={1}/>
                                <MeshComponent gltfUrl={gltfUrl} circles={circles} setCircles={setCircles} />
                            </Suspense>
                        </Canvas>
                    )}
                </div>
                <div className="w-80 bg-white border-l p-4 overflow-y-auto relative">
                  {/* Overlay Card */}
                  {showEditOverlay && (
                    <ModelEditorOverlay onClose={() => setShowEditOverlay(false)} />
                  )}
                  <div className="mb-4 flex items-center gap-2">
                    <label className="text-xs font-medium">Lighting:</label>
                    <input
                      type="range"
                      min={0}
                      max={20}
                      step={0.1}
                      value={ambientIntensity}
                      onChange={e => setAmbientIntensity(Number(e.target.value))}
                      className="w-32 accent-blue-500"
                    />
                    <span className="ml-2 text-xs w-8 inline-block text-right">{ambientIntensity}</span>
                  </div>
                  <h3 className="font-semibold mb-2">Points</h3>
                  {circles.length === 0 && <div className="text-gray-400">No points added yet.</div>}
                  <ul className="space-y-3">
                    {circles.map((circle, idx) => (
                      <li key={idx} className="flex items-center gap-2 border rounded p-2">
                        <span className="text-xs text-gray-500">{idx + 1}.</span>
                        <input
                          type="text"
                          value={circle.text}
                          onChange={e => {
                            const value = e.target.value;
                            setCircles(prev => prev.map((c, i) => i === idx ? { ...c, text: value } : c));
                          }}
                          className="flex-1 border rounded px-2 py-1 text-sm"
                        />
                        <button
                          onClick={() => setCircles(prev => prev.filter((_, i) => i !== idx))}
                          className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                          title="Delete point"
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

                <button
                  onClick={handleSave}
                  className="fixed bottom-4 right-4 bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                  Save 3D Model
                </button>
            </div>
        </AuthGuard>
    );
}
