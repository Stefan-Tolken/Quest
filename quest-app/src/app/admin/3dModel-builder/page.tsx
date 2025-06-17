"use client";

import AuthGuard from "@/components/authGuard";
import { Suspense, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useLoader, useThree, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Html, useProgress, SpotLight} from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import { v4 as uuidv4 } from "uuid";
import ModelEditorOverlay from "./3dModel-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Upload, Edit3, Plus, Trash2, Save, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { ModelObject } from "@/lib/types";

type CircleData = {
    position: THREE.Vector3;
    rotation: THREE.Euler;
    text: string;
    editing: boolean;
    showText: boolean;
}

export type MeshComponentProps = {
  gltfUrl: string;
  circles: CircleData[];
  setCircles: React.Dispatch<React.SetStateAction<CircleData[]>>;
};

function MeshComponent({ gltfUrl, circles, setCircles }: MeshComponentProps){
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

function Loader(){
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
    const [showError, setShowError] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

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
            setGltfUrl(URL.createObjectURL(file));

            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target?.result as string;
                setBase64Glb(base64);
            };
            reader.readAsDataURL(file);

        } else {
            alert("Please upload a .glb file");
        }
    };

    const handleSave = async () => {
        if (!modelName) {
            setShowError(true);
            return;
        }

        if (!uploadedFile) {
            alert("Please upload a .glb file");
            return;
        }

        setIsSaving(true);

        try {
            let base64Data = base64Glb;
            if (!base64Data) {
                base64Data = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target?.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(uploadedFile);
                });
            }

            const modelObject: ModelObject = {
                id: uuidv4(),
                name: modelName,
                fileName: uploadedFile.name,
                url: base64Data || "",
                points: circles.map(c => ({
                    position: { x: c.position.x, y: c.position.y, z: c.position.z },
                    rotation: { x: c.rotation.x, y: c.rotation.y, z: c.rotation.z },
                    text: c.text,
                })),
                light: ambientIntensity,
            };

            const response = await fetch("/api/save-3dModel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(modelObject),
            });
            
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error("Error saving 3D Model");
            }
            
            alert("3D Model saved successfully!");
            // Reset form
            setModelName("");
            setUploadedFile(null);
            setGltfUrl(null);
            setCircles([]);
            setAmbientIntensity(5);
        } catch (error) {
            console.error("Error saving 3D model:", error);
            alert("Error saving 3D Model");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AuthGuard adminOnly={false}>
            <div className="min-h-screen bg-gray-50">
                <div className="w-full max-w-7xl mx-auto bg-white shadow-sm">
                    {/* Header */}
                    <div className="flex items-center gap-4 p-6 border-b border-gray-200">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push("/admin")}
                            className="flex items-center gap-2 hover:cursor-pointer"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Admin
                        </Button>
                        <h1 className="text-2xl font-semibold">3D Model Builder</h1>
                        <div className="ml-auto">
                            <Button
                                variant="outline"
                                onClick={() => setShowEditOverlay(true)}
                                className="flex items-center gap-2 hover:cursor-pointer"
                            >
                                <Edit3 className="h-4 w-4" />
                                Edit Existing Models
                            </Button>
                        </div>
                    </div>

                    {/* Error Messages */}
                    {showError && (
                        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-red-600 text-sm">* Please enter a name for your 3D Model.</p>
                        </div>
                    )}

                    {/* Model Name Input */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="max-w-md">
                            <label className="block text-lg font-medium text-gray-700 mb-2">
                                Model Name <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="text"
                                required
                                placeholder="Enter 3D model name"
                                value={modelName}
                                onChange={(e) => setModelName(e.target.value)}
                                onFocus={() => setShowError(false)}
                                className="w-full h-12 border placeholder:text-gray-400 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base p-4"
                            />
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex h-[calc(100vh-200px)]">
                        {/* 3D Canvas Area */}
                        <div className="flex-1 flex flex-col">
                            {!gltfUrl ? (
                                <div className="flex-1 flex items-center justify-center bg-gray-50">
                                    <div className="text-center p-8">
                                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Upload className="h-8 w-8 text-blue-600" />
                                        </div>
                                        <h2 className="text-xl font-semibold text-gray-700 mb-2">Upload 3D Model</h2>
                                        <p className="text-gray-500 mb-6">Upload a .glb file to get started</p>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept=".glb"
                                                onChange={handleFileUpload}
                                                className="hidden"
                                                id="file-upload"
                                            />
                                            <Button
                                                onClick={() => document.getElementById('file-upload')?.click()}
                                                className="flex items-center gap-2 hover:cursor-pointer"
                                            >
                                                <Upload className="h-4 w-4" />
                                                Choose .glb File
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 bg-white border-r border-gray-200">
                                    <div className="h-full w-full">
                                        <Canvas 
                                            className="h-full w-full" 
                                            camera={{ position: [10, 5, 10], fov: 3 }}
                                        >
                                            <Suspense fallback={<Loader />}>
                                                <color attach="background" args={["#ffffff"]} />
                                                <OrbitControls />
                                                <ambientLight intensity={ambientIntensity} />
                                                <pointLight position={[0, 1, 5]} intensity={1}/>
                                                <spotLight position={[0, 10, 0]} intensity={1}/>
                                                <MeshComponent 
                                                    gltfUrl={gltfUrl} 
                                                    circles={circles} 
                                                    setCircles={setCircles} 
                                                />
                                            </Suspense>
                                        </Canvas>
                                    </div>
                                    {gltfUrl && (
                                        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md border">
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">Tip:</span> Double-click on the model to add interest points
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Right Sidebar */}
                        {gltfUrl && (
                            <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
                                {/* Settings Section */}
                                <div className="p-6 border-b border-gray-200">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Settings className="h-5 w-5 text-gray-600" />
                                        <h3 className="font-semibold text-gray-900">Model Settings</h3>
                                    </div>
                                    
                                    {/* Lighting Control */}
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
                                                value={ambientIntensity}
                                                onChange={e => setAmbientIntensity(Number(e.target.value))}
                                                className="flex-1 accent-blue-500"
                                            />
                                            <span className="text-sm font-medium text-gray-900 w-12 text-right">
                                                {ambientIntensity.toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Points Section */}
                                <div className="flex-1 p-6 overflow-y-auto">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Plus className="h-5 w-5 text-gray-600" />
                                        <h3 className="font-semibold text-gray-900">Interest Points</h3>
                                        <span className="ml-auto text-sm text-gray-500">
                                            {circles.length} point{circles.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    
                                    {circles.length === 0 ? (
                                        <div className="text-center py-8">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Plus className="h-6 w-6 text-gray-400" />
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                No interest points added yet
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Double-click on the model to add points
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {circles.map((circle, idx) => (
                                                <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-xs font-medium text-gray-500 bg-white rounded px-2 py-1">
                                                            Point {idx + 1}
                                                        </span>
                                                        <button
                                                            onClick={() => setCircles(prev => prev.filter((_, i) => i !== idx))}
                                                            className="ml-auto p-1 hover:bg-red-100 rounded-full transition-colors"
                                                            title="Delete point"
                                                        >
                                                            <Trash2 className="h-3 w-3 text-red-500" />
                                                        </button>
                                                    </div>
                                                    <Input
                                                        type="text"
                                                        value={circle.text}
                                                        onChange={e => {
                                                            const value = e.target.value;
                                                            setCircles(prev => prev.map((c, i) => i === idx ? { ...c, text: value } : c));
                                                        }}
                                                        placeholder="Enter point description..."
                                                        className="text-sm"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Save Button */}
                                <div className="p-6 border-t border-gray-200">
                                    <Button
                                        onClick={handleSave}
                                        disabled={isSaving || !modelName}
                                        className="w-full flex items-center gap-2 hover:cursor-pointer disabled:cursor-not-allowed"
                                    >
                                        <Save className="h-4 w-4" />
                                        {isSaving ? "Saving..." : "Save 3D Model"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Overlay for editing existing models */}
                {showEditOverlay && (
                    <ModelEditorOverlay onClose={() => setShowEditOverlay(false)} />
                )}
            </div>
        </AuthGuard>
    );
}