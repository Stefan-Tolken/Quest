'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function Scan() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <h1 className="text-xl font-bold mb-6 text-white">Simulate Scan</h1>
      <Button
        onClick={() => router.push('/client/artefact/artefact-002')}
        variant={'secondary'}
      >
        Scan Artefact
      </Button>
    </div>
  );
}