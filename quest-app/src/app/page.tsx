"use client";

import React, { useState, useEffect, useRef } from "react";
import AuthButton from "@/components/ui/authButton";
import CameraBackground from "@/components/ui/cameraBackground";
import gsap from "gsap";
import { useGSAP } from "@gsap/react"
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import Image from "next/image"



// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// Separated Model component with its own animation logic
function Model() {
    const fileURL = "/3dModel_Landing/PangolinAndCrocodile.glb";
    const mesh = useRef<THREE.Mesh>(null!);
    const gltf = useLoader(GLTFLoader, fileURL);
    const { camera } = useThree();
    const [isReady, setIsReady] = useState(false);
    
    // Initialize the model when it's loaded
    useEffect(() => {
      
      if (mesh.current && gltf.scene) {
        // Set initial rotation
        mesh.current.rotation.y = 0;
        // Force a render by setting position
        mesh.current.position.set(0, 0, 0);
        setIsReady(true);
        
        // Force Three.js to update
        mesh.current.updateMatrixWorld(true);
      }
    }, [gltf]);
    
    // Add manual rotation that works independently of scroll
    useFrame((state, delta) => {
      if (mesh.current && isReady) {
        // Very slow constant rotation (independent of scroll)
        mesh.current.rotation.y += delta * 0.1;
      }
    });
    
    // Add scroll-based rotation only after model is ready
    useGSAP(() => {
      
      if (mesh.current && isReady) {
        // Create the scroll animation with a slight delay
        
        gsap.to(mesh.current.rotation, {
          y: Math.PI * 2, // Full 360° rotation
          ease: "power1.inOut", // Smoother easing for the model rotation
          scrollTrigger: {
            trigger: ".main",
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            invalidateOnRefresh: true, // Important for recalculating on refresh
          },
        });
      }
    }, [isReady]);

    return (
      <mesh ref={mesh}>
        <primitive object={gltf.scene} scale={[1.5, 1.5, 1.5]}/>
      </mesh>
    );
}

export default function Home() {
  const [videoDone, setVideoDone] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const canvasContainerRef = useRef<HTMLDivElement>(null);


  // Handle completion of the intro video
  const handleVideoEnd = () => {
    setFadeOut(true);
    setTimeout(() => {
      setVideoDone(true);
      
      // Give Three.js time to initialize before triggering GSAP
      setTimeout(() => {
        setCanvasReady(true);
        
        // Force multiple refreshes to ensure everything is calculated correctly
        // requestAnimationFrame(() => {
        //   ScrollTrigger.refresh();
          
        //   // Do another refresh after a frame
        //   requestAnimationFrame(() => {
        //     ScrollTrigger.refresh();
        //   });
        // });
      }, 1); // Give canvas time to render
    }, 1000);
  };

  // Set up GSAP animations when canvas is ready
  useGSAP(() => {
    if (!videoDone || !canvasReady) return;
    
    // Start the 3-second timer for scroll indicator
    const timer = setTimeout(() => {
      setShowScrollIndicator(true);
    }, 3000);

    // Create scroll smoother with buttery smooth settings
          // Apply animations to sections
    sectionRefs.current.forEach((el, i) => {
      if (!el) return;

      // Entrance animation (scroll in)
      gsap.fromTo(
        el,
        { opacity: 0, y:0},
        {
          opacity: 1,
          y: 0,
          x: 0,
          duration: 0.4,
          ease: "power2.inOut",
          scrollTrigger: {
            trigger: el,
            start: 'top 80%',
            end: 'center center',
            scrub: true,
            invalidateOnRefresh: true,
          },
        }
      );

      // Exit animation (scroll out)
      gsap.fromTo(el,
        {opacity: 1, y:0}, {
        y: 0,
        opacity: 0,
        duration: 0.4,
        ease: "power2.inOut",
        scrollTrigger: {
          trigger: el,
          start: 'center center',
          end: 'bottom top',
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
    });

    // Snap logic with smooth but decisive behavior
    ScrollTrigger.create({
      trigger: ".main",
      start: "top top",
      end: () => `+=${(sectionRefs.current.length) * (window.visualViewport?.height ?? window.innerHeight)}`,
      scrub: 1, // Smoother scrub value
      snap: {
        snapTo: 1 / (sectionRefs.current.length),
        duration: 0.8, // Smooth snap duration
        delay: 0, // Instant decision making
        ease: "power2.InOut", // Smooth symmetric easing
        directional: true,
        inertia: false, // Disable inertia for quicker decisions
      },
      invalidateOnRefresh: true,
    });

    gsap.fromTo(
      ".footer",
      { y: 0,opacity: 0 },
      {
        y:0,
        duration: 2,
        opacity: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".footer",
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
          invalidateOnRefresh: true,
        },
      }
    );
    
    // Clean up on unmount
    return () => {
      clearTimeout(timer);
    };
  
  }, [videoDone, canvasReady]);
  

  const descriptions = [
    {
      title: "Welcome to Quest",
      text: "Turn museum visits into epic treasure hunts. Scan artifacts, solve clues, and discover stories hidden in plain sight.",
      highlight: "Ready to explore?"
    },
    {
      title: "Scan & Discover",
      text: "Point your phone at any QR code to unlock mysteries. Each artifact reveals secrets, stories, and surprises.",
      highlight: "History, reimagined"
    },
    {
      title: "Collect & Conquer",
      text: "Complete quests to earn rewards and build your collection. Compete with friends and become a museum legend.",
      highlight: "From visitor to legend"
    }
  ];

  return (
    <div className="relative ">
      {/* Video overlay */}
      {!videoDone && (
        <video
          src="/3dModel_Landing/Logo_6_Prem.mp4"
          autoPlay
          loop={false}
          muted
          playsInline
          onEnded={handleVideoEnd}
          className={`fixed aspect-3/2 h-full w-[100vw] lg:w-[50vw] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-1000 z-50
            ${fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        />
      )}
      
      {/* 3D Canvas Background */}
      <div 
        ref={canvasContainerRef}
        className={`fixed top-0 left-0 w-full h-full pointer-events-none opacity-0 transition-opacity duration-1000
          ${videoDone ? "opacity-100" : "opacity-0"}`}
      >
        <Canvas 
          camera={{ position: [10, 5, 10], fov: 3 }}
          frameloop="always"
          gl={{ 
            preserveDrawingBuffer: true,
            antialias: true,
            alpha: true
          }}
          onCreated={({ gl, scene }) => {
            // Force initial render
            gl.render(scene, gl.xr.getCamera());
          }}
          className="w-screen h-screen block"
        >
          <ambientLight intensity={2.5} />
          <directionalLight position={[10, 10, 5]} intensity={5} />
          <Model />
        </Canvas>
        <div className="absolute inset-0 bg-black/40" />
      </div>
      
      {/* Main content */}
      <div
        className={`min-h-screen w-full flex flex-col items-center justify-center sm:px-6 overflow-x-hidden
          ${videoDone ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <CameraBackground />
        <main className="main flex flex-col items-center justify-center max-w-xl w-full min-h-screen">
          
          {descriptions.map((desc, i) => (
                <React.Fragment key={i}>
                  <div className="h-full w-full flex items-center justify-center min-h-screen relative">
                    <section
                      ref={(el) => {
                        sectionRefs.current[i] = el as HTMLDivElement | null;
                      }}
                      className="absolute inset-0 flex flex-col justify-center items-center text-center px-6 sm:px-8"
                    >
                      {/* Top overlay text */}
                      <div className="absolute top-12 left-0 right-0 z-20">
                        <h2 className="text-3xl xs:text-4xl sm:text-5xl font-light text-white drop-shadow-2xl leading-tight mb-3 tracking-wide">
                          {desc.title}
                        </h2>
                        <div className="text-xs xs:text-sm font-medium text-gray-300 uppercase tracking-widest">
                          {desc.highlight}
                        </div>
                      </div>
                      
                      {/* Bottom overlay text */}
                      <div className="absolute bottom-16 left-0 right-0 z-20 px-6">
                        <div className="glass !bg-black/30 backdrop-blur-md rounded-xl p-3 mx-4 shadow-2xl">
                          <p className="text-base xs:text-lg sm:text-xl font-medium text-white leading-relaxed max-w-lg drop-shadow-lg">
                            {desc.text}
                          </p>
                        </div>
                      </div>
                      
                      {/* Scroll indicator - only shows on first section after 3 seconds */}
                      {i === 0 && showScrollIndicator && (
                        <div className="absolute bottom-50 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none">
                          <div className="flex flex-col items-center text-white animate-bounce">
                            <span className="text-xs font-light tracking-wider uppercase mb-2">Scroll to explore</span>
                            <div className="w-px h-8 bg-white/40"></div>
                            <div className="w-2 h-2 bg-white/60 rounded-full mt-1"></div>
                          </div>
                        </div>
                      )}
                      
                      {/* Subtle vignette overlay to help text readability */}
                      <div className="absolute inset-0 bg-gradient-to-b pointer-events-none z-10" />
                    </section>
                  </div>
                </React.Fragment>
              ))}
              {/* Blank div after the sections for scroll space, height set to viewport */}
              


        </main>




        {/* ----------------------- */}
            
            {/* Footer fixed at the bottom */}
            <footer className="footer flex flex-col gap-4 w-full h-[100vh] bottom-0 left-0 p-4 sm:p-6 text-background/70 text-xs sm:text-sm text-center z-50 pointer-events-none">
              <div className="w-full h-full">
                <Image
                  src="/3dModel_Landing/QuestLogoWhite.svg"
                  alt="Artifact Image"
                  width={1280}
                  height={720}
                  className="rounded-lg object-contain w-full max-w-[320px] sm:max-w-[480px] md:max-w-[640px] place-self-center"
                  sizes="(max-width: 640px) 95vw, 100vw"
                />
              </div>
              
              <div className="pointer-events-auto">
                <AuthButton />
              </div>
              <p className="text-white/70 font-medium">
                &copy; {new Date().getFullYear()} Quest &mdash; Where History Meets Adventure
              </p>
            </footer>
      </div>
    </div>
  );
}