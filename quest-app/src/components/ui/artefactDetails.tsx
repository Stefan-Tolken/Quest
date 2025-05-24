// components/ui/artefactDetails.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, Info, Calendar, MapPin, Ruler, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import QRCodeGenerator from '@/components/QRGenerator';
import { ComponentData } from '@/lib/types';

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
  const [artefact, setArtefact] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<boolean | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);

  // Fetch artefact from API
  useEffect(() => {
    if (!artefactId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/get-artefacts`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const found = data.artifacts.find((a: any) => a.id === artefactId);
          setArtefact(found || null);
        } else {
          setError('Failed to fetch artefact');
        }
      })
      .catch(() => setError('Failed to fetch artefact'))
      .finally(() => setLoading(false));
  }, [artefactId]);

  useEffect(() => {
    setIsVisible(isOpen);
    onVisibilityChange?.(isOpen);
  }, [isOpen, onVisibilityChange]);

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

  // Placeholder for quest logic
  const handleSubmit = () => {};

  if (!isOpen || !isVisible) return null;
  if (loading) return <div className="p-8 text-center">Loading artefact...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return artefact ? (
    <div 
      ref={detailRef}
      className="fixed inset-0 z-50 bg-background overflow-y-auto"
    >
      <div className="container max-w-6xl p-4 sm:px-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={handleClose}
            variant={"default"}
            size={"icon"}
          >
            <ArrowLeft size={24} />
          </Button>
        </div>

        <div className="space-y-8">
          {/* Hero image */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100">
            <Image
              src={typeof artefact.image === 'string' && artefact.image ? artefact.image : `/api/placeholder/${artefact.id}`}
              alt={artefact.name}
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column - Description and Components */}
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
                  <p className="text-lg">{artefact.description}</p>
                </div>
              </div>

              {/* Render components in order */}
              {artefact.components?.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Page Content</h2>
                  <div className="space-y-4">
                    {artefact.components.map((component: ComponentData) => {
                      switch (component.type) {
                        case 'heading':
                          return <h3 key={component.id} className="text-2xl font-bold">{typeof component.content === 'string' ? component.content : ''}</h3>;
                        case 'paragraph':
                          return <p key={component.id} className="text-base">{typeof component.content === 'string' ? component.content : ''}</p>;
                        case 'image':
                          return (
                            <div key={component.id} className="w-full flex justify-center">
                              <Image
                                src={(component.content as any).url}
                                alt="Artifact Image"
                                width={500}
                                height={350}
                                className="rounded-lg object-contain"
                              />
                            </div>
                          );
                        case 'restoration':
                          return (
                            <div key={component.id} className="border rounded-lg p-4">
                              <h4 className="font-semibold mb-2">Restoration Timeline</h4>
                              <ol className="list-decimal ml-6">
                                {(component.content as any).restorations?.map((rest: any, idx: number) => (
                                  <li key={rest.id || idx} className="mb-2">
                                    <div className="font-medium">{rest.name} ({rest.date})</div>
                                    <div className="text-sm text-muted-foreground mb-1">{rest.description}</div>
                                    {rest.imageUrl && (
                                      <Image
                                        src={rest.imageUrl}
                                        alt={rest.name}
                                        width={300}
                                        height={200}
                                        className="rounded border mt-1"
                                      />
                                    )}
                                    {rest.organization && (
                                      <div className="text-xs text-muted-foreground mt-1">By: {rest.organization}</div>
                                    )}
                                  </li>
                                ))}
                              </ol>
                            </div>
                          );
                        case 'details':
                          return (
                            <div key={component.id} className="border rounded-lg p-4">
                              <h4 className="font-semibold mb-2">Details</h4>
                              <ul className="text-sm">
                                <li><b>Created:</b> {(component.content as any).created}</li>
                                <li><b>Origin:</b> {(component.content as any).origin}</li>
                                <li><b>Dimensions:</b> {(component.content as any).dimensions}</li>
                                <li><b>Materials:</b> {(component.content as any).materials}</li>
                              </ul>
                            </div>
                          );
                        default:
                          return null;
                      }
                    })}
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
                        {artefact.createdAt ? new Date(artefact.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Unknown'}
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
              {/* Optionally render images from components if you want */}
              {artefact.components?.filter((c: ComponentData) => c.type === 'image').map((c: any, i: number) => (
                <div key={c.id || i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={c.content.url}
                    alt={artefact.name + ' - Image'}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="text-center py-12">
      <p className="text-muted-foreground">Artefact not found</p>
    </div>
  );
}