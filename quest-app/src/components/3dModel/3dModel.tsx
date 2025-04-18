"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls, Html, useProgress, Center, Text3D} from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";//check this 
import { Mesh } from "three";

function MeshComponent(){
    const fileURL = "/3dModel/model.gltf";
    const mesh = useRef<Mesh>(null!);
    const gltf = useLoader(GLTFLoader, fileURL);
    return (
        <mesh ref={mesh} onDoubleClick={(e) => console.log('double click')}>
            <primitive object={gltf.scene} />
            <meshStandardMaterial roughness={0.75} emissive="#404057" />
            <Html occlude castShadow distanceFactor={1} position={[0.1, 0.1, 0]} transform>
                
                <div className="content">Fun fact</div>
            </Html>
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
        <div className='flex justify-center items-center h-screen'>
            <Canvas className='h-2x1 w-2x1'  camera={{ position: [10, 5, 10], fov: 3}}>
                
                <Suspense fallback={<Loader />}>
                    
                    <color attach="background" args={['#ffffff']} />
                    <OrbitControls />
                    <ambientLight />
                    <pointLight position={[0, 1, 0]} />
                    <MeshComponent />
                </Suspense>
            </Canvas>
        </div>
    );
}