// components/ui/artefactDetails.tsx
'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import { ArrowLeft, Calendar, MapPin, Ruler, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ComponentData } from '@/lib/types';
import { useQuest } from '@/context/questContext';
import Model3DViewer from '@/components/3dModel/3dModel';
import { QuestProgress, ArtefactDetailProps } from '@/lib/types';
import { Artefact } from '@/lib/types';
import { useToast } from '@/components/ui/toast';
import ImageWithPoints from './imageWithPoints';
import RestorationTimeline from './restorationTimeline';
import { ScrollArea } from './scroll-area';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';


export default function ArtefactDetail({ 
  artefactId,
  isOpen,
  onClose,
  onVisibilityChange 
}: ArtefactDetailProps) {
  const [artefact, setArtefact] = useState<Artefact | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<'idle'|'success'|'error'|'already'|null>(null);
  const [progress, setProgress] = useState<QuestProgress | null>(null);
  const { showToast } = useToast();
  const { activeQuest, checkQuestCompletion } = useQuest();  // Track whether we've shown the success message
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

  // Handle success/error notifications and quest completion check
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

      console.log('Artifact successfully submitted, checking quest completion...');
      checkQuestCompletion(progress.collectedArtefactIds);
    }
  }, [submitStatus, progress?.collectedArtefactIds, artefact?.name, checkQuestCompletion, showToast, hasShownSuccess]);

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
        } catch {
          console.warn('Failed to parse OIDC user from sessionStorage');
          token = null;
        }
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
            lastAttemptedArtefactId: data.lastAttemptedArtefactId,
            displayedHints: data.displayedHints || {}
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
    setViewArtefact(false);
    onClose();
  };

  // Check if this is a sequential quest and if this is the next artefact
  const questArtefacts = useMemo(
    () => (Array.isArray(activeQuest?.artefacts) ? activeQuest.artefacts : []),
    [activeQuest?.artefacts]
  );
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

  // Function to get the next hint for sequential quests
  const getNextHint = useCallback(() => {
    if (!isSequential || !activeQuest?.artefacts || !progress) return null;
    
    const foundIds = Array.isArray(progress.collectedArtefactIds) ? progress.collectedArtefactIds : [];
    const nextArtefact = questArtefacts.find((a: any) => {
      const artefactId = typeof a === 'object' && a !== null ? a.artefactId ?? '' : a ?? '';
      return !foundIds.includes(artefactId);
    });
    
    if (!nextArtefact || typeof nextArtefact !== 'object') return null;
    
    const hints = nextArtefact.hints || [];
    if (hints.length === 0) return null;
    
    // Get the number of attempts for this quest to determine which hint to show
    const attempts = progress.attempts || 0;
    
    // Show hints based on attempts: first hint after first attempt (attempts >= 1)
    // Cap at the last available hint
    const hintIndex = Math.min(Math.max(0, attempts - 1), hints.length - 1);
    
    return hints[hintIndex];
  }, [isSequential, activeQuest?.artefacts, progress, questArtefacts]);

  // Show toast for sequential quest wrong artifact error with hint
  useEffect(() => {
    if (isSequential && !isNextSequential && submitStatus === 'error') {
      const nextHint = getNextHint();
      const hintText = nextHint ? `Hint: ${nextHint.description}` : 'Incorrect artefact for this step. Try another.';
      showToast(hintText, 'warning', 10000);
    }
  }, [isSequential, isNextSequential, submitStatus, showToast, getNextHint]);

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
          } catch (error) {
            console.error('Error parsing OIDC user:', error);
          }
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
          lastAttemptedArtefactId: data.lastAttemptedArtefactId,
          displayedHints: data.displayedHints || {}
        };
        setProgress(newProgress);

        // If we have collected all artifacts, trigger quest completion
        if (activeQuest.artefacts.length > 0 && 
            data.collectedArtefactIds && 
            !data.completed) {
          console.log('Checking quest completion...', {
            totalArtefacts: activeQuest.artefacts.length,
            collectedArtefacts: data.collectedArtefactIds.length,
            collectedIds: data.collectedArtefactIds
          });
          
          if (data.collectedArtefactIds.length >= activeQuest.artefacts.length) {
            console.log('All artifacts collected, triggering completion check');
            // Force the quest completion check
            checkQuestCompletion(data.collectedArtefactIds);
          }
        }
      } else if (!data.success && data.error) {
        // Handle incorrect answers (both wrong artefact and wrong sequence)
        setSubmitStatus('error');
        
        // Update attempts counter from the response
        if (data.attempts !== undefined && data.progress) {
          const updatedProgress: QuestProgress = {
            collectedArtefactIds: progress?.collectedArtefactIds || [],
            completed: progress?.completed || false,
            completedAt: progress?.completedAt,
            attempts: data.attempts,
            lastAttemptedArtefactId: artefact.id,
            displayedHints: progress?.displayedHints || {}
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

  {/* Quest status */}
  {/* {activeQuest && (
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
  )} */}
  {/* Quest status */}

  return artefact ? (
    <>
      {activeQuest && !viewArtefact ? (
        <div className='p-6 w-full h-full flex justify-center items-center'>
          <div className='fixed top-0 left-0 z-50 p-6 pr-5 w-full'>
            <div className="flex items-center justify-between">
              <Button
                onClick={handleClose}
                variant={"glassDark"}
              >
                <ArrowLeft size={24} /> Back
              </Button>
            </div>
          </div>
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-xl">Ready to Submit?</CardTitle>
              <CardDescription>
                This artefact can be submitted to your active quest. Make sure you're happy with it — submissions are final!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  Submitting this artefact will mark it as part of your progress in <strong>your current quest</strong>.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between gap-6">
              <Button onClick={handleViewArtefact} variant="glass" className="flex-1">
                View Artefact
              </Button>
              <Button onClick={handleSubmit} variant="glassDark" className="flex-1">
                Submit to Quest
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : (
      <>
        <div className='fixed top-0 left-0 z-50 p-6 pr-5 w-full'>
          <div className="flex items-center justify-between">
            <Button
              onClick={handleClose}
              variant={"glassDark"}
            >
              <ArrowLeft size={24} /> Back
            </Button>
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
                                <div className="flex items-start gap-3">
                                  <MapPin className="mt-0.5 h-5 w-5 text-foreground" />
                                  <div>
                                    <h3 className="text-sm font-medium text-foreground">Origin</h3>
                                    <p className="text-sm">{details.origin || 'Not specified'}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3">
                                  <Ruler className="mt-0.5 h-5 w-5 text-foreground" />
                                  <div>
                                    <h3 className="text-sm font-medium text-foreground">Dimensions</h3>
                                    <p className="text-sm">{details.dimensions || 'Not specified'}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3">
                                  <Box className="mt-0.5 h-5 w-5 text-foreground" />
                                  <div>
                                    <h3 className="text-sm font-medium text-foreground">Materials</h3>
                                    <p className="text-sm">{details.materials || 'Not specified'}</p>
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
                            <div key={component.id} className="border rounded-xl p-6">
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
      )}
    </>
  ) : (
    <></>
  );
}