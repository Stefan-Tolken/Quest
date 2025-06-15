// components/ui/artefactDetails.tsx
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { ArrowLeft, Calendar, MapPin, Ruler, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import QRCodeGenerator from '@/components/QRGenerator';
import { ComponentData } from '@/lib/types';
import { useQuest } from '@/context/questContext';
import { QuestProgress, ArtefactDetailProps } from '@/lib/types';
import { Artefact } from '@/lib/types';
import { useToast } from '@/components/ui/toast';
import CameraBackground from './cameraBackground';
import ImageWithPoints from './imageWithPoints';
import RestorationTimeline from './restorationTimeline';

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

  return artefact ? (
    <>
      <CameraBackground/>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="container max-w-6xl p-4 sm:px-6">
          {/* Header with back button */}
          <div className='fixed top-0 left-0 z-50 p-4 pr-5 w-[101%] bg-gradient-to-b from-black/70 to-transparent'>
            <div className="flex items-center justify-between">
              <Button
                onClick={handleClose}
                variant={"glass"}
              >
                <ArrowLeft size={24} /> Back
              </Button>
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
                {activeQuest && (
                  <Button onClick={handleSubmit} variant="glass" className="">
                    Submit Artefact to Quest
                  </Button>
                )}
            </div>
          </div>

          <div className="space-y-4 mt-13">
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left column - Description and Components */}
              <div className="lg:col-span-2 space-y-4">
                <div className='glass p-6 rounded-xl space-y-4'>
                  <h1 className="text-3xl font-bold tracking-tight mb-2">
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
                            return <h3 key={component.id} className="text-2xl font-bold">{typeof component.content === 'string' ? component.content : ''}</h3>;
                          case 'paragraph':
                            return <p key={component.id} className="text-base">{typeof component.content === 'string' ? component.content : ''}</p>;
                          case 'image':
                            return <ImageWithPoints key={component.id} component={component} />;
                          case 'restoration':
                            return <RestorationTimeline key={component.id} component={component} />;
                          case 'details': {
                            const details = component.content as any;
                            return (
                              <div key={component.id} className="border rounded-xl p-6">
                                <h2 className="text-xl font-semibold mb-4">Details</h2>
                                <div className="space-y-4">
                                  <div className="flex items-start gap-3">
                                    <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                    <div>
                                      <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                                      <p className="text-sm">{details.created || 'Not specified'}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-3">
                                    <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                    <div>
                                      <h3 className="text-sm font-medium text-muted-foreground">Origin</h3>
                                      <p className="text-sm">{details.origin || 'Not specified'}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-3">
                                    <Ruler className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                    <div>
                                      <h3 className="text-sm font-medium text-muted-foreground">Dimensions</h3>
                                      <p className="text-sm">{details.dimensions || 'Not specified'}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-3">
                                    <Box className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                    <div>
                                      <h3 className="text-sm font-medium text-muted-foreground">Materials</h3>
                                      <p className="text-sm">{details.materials || 'Not specified'}</p>
                                    </div>
                                  </div>
                                </div>
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
          </div>
        </div>
      </div>
    </>
  ) : (
    <></>
  );
}