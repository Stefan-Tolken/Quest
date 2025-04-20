'use client';

import { useParams, useRouter } from 'next/navigation';
import { mockArtefacts } from '@/lib/mockData';
import { useQuest } from '@/context/questContext';
import { useState, useEffect } from 'react';
import CameraBackground from '@/components/ui/cameraBackground';
import { Button } from '@/components/ui/button';

export default function ArtefactPage() {
  const { id } = useParams();
  const artefact = mockArtefacts.find((a) => a.id === id);
  const { activeQuest, submitArtefact } = useQuest();
  const [submitted, setSubmitted] = useState<boolean | null>(null);
  const router = useRouter();

  const handleBack = () => {
    router.push('/client');
  };

  if (!artefact) return <p>Artefact not found.</p>;

  const handleSubmit = () => {
    const success = submitArtefact(artefact.id);
    setSubmitted(success);
  };

  return (
    <div className="p-6">
      <Button
        onClick={handleBack}
        variant={'secondary'}
      >
        <svg
          className="w-4 h-4 mr-1"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </Button>
      <CameraBackground />
      <h1 className="text-2xl font-bold mb-2">{artefact.name}</h1>
      <p className="mb-4">{artefact.description}</p>
      <img src={artefact.image} alt={artefact.name} className="w-48 h-48 object-cover rounded" />

      {activeQuest && submitted === null && (
        <button
          onClick={handleSubmit}
          className="mt-6 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Submit for Quest
        </button>
      )}

      {submitted === true && (
        <p className="mt-4 text-green-600">Correct artefact submitted! 🎉</p>
      )}
      {submitted === false && (
        <p className="mt-4 text-red-600">This is not the correct artefact 😢</p>
      )}
    </div>
  );
}