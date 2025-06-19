"use client";

import React, { useState, useEffect, useRef } from "react";
import AuthButton from "@/components/ui/authButton";
import CameraBackground from "@/components/ui/cameraBackground";
import gsap from "gsap";
import { useGSAP } from "@gsap/react"
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

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
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: ".main",
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            invalidateOnRefresh: true, // Important for recalculating on refresh
          },
        });
        
        tl.to(mesh.current.rotation, {
          y: Math.PI * 2, // Full 360° rotation
          ease: "power1.inOut", // Smoother easing for the model rotation
        });
      }
    }, [isReady]);

    return (
      <mesh ref={mesh}>
        <primitive object={gltf.scene} scale={[1.5, 1.5, 1.5]}/>
      </mesh>
    );
}

// Add this hook at the top of your component for better mobile viewport handling
const useViewportHeight = () => {
  const [vh, setVh] = useState(0);
  
  useEffect(() => {
    const updateVh = () => {
      // Use the visual viewport API if available, fallback to window.innerHeight
      const height = window.visualViewport?.height || window.innerHeight;
      setVh(height);
      // Update CSS custom property for consistent vh across the app
      document.documentElement.style.setProperty('--vh', `${height * 0.01}px`);
    };
    
    updateVh();
    window.addEventListener('resize', updateVh);
    window.addEventListener('orientationchange', updateVh);
    
    // Listen to visual viewport changes (mobile browser UI changes)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateVh);
    }
    
    return () => {
      window.removeEventListener('resize', updateVh);
      window.removeEventListener('orientationchange', updateVh);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateVh);
      }
    };
  }, []);
  
  return vh;
};

export default function Home() {
  const [videoDone, setVideoDone] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  
  // Use the custom viewport height hook
  const viewportHeight = useViewportHeight();

  // Handle completion of the intro video
  const handleVideoEnd = () => {
    setFadeOut(true);
    setTimeout(() => {
      setVideoDone(true);
      
      setTimeout(() => {
        setCanvasReady(true);
        
        // Multiple refreshes with proper timing
        requestAnimationFrame(() => {
          ScrollTrigger.refresh();
          
          requestAnimationFrame(() => {
            ScrollTrigger.refresh();
          });
        });
      }, 500);
    }, 1000);
  };

  // Updated GSAP animations with mobile fixes
  useGSAP(() => {
    if (!videoDone || !canvasReady || !viewportHeight) return;
    
    const timer = setTimeout(() => {
      setShowScrollIndicator(true);
    }, 3000);

    // Disable ScrollSmoother on mobile to prevent conflicts
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    let smoother;
    if (!isMobile) {
      smoother = ScrollSmoother.create({
        wrapper: "#smooth-wrapper",
        content: "#smooth-content",
        smooth: 1.5,
        effects: true,
        smoothTouch: 0.1, // Reduced for better mobile performance
        onUpdate: () => ScrollTrigger.update(),
        normalizeScroll: true,
      });
    }

    // Apply animations to sections with mobile-specific adjustments
    sectionRefs.current.forEach((el, i) => {
      if (!el) return;

      gsap.timeline({
        scrollTrigger: {
          trigger: el,
          scrub: isMobile ? 0.5 : 1, // Less scrub on mobile for better performance
          start: 'top bottom',
          end: 'bottom top',
          invalidateOnRefresh: true,
          refreshPriority: 1, // Higher priority for mobile
        },
      })
      .fromTo(el, { opacity: 0, x: '100%' }, { opacity: 1, x: 0, duration: 0.8, ease: "power2.out" })
      .to(el, { opacity: 0, x: '100%', duration: 0.8, ease: "power2.in" });
    });

    // Updated snap logic using actual viewport height
    ScrollTrigger.create({
      trigger: ".main",
      start: "top top",
      end: () => `+=${sectionRefs.current.length * viewportHeight}`, // Use actual viewport height
      scrub: isMobile ? 0.5 : 1,
      snap: {
        snapTo: 1 / sectionRefs.current.length,
        duration: isMobile ? 0.5 : 0.8, // Faster on mobile
        delay: 0,
        ease: "power2.inOut",
        directional: false,
        inertia: false,
      },
      invalidateOnRefresh: true,
      refreshPriority: 1,
    });

    gsap.fromTo(
      ".footer",
      { y: 100, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        scrollTrigger: {
          trigger: ".footer",
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
          invalidateOnRefresh: true,
          refreshPriority: 1,
        },
      }
    );
    
    // Clean up on unmount
    return () => {
      clearTimeout(timer);
      if (smoother) smoother.kill();
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, [videoDone, canvasReady, viewportHeight]); // Added viewportHeight as dependency

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
    <div className="relative">
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
        className={`fixed top-0 left-0 -z-10 w-full h-full pointer-events-none transition-opacity duration-500
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
            gl.render(scene, gl.xr.getCamera());
          }}
        >
          <ambientLight intensity={2.5} />
          <directionalLight position={[10, 10, 5]} intensity={2} />
          <Model />
        </Canvas>
        <div className="absolute inset-0 bg-black/40" />
      </div>
      
      {/* Main content */}
      <div
        className={`min-h-screen w-full flex flex-col items-center justify-center sm:px-6 transition-opacity duration-1000 overflow-x-hidden
          ${videoDone ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <div className="-z-20">
          <CameraBackground />
        </div>
        <div id="smooth-wrapper" className="w-full">
          <div id="smooth-content" className="w-full">
            <main className="main flex flex-col items-center justify-center max-w-xl z-10 w-full">
              {descriptions.map((desc, i) => (
                <React.Fragment key={i}>
                  <div className="h-screen w-full flex items-center justify-center relative"> {/* Changed from min-h-screen to h-screen */}
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
                        <div className="bg-black/80 backdrop-blur-md rounded-xl p-4 mx-4 border border-white/20 shadow-2xl">
                          <p className="text-base xs:text-lg sm:text-xl font-medium text-white leading-relaxed max-w-lg mx-auto drop-shadow-lg">
                            {desc.text}
                          </p>
                        </div>
                      </div>
                      
                      {/* Scroll indicator */}
                      {i === 0 && showScrollIndicator && (
                        <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none">
                          <div className="flex flex-col items-center text-white/60 animate-bounce">
                            <span className="text-xs font-light tracking-wider uppercase mb-2">Scroll to explore</span>
                            <div className="w-px h-8 bg-white/40"></div>
                            <div className="w-2 h-2 bg-white/60 rounded-full mt-1"></div>
                          </div>
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-b pointer-events-none z-10" />
                    </section>
                  </div>
                </React.Fragment>
              ))}
              {/* Reduced height for mobile */}
              <div className="w-full max-w-full h-[20vh]" /> {/* Reduced from 80vh */}
            </main>
            
            {/* Footer */}
            <footer className="footer flex flex-col gap-4 w-full bottom-0 left-0 p-4 sm:p-6 text-background/70 text-xs sm:text-sm text-center z-50 pointer-events-none">
              <div className="pointer-events-auto">
                <AuthButton />
              </div>
              <p className="text-white/70 font-medium">
                &copy; {new Date().getFullYear()} Quest &mdash; Where History Meets Adventure
              </p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}