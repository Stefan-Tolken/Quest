// components/ui/artefactDetails.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, Info, Calendar, MapPin, Ruler, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import QRCodeGenerator from '@/components/QRGenerator';
import { ComponentData } from '@/lib/types';
import { useQuest } from '@/context/questContext';

interface ArtefactDetailProps {
  artefactId: string | null | undefined;
  isOpen: boolean;
  onClose: () => void;
  onVisibilityChange?: (isVisible: boolean) => void;
}

interface QuestProgress {
  collectedArtefactIds: string[];
  completed: boolean;
  completedAt?: string | null;
  attempts: number;
  lastAttemptedArtefactId?: string;
}

interface DetailsContent {
  created?: string;
  origin?: string;
  dimensions?: string;
  materials?: string;
}

export default function ArtefactDetail({ 
  artefactId,
  isOpen,
  onClose,
  onVisibilityChange 
}: ArtefactDetailProps) {
  interface Artefact {
    id: string;
    name: string;
    description: string;
    image?: string;
    createdAt?: string;
    components?: ComponentData[];
    // Add other fields as needed based on your artefact structure
  }
  
  const [artefact, setArtefact] = useState<Artefact | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<'idle'|'success'|'error'|'already'|null>(null);
  const [progress, setProgress] = useState<QuestProgress | null>(null);
  
  const { activeQuest } = useQuest();

  // Fetch artefact from API
  useEffect(() => {
    if (!artefactId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/get-artefacts`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const found = data.artifacts.find((a: Artefact) => a.id === artefactId);
          setArtefact(found || null);
        } else {
          setError('Failed to fetch artefact');
        }
      })
      .catch(() => setError('Failed to fetch artefact'))
      .finally(() => setLoading(false));
  }, [artefactId]);

  // Fetch user quest progress for the active quest
  useEffect(() => {
    if (!activeQuest?.quest_id) return;

    // Get JWT token from localStorage or sessionStorage (OIDC user)
    let token = localStorage.getItem('token');
    if (!token && typeof window !== 'undefined') {
      const oidcKey = Object.keys(sessionStorage).find(k => k.startsWith('oidc.user:'));
      if (oidcKey) {
        try {
          const oidcUser = JSON.parse(sessionStorage.getItem(oidcKey) || '{}');
          token = oidcUser.id_token;
        } catch {}
      }
    }

    fetch(`/api/user-quest-progress?questId=${activeQuest.quest_id}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          const progressData: QuestProgress = {
            collectedArtefactIds: data.collectedArtefactIds || [],
            completed: data.completed || false,
            completedAt: data.completedAt,
            attempts: data.attempts || 0,
            lastAttemptedArtefactId: data.lastAttemptedArtefactId
          };
          setProgress(progressData);
        } else {
          console.warn('User quest progress error:', data.error);
          setProgress(null);
        }
      })
      .catch(err => {
        console.error('Failed to fetch quest progress:', err);
        setProgress(null);
      });
  }, [activeQuest]);

  useEffect(() => {
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
    onClose();
  };

  // Check if this is a sequential quest and if this is the next artefact
  const questArtefacts = Array.isArray(activeQuest?.artefacts) ? activeQuest.artefacts : [];
  const hintDisplayMode = questArtefacts[0]?.hintDisplayMode || 'concurrent';
  const isSequential = hintDisplayMode === 'sequential';
  
  let isNextSequential = false;
  if (isSequential && Array.isArray(questArtefacts) && progress) {
    const foundIds = Array.isArray(progress.collectedArtefactIds) ? progress.collectedArtefactIds : [];
    const nextArtefact = questArtefacts.find((a: { artefactId?: string } | string) => {
      const artefactId = typeof a === 'object' && a !== null ? a.artefactId ?? '' : a ?? '';
      return !foundIds.includes(artefactId);
    });
    const nextArtefactId = typeof nextArtefact === 'object' && nextArtefact !== null ? nextArtefact.artefactId ?? '' : nextArtefact ?? '';
    isNextSequential = !!(nextArtefactId && nextArtefactId === artefact?.id);
  }
  // Submit artefact as quest answer
  const handleSubmit = async () => {
    if (!activeQuest || !artefact?.id) return;
    setSubmitStatus(null);
    
    try {
      // Get JWT token from localStorage or sessionStorage (OIDC user)
      let token = localStorage.getItem('token');
      if (!token && typeof window !== 'undefined') {
        const oidcKey = Object.keys(sessionStorage).find(k => k.startsWith('oidc.user:'));
        if (oidcKey) {
          try {
            const oidcUser = JSON.parse(sessionStorage.getItem(oidcKey) || '{}');
            token = oidcUser.id_token;
          } catch {}
        }
      }
      
      const res = await fetch('/api/collect-artifact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ questId: activeQuest.quest_id, artefactId: artefact.id })
      });
      
      const data = await res.json();
      
      if (data.success) {
        if (data.alreadyCollected) {
          setSubmitStatus('already');
        } else {
          setSubmitStatus('success');
        }
        const newProgress: QuestProgress = {
          collectedArtefactIds: data.collectedArtefactIds || [],
          completed: data.completed || false,
          completedAt: data.completedAt,
          attempts: data.attempts || 0,
          lastAttemptedArtefactId: data.lastAttemptedArtefactId
        };
        setProgress(newProgress);
      } else if (!data.success && data.error) {
        // Handle incorrect answers (both wrong artefact and wrong sequence)
        setSubmitStatus('error');
        
        // Update attempts counter from the response
        if (data.attempts !== undefined && data.progress) {
          const updatedProgress: QuestProgress = {
            collectedArtefactIds: data.progress.collectedArtefactIds || progress?.collectedArtefactIds || [],
            completed: data.progress.completed || false,
            completedAt: data.progress.completedAt,
            attempts: data.attempts,
            lastAttemptedArtefactId: data.lastAttemptedArtefactId
          };
          setProgress(updatedProgress);
        }
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitStatus('error');
    }
  };

  if (!isOpen) return null;
  if (loading) return <div className="p-8 text-center">Loading artefact...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return artefact ? (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
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
              {(artefact.components?.length ?? 0) > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Page Content</h2>
                  <div className="space-y-4">
                    {artefact.components?.map((component: ComponentData) => {
                      switch (component.type) {
                        case 'heading':
                          return <h3 key={component.id} className="text-2xl font-bold">{typeof component.content === 'string' ? component.content : ''}</h3>;
                        case 'paragraph':
                          return <p key={component.id} className="text-base">{typeof component.content === 'string' ? component.content : ''}</p>;
                        case 'image':
                          interface ImageContent {
                            url: string;
                          }
                          const imageContent = component.content as ImageContent;
                          return (
                            <div key={component.id} className="w-full flex justify-center">
                              <Image
                                src={imageContent.url}
                                alt="Artifact Image"
                                width={500}
                                height={350}
                                className="rounded-lg object-contain"
                              />
                            </div>
                          );
                        case 'restoration':
                          interface Restoration {
                            id?: string;
                            name: string;
                            date: string;
                            description: string;
                            imageUrl?: string;
                            organization?: string;
                          }
                          interface RestorationContent {
                            restorations?: Restoration[];
                          }
                          const restorationContent = component.content as RestorationContent;
                          return (
                            <div key={component.id} className="border rounded-lg p-4">
                              <h4 className="font-semibold mb-2">Restoration Timeline</h4>
                              <ol className="list-decimal ml-6">
                                {restorationContent.restorations?.map((rest: Restoration, idx: number) => (
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
                          const details = component.content as DetailsContent;
                          return (
                            <div key={component.id} className="border rounded-lg p-4">
                              <h4 className="font-semibold mb-2">Details</h4>
                              <ul className="text-sm">
                                <li><b>Created:</b> {details.created}</li>
                                <li><b>Origin:</b> {details.origin}</li>
                                <li><b>Dimensions:</b> {details.dimensions}</li>
                                <li><b>Materials:</b> {details.materials}</li>
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
                  While we are preparing the detailed historical context for this artefact, 
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
              {activeQuest && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col gap-2">
                  <h3 className="font-medium text-blue-800 mb-1">Quest Artefact</h3>
                  <p className="text-sm text-blue-700">
                    This artefact is part of your active quest. Submit it to mark as found!
                  </p>
                  <Button onClick={handleSubmit} variant="default">
                    Submit as Quest Answer
                  </Button>
                  {isSequential && !isNextSequential && submitStatus === 'error' && (
                    <span className="text-yellow-600 font-medium">Incorrect artefact for this step. Try another.</span>
                  )}
                  {submitStatus === 'success' && <span className="text-green-600 font-medium">Artefact submitted!</span>}
                  {submitStatus === 'already' && <span className="text-blue-600 font-medium">Already submitted.</span>}
                  {submitStatus === 'error' && !isSequential && <span className="text-red-600 font-medium">Error submitting. Try again.</span>}
                </div>
              )}
            </div>
          </div>

          {/* Gallery section */}
          <div className="pt-8">
            <h2 className="text-xl font-semibold mb-6">Gallery</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {artefact.components?.filter((c: ComponentData) => c.type === 'image').map((c: ComponentData, i: number) => (
                <div key={c.id || i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={(c.content as { url: string }).url}
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