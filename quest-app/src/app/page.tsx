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

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

function Model() {
    const fileURL = "/3dModel_Landing/PangolinAndCrocodile.glb";
    const mesh = useRef<THREE.Mesh>(null!);
    const gltf = useLoader(GLTFLoader, fileURL);
    
    useGSAP(() => {
      if (mesh) {
        gsap.to(mesh.current.rotation, {
          y: Math.PI * 2, // Full 360° rotation
          ease: "none",
          scrollTrigger: {
            trigger: ".main", // or use a container ref
            start: "top top",
            end: "bottom bottom",
            scrub: true,
          },
        })
      }
    });

    return (
      <mesh ref={mesh}>
        <primitive object={gltf.scene} scale={[1.5, 1.5, 1.5]}/>
      </mesh>
    );
}

export default function Home() {
  const [videoDone, setVideoDone] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(() => {
  if (videoDone) {
    const smoother = ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 1.2,
      effects: true,
      smoothTouch: 0.1,
    });


    sectionRefs.current.forEach((el, i) => {
      if (!el) return;

      // Entry/exit animations
      gsap.timeline({
        scrollTrigger: {
          trigger: el,
          scrub: true,
          start: 'top bottom',
          end: 'bottom top',
        },
      })
      .fromTo(el, { opacity: 0, x: '100%' }, { opacity: 1, x: 0, duration: 1 })
      .to(el, { opacity: 0, x: '100%', duration: 1 });
    });

    // Snap logic (apply it once to the container)
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.create({
      trigger: ".main",
      start: "top top",
      end: () => `+=${(sectionRefs.current.length) * window.innerHeight}`,
      scrub: true,
      snap: {
        snapTo: 1 / sectionRefs.current.length,
        duration: 1.5,
        ease: "power1.out",
      },
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
        },
      }
    );
    
    return () => {
      smoother.kill(); // clean up on unmount
    };
  }
}, [videoDone]);

  const descriptions = [
    {
      title: "Welcome to Quest!",
      text: "An interactive museum scavenger hunt app that brings exhibits to life.",
    },
    {
      title: "How It Works",
      text: "Scan QR codes, solve clues, and discover artefacts as you explore.",
    },
    {
      title: "Track Your Progress",
      text: "Earn points, unlock achievements, and compete with friends.",
    },
    {
      title: "Learn & Play",
      text: "Engage with educational content and fun challenges at every step.",
    },
  ];

  const handleVideoEnd = () => {
    setFadeOut(true);
    setTimeout(() => setVideoDone(true), 1000);
  };

  return (
    <div className="">
      {/* Video overlay 
      
      onEnded={handleVideoEnd}
      
      className={`fixed aspect-3/2 object-cover transition-opacity duration-1000 ${
            fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
      */}
      {!videoDone && (
        <video
          src="/3dModel_Landing/Logo_6_Prem.mp4"
          autoPlay
          loop={false}
          muted
          playsInline
          onEnded={handleVideoEnd}
          className={`fixed aspect-3/2 h-full w-[100vw] lg:w-[50vw] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${
            fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        />
      )}
      {/* Landing page content, hidden until video is done */}
      <div
        className={`min-h-screen w-full flex flex-col items-center justify-center sm:px-6 transition-opacity duration-1000 overflow-x-hidden ${
          videoDone ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="-z-20">
          <CameraBackground />
        </div>
        <div id="smooth-wrapper">
          <div id="smooth-content">
              <main className="main flex flex-col items-center justify-center max-w-xl z-10 w-full min-h-screen">
                {descriptions.map((desc, i) => (
                  <React.Fragment key={i}>
                    <div className="h-full w-full flex items-center justify-center min-h-screen">
                      <section
                        ref={(el) => {
                          sectionRefs.current[i] = el as HTMLDivElement | null;
                        }}
                        className="bg-gray-400/60 bg-opacity-60 rounded-xl ml-4 mr-4 p-4 sm:p-6 shadow-lg w-full max-w-full text-center text-white"
                      >
                        <h2 className="text-lg xs:text-xl sm:text-2xl font-bold mb-2">
                          {desc.title}
                        </h2>
                        <p className="text-sm xs:text-base sm:text-lg">{desc.text}</p>
                      </section>
                    </div>
                  </React.Fragment>
                ))}
                {/* Blank div after the sections for scroll space, height set to viewport */}
                <div className="w-full max-w-full h-[80vh]" />
              </main>
              {/* Footer fixed at the bottom */}
              <footer className="footer flex flex-col gap-4 w-full bottom-0 left-0 p-4 sm:p-6 text-background/70 text-xs sm:text-sm text-center z-50 pointer-events-none">
                <div className="pointer-events-auto">
                  <AuthButton />
                </div>
                &copy; {new Date().getFullYear()} Quest &mdash; Museum Scavenger Hunt
              </footer>
          </div>
        </div>
        <div className="fixed top-0 left-0 -z-10 w-full h-full pointer-events-none">
          <Canvas camera={{ position: [10, 5, 10], fov: 3 }}>
            <ambientLight intensity={2.5} />
            <directionalLight position={[10, 10, 5]} intensity={2} />
            <Model/>
          </Canvas>
        </div>
      </div>
    </div>
  );
}
