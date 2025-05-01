// components/ui/artefactDetails.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, Info, Calendar, MapPin, Ruler, Box } from 'lucide-react';
import { useData } from '@/context/dataContext';
import { useQuest } from '@/context/questContext';
import { Button } from '@/components/ui/button';
import QRCodeGenerator from '@/components/QRGenerator';

interface ArtefactDetailProps {
  artefactId: string | null | undefined;
  isOpen: boolean;
  onClose: () => void;
  onVisibilityChange?: (isVisible: boolean) => void;
}

export default function ArtefactDetail({ 
  artefactId,
  isOpen,
  onClose,
  onVisibilityChange 
}: ArtefactDetailProps) {
  const { artefacts } = useData();
  const { activeQuest, submitArtefact } = useQuest();
  const [submitted, setSubmitted] = useState<boolean | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);

  // Find the current artefact
  const artefact = artefacts.find(a => a.id === artefactId) || null;

  // Update visibility state
  useEffect(() => {
    setIsVisible(isOpen);
    onVisibilityChange?.(isOpen);
  }, [isOpen, onVisibilityChange]);

  // Handle body scroll and navbar visibility
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.querySelector('.navbar')?.classList.add('hidden');
    } else {
      document.body.style.overflow = '';
      document.querySelector('.navbar')?.classList.remove('hidden');
    }

    return () => {
      document.body.style.overflow = '';
      document.querySelector('.navbar')?.classList.remove('hidden');
    };
  }, [isOpen]);

  const handleClose = () => {
    setSubmitted(null);
    onClose();
  };

  const handleSubmit = () => {
    if (!artefactId) return;
    const success = submitArtefact(artefactId);
    setSubmitted(success);
  };

  if (!isOpen || !isVisible) return null;

  return (
    <div 
      ref={detailRef}
      className="fixed inset-0 z-50 bg-background overflow-y-auto"
    >
      <div className="container max-w-6xl p-4 sm:px-6">
        {/* Header with back button and submit action */}
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={handleClose}
            variant={"default"}
            size={"icon"}
          >
            <ArrowLeft size={24} />
          </Button>
          
          {activeQuest && submitted === null && (
            <Button
              onClick={handleSubmit}
              variant="destructive"
              className="ml-auto"
            >
              Submit for Quest
            </Button>
          )}

          {submitted === true && (
            <div className="ml-auto px-4 py-2 bg-green-100 text-green-800 rounded-full">
              Correct artefact submitted! 🎉
            </div>
          )}
          {submitted === false && (
            <div className="ml-auto px-4 py-2 bg-red-100 text-red-800 rounded-full">
              Not the correct artefact
            </div>
          )}
        </div>

        {artefact ? (
          <div className="space-y-8">
            {/* Hero image */}
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100">
              <Image
                src={`https://picsum.photos/seed/${artefact.id}/1600/900`}
                alt={artefact.name}
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left column - Description */}
              <div className="lg:col-span-2 space-y-8">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight mb-2">
                    {artefact.name}
                  </h1>
                  <div className="flex items-center text-muted-foreground mb-6">
                    <span>ID: {artefact.id}</span>
                  </div>
                  
                  <div className="prose max-w-none">
                    <h2 className="flex items-center gap-2 text-xl font-semibold mb-4">
                      <Info size={18} /> About
                    </h2>
                    <p className="text-lg">
                      {artefact.name} {/* Using name as placeholder for description */}
                    </p>
                    <p className="mt-4">
                      This artefact is part of our historical collection. While we're currently 
                      preparing its detailed description, we can share that it represents an 
                      important cultural artifact from its period.
                    </p>
                  </div>
                </div>

                {/* Components section */}
                {artefact.components?.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Components</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {artefact.components.map(component => (
                        <div key={component.id} className="border rounded-lg p-4">
                          <h3 className="font-medium">{component.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Component ID: {component.id}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Historical context */}
                <div className="prose max-w-none">
                  <h2 className="text-xl font-semibold mb-4">Historical Context</h2>
                  <p>
                    While we're preparing the detailed historical context for this artefact, 
                    our researchers are working to uncover its full story. Check back soon 
                    for updates on its origin, significance, and journey to our collection.
                  </p>
                </div>
              </div>

              {/* Right column - Details */}
              <div className="space-y-8">
                {/* QR Code */}
                <div className="bg-muted p-6 rounded-xl">
                  <h2 className="text-lg font-semibold mb-4 text-center">
                    Artefact QR Code
                  </h2>
                  <div className="flex justify-center">
                    <QRCodeGenerator 
                      data={{ artefactId: artefact.id }} 
                      size={200}
                      includeDownload={true}
                    />
                  </div>
                </div>

                {/* Details card */}
                <div className="border rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-4">Details</h2>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                        <p className="text-sm">
                          {new Date(artefact.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Origin</h3>
                        <p className="text-sm">Location data coming soon</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Ruler className="mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Dimensions</h3>
                        <p className="text-sm">Measurement data coming soon</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Box className="mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Materials</h3>
                        <p className="text-sm">Material data coming soon</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quest status */}
                {artefact.partOfQuest && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h3 className="font-medium text-blue-800 mb-1">Quest Artefact</h3>
                    <p className="text-sm text-blue-700">
                      This artefact is part of an active quest. Submit it to complete your quest!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Gallery section */}
            <div className="pt-8">
              <h2 className="text-xl font-semibold mb-6">Gallery</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={`https://picsum.photos/seed/${artefact.id}${i}/600/600`}
                      alt={`${artefact.name} - Image ${i}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Artefact not found</p>
          </div>
        )}
      </div>
    </div>
  );
}