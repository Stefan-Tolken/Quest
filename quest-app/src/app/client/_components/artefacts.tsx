'use client';
import Link from 'next/link';
import { mockArtefacts } from '@/lib/mockData';

export default function Artefacts() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">All Artefacts</h1>
      <ul className="grid gap-4">
        {mockArtefacts.map((artefact) => (
          <li key={artefact.id} className="bg-gray-100 p-4 rounded">
            <Link href={`/client/artefact/${artefact.id}`}>
              <div>
                <h2 className="text-lg font-semibold">{artefact.name}</h2>
                <p className="text-sm text-gray-600">{artefact.description}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}