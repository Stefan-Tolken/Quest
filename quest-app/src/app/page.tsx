import AuthButton from "@/components/ui/authButton";
import CameraBackground from "@/components/ui/cameraBackground";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <CameraBackground/>
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-6">
        <main className="flex flex-col items-center gap-8 max-w-xl w-full">
            <Image
              src="/icons/icon-512x512.png"
              alt="Quest App Logo"
              width={256}
              height={256}
              className="mb-2"
              priority
            />
        </main>
        <footer className="flex flex-col gap-6 w-full absolute bottom-0 left-0 p-6 text-background/70 text-sm text-center">
          <AuthButton />
          &copy; {new Date().getFullYear()} Quest &mdash; Museum Scavenger Hunt
        </footer>
      </div>
    </>
  );
}
