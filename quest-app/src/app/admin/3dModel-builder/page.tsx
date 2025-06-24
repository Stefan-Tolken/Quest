"use client";

import AuthGuard from "@/components/authGuard";
import { Suspense, useRef, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame, useLoader, useThree, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import { v4 as uuidv4 } from "uuid";
import ModelEditorOverlay from "./3dModel-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Upload, Edit3, Plus, Trash2, Save, Loader2, Edit, X, Settings, Check, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { ModelObject } from "@/lib/types";
import SuccessPopup from "@/components/ui/SuccessPopup";
import { useNavigationGuardContext } from "@/context/NavigationGuardContext";
import { usePathname } from "next/navigation";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { use3DModelUpload } from "@/hooks/use3DModelUpload";


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
  selectedIdx: number | null;
  setSelectedIdx: React.Dispatch<React.SetStateAction<number | null>>;
};

function MeshComponent({ gltfUrl, circles, setCircles, selectedIdx, setSelectedIdx, isTextModalOpen }: MeshComponentProps & { isTextModalOpen?: boolean }){
    const mesh = useRef<THREE.Group>(null!);
    const gltf = useLoader(GLTFLoader, gltfUrl);
    const { camera } = useThree();
    const [targetY, setTargetY] = useState<number | null>(null);

    // Double-click handler for adding points
    const handleDoubleClick = (event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        // Use the exact double-clicked point, with a minimal offset to avoid z-fighting
        const cameraDir = camera.position.clone().sub(event.point).normalize();
        const position = event.point.clone().add(cameraDir.multiplyScalar(0.05)); // Minimal offset
        // Calculate rotation to face the camera from the new point
        const lookAtMatrix = new THREE.Matrix4();
        lookAtMatrix.lookAt(position, camera.position, new THREE.Vector3(0, 1, 0));
        const rotation = new THREE.Euler().setFromRotationMatrix(lookAtMatrix);
        setCircles((prev) => [
            ...prev,
            { position, rotation, text: "", editing: true, showText: true },
        ]);
    };

    // Rotate model to face selected point (Y axis only)
    useEffect(() => {
        if (
            typeof selectedIdx === "number" &&
            circles[selectedIdx] &&
            mesh.current
        ) {
            const point = circles[selectedIdx];
            const pointPos = point.position;
            const pointRot = point.rotation;
            // Camera direction from point
            const camDir = camera.position.clone().sub(pointPos);
            camDir.y = 0;
            camDir.normalize();
            // Local -Z axis in world space
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
    }, [selectedIdx, circles, camera]);

    useFrame(() => {
        if (mesh.current && targetY !== null) {
            mesh.current.rotation.y += (targetY - mesh.current.rotation.y) * 0.02;
        }
    });

    // When a circle is clicked or its text is focused, set selectedIdx
    const handleCircleClick = (idx: number) => {
        setSelectedIdx(idx);
        toggleShowText(idx);
    };
    const handleInputFocus = (idx: number) => {
        setSelectedIdx(idx);
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
        <group ref={mesh} onDoubleClick={handleDoubleClick}>
            <primitive object={gltf.scene} />
            {circles.map((circle, index) => (
                <group key={index}>
                    <group position={circle.position} rotation={circle.rotation}>
                        <mesh onClick={() => handleCircleClick(index)}>
                            <circleGeometry args={[0.03, 32]} />
                            <meshBasicMaterial color="lightblue" transparent opacity={0.8} side={THREE.DoubleSide} />
                        </mesh>
                        {/* Number label on top of the circle */}
                        {!isTextModalOpen && (
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
                    {!isTextModalOpen && (
                    <Html
                        position={[circle.position.x, circle.position.y, circle.position.z]}
                        rotation={[circle.rotation.x, circle.rotation.y, circle.rotation.z]}
                        distanceFactor={0.5}
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
                          minWidth: "10px",
                          maxWidth: "300px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}
                    >
                        {circle.editing ? (
                            <input
                                type="text"
                                placeholder="Enter text..."
                                autoFocus
                                onChange={(e) => handleTextChange(index, e.target.value)}
                                onBlur={() => finishEditing(index)}
                                onFocus={() => handleInputFocus(index)}
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
        </group>
    );
}

function Loader() {
  return (
    <Html center>
      <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      </div>
    </Html>
  );
}


export default function ThreeDModelBuilderPage() {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [gltfUrl, setGltfUrl] = useState<string | null>(null);
    const [modelName, setModelName] = useState("");
    const [s3Url, setS3Url] = useState<string | null>(null);
    const [s3Key, setS3Key] = useState<string | null>(null);
    const [circles, setCircles] = useState<CircleData[]>([]);
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
    const [ambientIntensity, setAmbientIntensity] = useState(5);
    const [showEditOverlay, setShowEditOverlay] = useState(false);
    const [models, setModels] = useState<{ id: string, name: string }[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [showError, setShowError] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isTextModalOpen, setIsTextModalOpen] = useState(false);
    const [modalText, setModalText] = useState("");
    const [modalPointIdx, setModalPointIdx] = useState<number | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showExitConfirmation, setShowExitConfirmation] = useState(false);
    const [pendingNavigationPath, setPendingNavigationPath] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const router = useRouter();

    const { registerGuard, unregisterGuard } = useNavigationGuardContext();
    const pathname = usePathname();
    
    // Determine if we should block navigation
    const shouldBlock = 
        modelName.trim() !== '' || 
        uploadedFile !== null || 
        circles.length > 0;
    
    const { 
        uploadModel, 
        uploadProgress, 
        cleanupPendingUpload, 
        markAsSaved, 
        cleanupAllPending 
    } = use3DModelUpload({
        onSuccess: (url, key) => {
            setS3Url(url);
            setS3Key(key);
            console.log('✅ 3D Model uploaded successfully:', url, 'Key:', key);
        },
        onError: (error) => {
            console.error('❌ 3D Model upload failed:', error);
            // Don't show alert here - we'll show it in the UI
        },
    });

    const handleCancel = async () => {
        if (s3Key && !isSaving) {
            await cleanupPendingUpload(s3Key);
        }
        resetForm();
    };

    // Cleanup on component unmount or when user navigates away
    useEffect(() => {
        const handleBeforeUnload = () => {
            cleanupAllPending();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            cleanupAllPending();
        };
    }, [cleanupAllPending]);

    // Reset form function with cleanup
    const resetForm = useCallback(async () => {
        // Clean up any pending upload if user resets before saving
        if (s3Key && !isSaving) {
            await cleanupPendingUpload(s3Key);
        }
        
        setModelName("");
        setUploadedFile(null);
        setGltfUrl(null);
        setS3Url(null);
        setS3Key(null);
        setCircles([]);
        setAmbientIntensity(5);
        setShowError(false);
    }, [s3Key, isSaving, cleanupPendingUpload]);
    
    // Register/unregister the navigation guard
    useEffect(() => {
        registerGuard(shouldBlock, pathname);
        
        return () => {
            unregisterGuard();
        };
    }, [shouldBlock, pathname, registerGuard, unregisterGuard]);

    useEffect(() => {
        const handleNavigationAttempt = (event: CustomEvent) => {
            if (shouldBlock) {
                setShowExitConfirmation(true);
                setPendingNavigationPath(event.detail.targetPath);
            } else if (event.detail.targetPath) {
                router.push(event.detail.targetPath);
            }
        };

        // Add event listener
        window.addEventListener('navigationAttempt', handleNavigationAttempt as EventListener);
        
        return () => {
            window.removeEventListener('navigationAttempt', handleNavigationAttempt as EventListener);
        };
    }, [shouldBlock, router]);

    // Handle confirmation dialog responses
    const handleConfirmExit = useCallback(() => {
        setShowExitConfirmation(false);
        
        // If we have a pending navigation path, navigate to it
        if (pendingNavigationPath) {
            router.push(pendingNavigationPath);
            setPendingNavigationPath(null);
        } else {
            // Resolve the pending navigation promise for the context-based navigation
            if ((window as any).pendingNavigationResolve) {
                (window as any).pendingNavigationResolve(true);
                delete (window as any).pendingNavigationResolve;
            }
        }
    }, [pendingNavigationPath, router]);

    const handleCancelExit = useCallback(() => {
        setShowExitConfirmation(false);
        setPendingNavigationPath(null);
        
        // Resolve the pending navigation promise with false
        if ((window as any).pendingNavigationResolve) {
            (window as any).pendingNavigationResolve(false);
            delete (window as any).pendingNavigationResolve;
        }
    }, []);

    // Existing fetch models effect
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

    // Modified back to admin function to use navigation guard
    const handleBackToAdmin = (e: React.MouseEvent) => {
        e.preventDefault();
        if (shouldBlock) {
            setShowExitConfirmation(true);
            setPendingNavigationPath("/admin");
        } else {
            router.push("/admin");
        }
    };

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

    async function uploadToS3Direct(file: File): Promise<string> {
        try {
            console.log('📡 Getting presigned URL for:', file.name);
            
            const response = await fetch('/api/generate-presigned-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: file.name,
                    fileType: file.type || 'model/gltf-binary',
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ Presigned URL error:', response.status, errorData);
                throw new Error(`Failed to get presigned URL: ${response.status}`);
            }

            const { signedUrl, key } = await response.json();
            console.log('✅ Got presigned URL and key:', key);

            console.log('⬆️ Uploading to S3...');
            const uploadResponse = await fetch(signedUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type || 'model/gltf-binary',
                },
            });

            if (!uploadResponse.ok) {
                console.error('❌ S3 upload failed:', uploadResponse.status, uploadResponse.statusText);
                throw new Error(`S3 upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
            }

            const finalUrl = `/api/get-3dModel?key=${encodeURIComponent(key)}`;
            console.log('✅ S3 upload successful, final URL:', finalUrl);
            
            return finalUrl;
        } catch (error) {
            console.error('❌ S3 upload failed:', error);
            if (error instanceof Error) {
                throw new Error(`Upload failed: ${error.message}`);
            } else {
                throw new Error(`Upload failed: ${String(error)}`);
            }
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        // Clean up previous upload if exists
        if (s3Key) {
            await cleanupPendingUpload(s3Key);
        }

        const file = e.target.files?.[0];
        if (!file) return;
        
        if (!file.name.endsWith(".glb")) {
            alert("Please upload a .glb file");
            return;
        }

        setUploadedFile(file);
        
        // Create local URL for immediate preview
        const localUrl = URL.createObjectURL(file);
        setGltfUrl(localUrl);
        
        try {
            // Upload to S3 with progress tracking
            await uploadModel(file);
        } catch (error) {
            console.error('Upload failed:', error);
            // Error is already handled by the hook
        }
    };

    const handleSave = async () => {
        console.log('🔍 Save validation:', {
            modelName: modelName,
            uploadedFile: !!uploadedFile,
            s3Url: !!s3Url,
            s3Key: s3Key,
            isUploading: uploadProgress.isUploading
        });

        if (!modelName.trim()) {
            setShowError(true);
            return;
        }

        if (!uploadedFile) {
            alert("Please upload a .glb file");
            return;
        }

        if (uploadProgress.isUploading) {
            alert("Please wait for the file upload to complete");
            return;
        }

        if (!s3Url || !s3Key) {
            alert("There was an error uploading your file. Please try uploading again.");
            return;
        }

        setIsSaving(true);

        try {
            console.log('💾 Saving model metadata to DynamoDB...');
            
            const modelObject: ModelObject = {
                id: uuidv4(),
                name: modelName.trim(),
                fileName: uploadedFile.name,
                url: s3Url, // This is the S3 API URL
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
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API Error Response:', response.status, errorText);
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            console.log('📥 API response:', data);
            
            if (!data.success) {
                throw new Error(data.error || "Error saving 3D Model");
            }
            
            console.log('✅ Model saved successfully!');
            
            // Mark the upload as permanently saved (prevents cleanup)
            if (s3Key) {
                markAsSaved(s3Key);
            }
            
            setShowSuccess(true);
            
            // Reset form without cleanup since it's now saved
            setModelName("");
            setUploadedFile(null);
            setGltfUrl(null);
            setS3Url(null);
            setS3Key(null);
            setCircles([]);
            setAmbientIntensity(5);
        } catch (error) {
            console.error("❌ Error saving 3D model:", error);
            alert(`Error saving 3D Model: ${error instanceof Error ? error.message : String(error)}`);
            // Don't clean up the upload on save error - user might want to retry
        } finally {
            setIsSaving(false);
        }
    };

    // Auto-focus textarea when modal opens
    useEffect(() => {
        if (isTextModalOpen && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isTextModalOpen]);

    // Open modal for editing point text
    const openTextModal = (idx: number) => {
        setModalPointIdx(idx);
        setModalText(circles[idx]?.text || "");
        setIsTextModalOpen(true);
    };

    // Save text from modal
    const handleSaveTextModal = () => {
        if (modalPointIdx === null) return;
        setCircles(prev => prev.map((c, i) => i === modalPointIdx ? { ...c, text: modalText } : c));
        setIsTextModalOpen(false);
    };

    // Cancel text modal
    const handleCancelTextModal = () => {
        setIsTextModalOpen(false);
    };

    return (
        <AuthGuard adminOnly={false}>
            <div className="min-h-screen bg-gray-50">
                {/* Success Popup */}
                {showSuccess && (
                    <SuccessPopup
                        message="3D Model saved successfully!"
                        onOk={() => {
                            setShowSuccess(false);
                            router.push("/admin");
                        }}
                    />
                )}
                <div className="w-full max-w-7xl mx-auto bg-white shadow-sm">
                    {/* Header */}
                    <div className="flex items-center gap-4 p-6 border-b border-gray-200">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBackToAdmin}
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
                                        
                                        {/* Upload Error Display */}
                                        {!uploadProgress.isUploading && uploadProgress.status.includes('failed') && (
                                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                                <p className="text-red-600 text-sm">{uploadProgress.status}</p>
                                                <p className="text-red-500 text-xs mt-1">Please try again</p>
                                            </div>
                                        )}
                                        
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept=".glb"
                                                onChange={handleFileUpload}
                                                className="hidden"
                                                id="file-upload"
                                                disabled={uploadProgress.isUploading}
                                            />
                                            <Button
                                                onClick={() => document.getElementById('file-upload')?.click()}
                                                className="flex items-center gap-2 hover:cursor-pointer"
                                                disabled={uploadProgress.isUploading}
                                            >
                                                {uploadProgress.isUploading ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Uploading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="h-4 w-4" />
                                                        Choose .glb File
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                ) : (
                                <div className="flex-1 bg-white border-r border-gray-200 relative">
                                    {/* Upload Progress Overlay - Show over the 3D canvas */}
                                    {uploadProgress.isUploading && (
                                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                                            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                                                <div className="text-center mb-4">
                                                    <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                                    <p className="text-lg font-medium text-gray-700">Uploading 3D Model</p>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                                                    <div 
                                                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                                                        style={{ width: `${uploadProgress.progress}%` }}
                                                    />
                                                </div>
                                                <p className="text-sm text-gray-600 text-center">{uploadProgress.status}</p>
                                                <p className="text-xs text-gray-500 text-center mt-1">{uploadProgress.progress}% complete</p>
                                                
                                                {/* File info */}
                                                {uploadedFile && (
                                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                                        <p className="text-xs text-gray-500 text-center">
                                                            {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(1)} MB)
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Success/Error Status Overlay */}
                                    {!uploadProgress.isUploading && uploadProgress.status && (
                                        <div className="absolute top-4 right-4 z-40">
                                            {uploadProgress.status.includes('complete') ? (
                                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 shadow-md">
                                                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                                        <Check className="h-3 w-3 text-white" />
                                                    </div>
                                                    <p className="text-green-700 text-sm font-medium">Upload complete!</p>
                                                </div>
                                            ) : uploadProgress.status.includes('failed') ? (
                                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 shadow-md">
                                                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                                        <X className="h-3 w-3 text-white" />
                                                    </div>
                                                    <p className="text-red-700 text-sm font-medium">Upload failed</p>
                                                </div>
                                            ) : null}
                                        </div>
                                    )}

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
                                                    selectedIdx={selectedIdx}
                                                    setSelectedIdx={setSelectedIdx}
                                                    isTextModalOpen={isTextModalOpen}
                                                />
                                            </Suspense>
                                        </Canvas>
                                    </div>
                                    
                                    {/* Tip overlay */}
                                    {gltfUrl && !uploadProgress.isUploading && (
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
                                                <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200 flex items-center gap-2">
                                                    <span className="text-xs font-medium text-gray-500 rounded px-2 py-1">
                                                        Point {idx + 1}:
                                                    </span>
                                                    <button
                                                        className="flex-1 text-left bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[32px] truncate"
                                                        onClick={() => openTextModal(idx)}
                                                        style={{wordBreak: 'break-word', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'}}
                                                        title={circle.text}
                                                    >
                                                        {circle.text ? circle.text : <span className="text-gray-400 italic">Enter point description...</span>}
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
                                                        onClick={() => setCircles(prev => prev.filter((_, i) => i !== idx))}
                                                        className="ml-2"
                                                        title="Delete point"
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Save Button */}
                                <div className="p-6 border-t border-gray-200">
                                    <div className="flex gap-2">
                                        {/* Cancel/Reset Button */}
                                        {(uploadedFile || modelName.trim()) && !isSaving && (
                                            <Button
                                                onClick={handleCancel}
                                                variant="outline"
                                                className="flex-1 flex items-center gap-2 hover:cursor-pointer"
                                            >
                                                <X className="h-4 w-4" />
                                                Reset
                                            </Button>
                                        )}
                                        
                                        {/* Save Button */}
                                        <Button
                                            onClick={handleSave}
                                            disabled={isSaving || !modelName.trim() || !uploadedFile || uploadProgress.isUploading || !s3Url}
                                            className={`${(uploadedFile || modelName.trim()) && !isSaving ? 'flex-1' : 'w-full'} flex items-center gap-2 hover:cursor-pointer disabled:cursor-not-allowed`}
                                        >
                                            <Save className="h-4 w-4" />
                                            {isSaving ? "Saving to Database..." : 
                                            uploadProgress.isUploading ? "Uploading..." :
                                            !s3Url && uploadedFile ? "Upload Failed - Try Again" :
                                            !uploadedFile ? "Upload Required" :
                                            !modelName.trim() ? "Enter Model Name" :
                                            "Save 3D Model"}
                                        </Button>
                                    </div>
                                    
                                    {/* Status indicator under button */}
                                    {uploadProgress.isUploading && (
                                        <div className="mt-2 text-center">
                                            <p className="text-xs text-gray-500">{uploadProgress.status}</p>
                                            <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                                <div 
                                                    className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                                                    style={{ width: `${uploadProgress.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    
                                    {!uploadProgress.isUploading && s3Url && (
                                        <p className="text-xs text-green-600 text-center mt-2 flex items-center justify-center gap-1">
                                            <Check className="h-3 w-3" />
                                            Ready to save
                                        </p>
                                    )}
                                    
                                    {/* Warning about cleanup */}
                                    {s3Url && !isSaving && (
                                        <p className="text-xs text-amber-600 text-center mt-2 flex items-center justify-center gap-1">
                                            <AlertTriangle className="h-3 w-3" />
                                            File will be removed if not saved
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>     
                </div>

                {/* Overlay for editing existing models */}
                {showEditOverlay && (
                    <ModelEditorOverlay onClose={() => setShowEditOverlay(false)} />
                )}
                {/* Text editing modal for interest points */}
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

                {/* Exit Confirmation Dialog */}
                <ConfirmationDialog
                    isOpen={showExitConfirmation}
                    onClose={handleCancelExit}
                    onConfirm={handleConfirmExit}
                    title="Leave 3D Model Builder?"
                    message="You have unsaved changes. If you leave now, your progress will be lost and nothing will be saved."
                    confirmText="Leave Page"
                    cancelText="Stay Here"
                    variant="warning"
                />
            </div>
        </AuthGuard>
    );
}