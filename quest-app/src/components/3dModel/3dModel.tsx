"use client";

import { Suspense, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls, Html, useProgress, Center, Text3D} from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";//check this 
import { Mesh } from "three";

function MeshComponent(){
    const fileURL = "/3dModel/3DModel_Custom.glb";
    const mesh = useRef<Mesh>(null!);
    const gltf = useLoader(GLTFLoader, fileURL);

    const [showText, setShowText] = useState(false);
    const pulseRef = useRef<any>(null);

    useFrame(({ clock }) => {
        const scale = 1 + 0.1 * Math.sin(clock.getElapsedTime() * 2);
        if(pulseRef.current){
            pulseRef.current.scale.set(scale, scale, scale);
        }
    });

    const handleDoubleClick = () => {
        setShowText(prev => !prev);
    };
    return (
        <mesh ref={mesh}>
            <primitive object={gltf.scene} />
            
            {showText && (
                <Html
                occlude
                castShadow
                distanceFactor={0.5}
                position={[0.1, 0.02, 0.08]}
                transform
                >
                <div className="content bg-white/50 rounded text-sm">Daniel Craig was a <br />first order storm  <br />trooper in TFA</div>
                </Html>
            )}
            <mesh
                ref={pulseRef}
                position={[0.01, 0.02, 0.08]} // Adjust position relative to your model
                onPointerOver={(e) => (document.body.style.cursor = "pointer")}
                onPointerOut={(e) => (document.body.style.cursor = "default")}
                onClick={() => setShowText(prev => !prev)}
                >
                <circleGeometry args={[0.02, 30]} />
                <meshBasicMaterial color="blue" transparent opacity={0.8} />
            </mesh>
        </mesh>
    );
}

function Heading({ margin = 0.5}){
    const { width, height } = useThree((state) => state.viewport);
    return (
        <Center top left position={[width / 2 - margin, -height / 2 + margin, 0] }>
            <Text3D size={0.05} font="/3dModel/Inter_Bold.json">
                Hello World
                <meshStandardMaterial color="black" />
            </Text3D>
        </Center>
    );
}

function Loader(){//set loading screen while 3d obj loads
    const { progress } = useProgress()
    return <Html center>{progress} % loaded</Html>
}

export function Model(){
    return (
        <div className='w-full h-full'>
            <Canvas className='w-full h-full rounded-lg'  camera={{ position: [10, 5, 10], fov: 3}}>
                
                <Suspense fallback={<Loader />}>
                    
                    <color attach="background" args={['#ffffff']} />
                    <OrbitControls />
                    <ambientLight intensity={5}/>
                    <pointLight position={[0, 1, 0]} />
                    
                    <MeshComponent />
                </Suspense>
            </Canvas>
        </div>
    );
}