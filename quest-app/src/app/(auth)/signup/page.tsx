"use client"

import BackButtonContainer from "@/components/ui/backButtonContainer"

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-row gap-5 row-start-2 items-center sm:items-start">
        <BackButtonContainer/>
        <h1 className="text-3xl font-bold m-auto">
            Sign Up
        </h1>
        <div className="flex gap-4 items-center flex-col sm:flex-row">
            
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        
      </footer>
    </div>
  );
}
