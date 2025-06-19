// components/ui/artefactDetails.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { ArrowLeft, Calendar, MapPin, Ruler, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ComponentData } from '@/lib/types';
import { useQuest } from '@/context/questContext';
import Model3DViewer from '@/components/3dModel/3dModel';
import { ArtefactDetailProps } from '@/lib/types';
import { Artefact } from '@/lib/types';
import { useToast } from '@/components/ui/toast';
import ImageWithPoints from './imageWithPoints';
import RestorationTimeline from './restorationTimeline';
import { ScrollArea } from './scroll-area';
import SubmitDialog from '@/components/ui/submitDialog';

export default function ArtefactDetail({ 
  artefactId,
  isOpen,
  onClose,
  onVisibilityChange,
}: ArtefactDetailProps) {
  const [artefact, setArtefact] = useState<Artefact | null>(null);
  const [loading, setLoading] = useState(false);
  const [finalSubmission, setFinalSubmission] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<'idle'|'success'|'error'|'already'|null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { showToast } = useToast();
  const { 
    activeQuest, 
    progress, 
    submitArtefact: questSubmitArtefact,
    isNextSequential
  } = useQuest();
  
  // Track whether we've shown the success message
  const [hasShownSuccess, setHasShownSuccess] = useState(false);
  const [viewArtefact, setViewArtefact] = useState(true);
  const hasResetRef = useRef(false);

  useEffect(() => {
    if (activeQuest && !hasResetRef.current) {
      setViewArtefact(false);
      hasResetRef.current = true;
    }

    // Reset the ref if quest deactivates so it's ready for the next activation
    if (!activeQuest) {
      hasResetRef.current = false;
    }
  }, [activeQuest]);

  // Handle success/error notifications
  useEffect(() => {
    if (!submitStatus) {
      setHasShownSuccess(false);
      return;
    }

    if (submitStatus === 'success' && progress?.collectedArtefactIds && !hasShownSuccess) {
      // Only show toast on the first success
      setHasShownSuccess(true);
      const successMessage = `${artefact?.name} collected successfully!`;
      showToast(successMessage, 'success', 10000);
    }
  }, [submitStatus, progress?.collectedArtefactIds, artefact?.name, showToast, hasShownSuccess]);

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
    setViewArtefact(false);
    console.log(viewArtefact);
    onClose();
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setFinalSubmission(false);
    setSubmitStatus(null);
  }

  // Submit artefact using centralized quest context
  const handleSubmit = async () => {
    if (!activeQuest || !artefact?.id) return;
    setSubmitStatus(null);
    
    try {
      const result = await questSubmitArtefact(artefact.id);

      const artefactLength = activeQuest.artefacts.length;
      const currentArtefactLength = progress?.collectedArtefactIds.length; 
      
      if (result.success) {
        if (currentArtefactLength && (currentArtefactLength + 1 >= artefactLength)) {
          setFinalSubmission(true);
        }
        setSubmitStatus(result.status);
      } else {
        setSubmitStatus('error');
        // Show error message from centralized logic
        if (result.message) {
          setMessage(result.message);
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitStatus('error');
      showToast('Error submitting. Try again.', 'error', 5000);
    }
  };

  if (!isOpen) return null;
  
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-primary/70 text-primary-foreground p-2 rounded-md">Error: {error}</div>;
      </div>
    );
  }

  const handleViewArtefact = () => {
    setViewArtefact(true);
    console.log('Viewing artefact:', artefact?.name);
  };

  return artefact ? (
    <>
      <div className='fixed top-0 left-0 z-50 p-6 pr-5 w-full'>
        <div className="flex items-center justify-between">
          <Button
            onClick={handleClose}
            variant={"glass"}
          >
            <ArrowLeft size={24} /> Back
          </Button>
          {activeQuest || finalSubmission ? (
            <SubmitDialog
              open={dialogOpen}
              onClose={handleDialogClose}
              scanResult={artefactId}
              submitStatus={submitStatus}
              message={message}
              activeQuest={activeQuest}
              handleSubmit={handleSubmit}
              handleViewArtefact={handleViewArtefact}
              finalSubmission={finalSubmission}
            >
              <Button onClick={() => setDialogOpen(true)} variant="glassDark">Submit Artefact</Button>
            </SubmitDialog>
          ) : (<></>)}
        </div>
      </div>
      <ScrollArea className="h-full flex max-w-full mx-6 pt-20 pb-6 rounded-xl">
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100 mb-4">
          <Image
            src={typeof artefact.image === 'string' && artefact.image ? artefact.image : `/api/placeholder/${artefact.id}`}
            alt={artefact.name}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left column - Description and Components */}
          <div className="lg:col-span-2 space-y-4 glass p-6 rounded-xl">
            <div className='pace-y-4'>
              <h1 className="text-3xl text-center font-bold tracking-tight mb-2">
                {artefact.name}
              </h1>
              <div className="prose max-w-none">
                <p className="text-lg">{artefact.description}</p>
              </div>
            </div>

            {/* Render components in order */}
            {(artefact.components?.length ?? 0) > 0 && (
              <div>
                <div className="space-y-4">
                  {artefact.components?.map((component: ComponentData) => {
                    switch (component.type) {
                      case 'heading':
                        return <h3 key={component.id} className="text-center text-2xl font-bold">{typeof component.content === 'string' ? component.content : ''}</h3>;
                      case 'subheading':
                        return <h3 key={component.id} className="text-lg font-semibold">{typeof component.content === 'string' ? component.content : ''}</h3>;
                      case 'paragraph':
                        return <p key={component.id} className="text-base">{typeof component.content === 'string' ? component.content : ''}</p>;
                      case 'image':
                        return <ImageWithPoints key={component.id} component={component} />;
                      case 'restoration':
                        return <RestorationTimeline key={component.id} component={component} />;
                      case 'details': {
                        const details = component.content as any;
                        return (
                          <div key={component.id} className="">
                            <h3 className="text-2xl text-center font-semibold mb-4">Details</h3>
                            <div className="space-y-4">
                              <div className="flex items-start gap-3">
                                <Calendar className="mt-0.5 h-5 w-5 text-foreground" />
                                <div>
                                  <h3 className="text-sm font-medium text-foreground">Created</h3>
                                  <p className="text-sm">{details.created || 'Not specified'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      case '3DModel': {
                        const model = component.content as any;
                        // Model3DViewer expects a modelUrl prop
                        // Defensive: if model is a string, treat as URL; if object, use model.url
                        let modelUrl = '';
                        if (typeof model === 'string') {
                          modelUrl = model;
                        } else if (model && typeof model.url === 'string') {
                          modelUrl = model.url;
                        }
                        // Import Model3DViewer at the top if not already imported
                        // Render the 3D model viewer
                        return (
                          <div key={component.id} className="">
                            {modelUrl ? (
                              <Model3DViewer modelUrl={modelUrl} />
                            ) : (
                              <p className="text-sm">Not specified</p>
                            )}
                          </div>
                        );
                      }
                      default:
                        return null;
                    }
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </>
  ) : (
    <></>
  );
}