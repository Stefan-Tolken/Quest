'use client';
import Link from 'next/link';
import { mockArtefacts } from '@/lib/mockData';
import ArtefactCarousel from '@/components/ui/artefactCarousel';

export default function Artefacts() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">All Artefacts</h1>
      <ArtefactCarousel />
    </div>
  );
}