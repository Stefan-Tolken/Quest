'use client';
import { useEffect, useRef } from 'react';

export default function CameraBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const getCamera = async () => {
      try {
        const isSecure = window.isSecureContext;
        const supported = !!navigator.mediaDevices?.getUserMedia;
  
        if (!isSecure || !supported) {
          console.warn('Camera not supported or insecure context');
          return;
        }
  
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
  
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Camera access denied or failed:', err);
      }
    };
  
    getCamera();
  
    return () => {
      videoRef.current?.srcObject &&
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((track) => track.stop());
    };
  }, []);

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="fixed top-0 left-0 w-full h-full object-cover z-[-10]"
      />
      <div className="fixed top-0 left-0 w-full h-full z-[-9] backdrop-blur-md bg-black/20" />
    </>
  );
}