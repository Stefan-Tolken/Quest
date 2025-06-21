// components/ui/quests.tsx
'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useData } from '@/context/dataContext';
import { useQuest } from '@/context/questContext';
import { useUserData } from '@/hooks/useUserData'; // Import the user data hook
import { Button } from '@/components/ui/button';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { CalendarDays, Trophy, MapPin, Gift, Info } from 'lucide-react';
import type { Hint, QuestProgress, MainQuest } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { HintsToDisplay } from "@/components/ui/hintsToDisplay";
import Image from "next/image"

function parseDate(date?: string | Date): Date | undefined {
  return date ? new Date(date) : undefined;
}

function isMainQuest(q: unknown): q is MainQuest {
  if (!q || typeof q !== 'object') return false;
  const quest = q as MainQuest;
  return typeof quest.title === 'string' && 
         typeof quest.quest_id === 'string' &&
         Array.isArray(quest.artefacts);
}

interface QuestsProps {
  initialTab?: 'ongoing' | 'upcoming' | 'completed';
}

export default function Quests({ initialTab = 'ongoing' }: QuestsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { quests, loading, error } = useData();
  const { activeQuest, acceptQuest, cancelQuest, checkQuestCompletion } = useQuest();
  const { userData } = useUserData(); // Get user data to check completed quests
  const [progress, setProgress] = useState<QuestProgress | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);
  
  // Filter state - initialize based on initialTab prop
  const [ongoing, setOngoing] = useState(initialTab === 'ongoing');
  const [upcoming, setUpcoming] = useState(initialTab === 'upcoming');
  const [completed, setCompleted] = useState(initialTab === 'completed');

  // Update state when initialTab prop changes
  useEffect(() => {
    if (initialTab === 'completed') {
      setOngoing(false);
      setUpcoming(false);
      setCompleted(true);
    } else if (initialTab === 'upcoming') {
      setOngoing(false);
      setUpcoming(true);
      setCompleted(false);
    } else {
      setOngoing(true);
      setUpcoming(false);
      setCompleted(false);
    }
  }, [initialTab]);
  
  // Get the single attempts number
  const getAttempts = useCallback((): number => {
    return progress?.attempts || 0;
  }, [progress]);

  // Handler for progress updates
  const handleProgressUpdate = useCallback((updates: Partial<QuestProgress>) => {
    setProgress(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        ...updates,
        collectedArtefactIds: updates.collectedArtefactIds || prev.collectedArtefactIds,
        displayedHints: {
          ...prev.displayedHints,
          ...(updates.displayedHints || {})
        }
      };
    });
  }, []);

  // Get completed quest data
  const getCompletedQuestData = useCallback((questId: string) => {
    return userData?.completed_quests?.find(completedQuest => 
      completedQuest.questId === questId
    );
  }, [userData?.completed_quests]);

  useEffect(() => {
    // Debug logs to track quest completion flow
    console.log('Quest completion check - Conditions:', {
      isMainQuest: isMainQuest(activeQuest),
      hasProgress: !!progress?.collectedArtefactIds,
      notCompleted: !progress?.completed,
      hasArtefacts: (activeQuest?.artefacts?.length ?? 0) > 0,
      collectedCount: progress?.collectedArtefactIds?.length ?? 0,
      totalArtefacts: activeQuest?.artefacts?.length ?? 0
    });

    // Only run completion check when we have all necessary data
    if (
      isMainQuest(activeQuest) && 
      progress?.collectedArtefactIds && 
      !progress?.completed && 
      activeQuest.artefacts.length > 0
    ) {
      const totalArtefacts = activeQuest.artefacts.length;
      const collectedCount = progress.collectedArtefactIds.length;
      
      console.log('Checking completion:', {
        totalArtefacts,
        collectedCount,
        shouldComplete: collectedCount >= totalArtefacts
      });
      
      // Only check completion if we have collected all artefacts
      if (collectedCount >= totalArtefacts) {
        console.log('Calling checkQuestCompletion with:', progress.collectedArtefactIds);
        checkQuestCompletion(progress.collectedArtefactIds);
      }
    }
  }, [activeQuest, progress?.collectedArtefactIds, progress?.completed, checkQuestCompletion]);

  const handleError = useCallback((err: unknown) => {
    console.error(err);
    setProgressError('Could not load progress');
    setProgressLoading(false);
  }, [setProgressError, setProgressLoading]);

  const loadQuestProgress = useCallback(async (questId: string) => {
    setProgressLoading(true);
    setProgressError(null);

    try {
      let token = localStorage.getItem('token');
      if (!token && typeof window !== 'undefined') {
        const oidcKey = Object.keys(sessionStorage).find(k => k.startsWith('oidc.user:'));
        if (oidcKey) {
          const oidcUser = JSON.parse(sessionStorage.getItem(oidcKey) || '{}');
          token = oidcUser.id_token;
        }
      }

      const response = await fetch(`/api/user-quest-progress?questId=${questId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quest progress');
      }

      const data = await response.json();
      setProgress(data);
    } catch (error) {
      handleError(error);
    } finally {
      setProgressLoading(false);
    }
  }, [handleError, setProgress, setProgressError, setProgressLoading]);

  useEffect(() => {
    if (isMainQuest(activeQuest)) {
      loadQuestProgress(activeQuest.quest_id);
    } else {
      setProgress(null);
    }
  }, [activeQuest, loadQuestProgress, setProgress]);

  // Check if a quest is completed by the user
  const isQuestCompleted = useCallback((questId: string): boolean => {
    return userData?.completed_quests?.some(completedQuest => 
      completedQuest.questId === questId
    ) ?? false;
  }, [userData?.completed_quests]);

  const isDataLoading = loading || !quests?.length || !userData?.completed_quests;

  const { ongoingQuests, upcomingQuests, completedQuests, questToShow } = useMemo(() => {
    const ongoing: MainQuest[] = [];
    const upcoming: MainQuest[] = [];
    const completed: MainQuest[] = [];
    let toShow: MainQuest | null = null;

    if (isDataLoading) {
      return { ongoingQuests: [], upcomingQuests: [], completedQuests: [], questToShow: null };
    }

    const now = new Date();

    for (const quest of quests) {
      if (isMainQuest(quest)) {
        const from = parseDate(quest.dateRange?.from);
        const to = parseDate(quest.dateRange?.to);
        const isAccepted = activeQuest?.quest_id === quest.quest_id;
        const isCompleted = isQuestCompleted(quest.quest_id);

        if (isCompleted) {
          completed.push(quest);
        } else if (isAccepted) {
          toShow = quest;
        } else if (from && from > now) {
          upcoming.push(quest);
        } else if (from && from <= now && (!to || to > now)) {
          ongoing.push(quest);
        }
      }
    }

    return {
      ongoingQuests: ongoing,
      upcomingQuests: upcoming,
      completedQuests: completed,
      questToShow: toShow,
    };
  }, [quests, activeQuest, isQuestCompleted, isDataLoading]);

  if (loading) {
    return (
      <>
        {/* Top Buttons Skeleton */}
        <div className="fixed z-50 top-0 left-0 flex justify-evenly gap-6 items-center p-6 w-full">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="flex-1 h-10 rounded-lg glass animate-pulse"
            />
          ))}
        </div>

        {/* Scrollable area with placeholder cards */}
        <ScrollArea className="h-full max-w-full mx-6 pt-20 pb-13 rounded-xl">
          <div className="space-y-6">
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="animate-pulse space-y-4 glass p-4 rounded-xl">
                <div className="h-6 w-1/2 glass rounded" />
                <div className="h-4 w-3/4 glass rounded" />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-14 glass rounded" />
                  ))}
                </div>
                <div className="h-10 w-full glass rounded mt-4" />
              </div>
            ))}
          </div>
        </ScrollArea>
      </>
    );
  }

  if (isDataLoading) {
    return (
      <>
        {/* Top Buttons Skeleton */}
        <div className="fixed z-50 top-0 left-0 flex justify-evenly gap-6 items-center p-6 w-full">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="flex-1 h-10 rounded-lg glass animate-pulse"
            />
          ))}
        </div>

        {/* Scrollable area with placeholder cards */}
        <ScrollArea className="h-full max-w-full mx-6 pt-20 pb-13 rounded-xl">
          <div className="space-y-6">
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="animate-pulse space-y-4 glass p-4 rounded-xl">
                <div className="h-6 w-1/2 glass rounded" />
                <div className="h-4 w-3/4 glass rounded" />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-14 glass rounded" />
                  ))}
                </div>
                <div className="h-10 w-full glass rounded mt-4" />
              </div>
            ))}
          </div>
        </ScrollArea>
      </>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-primary/70 text-primary-foreground p-2 rounded-md">Error Loading Quests: {error}</div>
      </div>
    );
  }

  if (!quests?.length) {
    return (
      <div className="p-6">
        <div className="bg-primary/70 text-primary-foreground p-2 rounded-md">No quests available at this time</div>
      </div>
    );
  }

  // Determine which artefacts to display based on quest type
  const getVisibleArtefacts = (questType: 'sequential' | 'random' | undefined, artefacts: MainQuest['artefacts'], progress: QuestProgress) => {
    if (questType === 'random' && !progress.completed) {
      const uncollectedArtefacts = artefacts.filter(
        a => !progress.collectedArtefactIds?.includes(a.artefactId)
      );
      if (uncollectedArtefacts.length > 0) {
        return [uncollectedArtefacts[Math.floor(Math.random() * uncollectedArtefacts.length)]];
      }
    }
    return artefacts;
  };

  // Get hints to display for an artefact based on its hint display mode and attempts
  const getHintsToDisplay = (artefact: MainQuest['artefacts'][0], attempts: number, progress: QuestProgress): Hint[] => {
    if (attempts === 0 || !progress.startTime) {
      return [];
    }

    // Filter hints based on the number of attempts
    const eligibleHints = artefact.hints.filter(hint => {
      if (attempts < hint.displayAfterAttempts) {
        return false;
      }
      return true;
    });

    if (eligibleHints.length === 0) {
      return [];
    }

    if (artefact.hintDisplayMode === 'random') {
      // Get unshown hints for the current artefact
      const unshownHints = eligibleHints.filter((_, idx) => {
        const hintKey = `${artefact.artefactId}-${idx}`;
        return !progress.displayedHints[hintKey];
      });

      if (unshownHints.length === 0) {
        return [];
      }

      // Return a random unshown hint
      return [unshownHints[Math.floor(Math.random() * unshownHints.length)]];
    }

    // For sequential hints, return all eligible hints in order
    return eligibleHints;
  };

  const handleOngoing = () => {
    setOngoing(true);
    setUpcoming(false);
    setCompleted(false);
  }

  const handleUpcoming = () => {
    setOngoing(false);
    setUpcoming(true);
    setCompleted(false);
  }

  const handleCompleted = () => {
    setOngoing(false);
    setUpcoming(false);
    setCompleted(true);
  }

  return (
    <>
      <div className="fixed z-50 top-0 left-0 flex justify-evenly gap-6 items-center p-6 w-full">
        <Button
          variant={`${ongoing && !questToShow ? 'glassDark' : 'glass'}`}
          className={`flex-1 font-bold`}
          onClick={handleOngoing}
          disabled={questToShow ? true : false}
        >Ongoing</Button>
        <Button
          variant={`${upcoming && !questToShow ? 'glassDark' : 'glass'}`}
          className={`flex-1 font-bold`} 
          onClick={handleUpcoming}
          disabled={questToShow ? true : false}
        >Upcoming</Button>
        <Button
          variant={`${completed && !questToShow ? 'glassDark' : 'glass'}`}
          className={`flex-1 font-bold`}
          onClick={handleCompleted}
          disabled={questToShow ? true : false}
        >Completed</Button>
      </div>  

      <ScrollArea className="h-full max-w-full mx-6 pt-20 pb-13 rounded-xl">
        <div className="space-y-10">
          {/* Accepted Quest Section */}
          {questToShow && (
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>{questToShow.title}</CardTitle>
                  <CardDescription>{questToShow.description}</CardDescription>
                </CardHeader>

                <CardContent className="grid grid-cols-1 gap-4">
                  {/* Quest Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    {questToShow.dateRange && (
                      <div className="flex items-start gap-3">
                        <CalendarDays className="h-4 w-4 mt-0.5 text-foreground" />
                        <div>
                          <p className="font-medium">Available Until</p>
                          <p className="text-foreground">
                            {questToShow.dateRange.to ? new Date(questToShow.dateRange.to).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 mt-0.5 text-foreground" />
                      <div>
                        <p className="font-medium">Artefacts</p>
                        <p className="text-foreground">
                          {questToShow.artefacts.length} to discover
                        </p>
                      </div>
                    </div>
                    {questToShow.prize?.title ? (
                      <div className="flex items-start gap-3">
                        <Trophy className="h-4 w-4 mt-0.5 text-foreground" />
                        <div className="flex flex-row items-center justify-center gap-2">
                          <div>
                            <div className="font-medium flex justify-between">
                              <p>Prize</p>
                              {questToShow.prize.description && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="subtle" size="sm" className="h-6 w-6">
                                    <Info className="h-6 w-6" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Prize Details</DialogTitle>
                                  </DialogHeader>
                                  <div className="py-4">
                                    <p className="text-sm text-black">
                                      {questToShow.prize.description}
                                    </p>
                                  </div>
                                  <DialogFooter>
                                    <DialogClose asChild>
                                      <Button type="button" variant="glass">
                                        Close
                                      </Button>
                                    </DialogClose>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}
                            </div>
                            <p className="text-foreground">{questToShow.prize.title}</p>
                          </div>
                        </div>
                      </div>
                    ): (
                      <div className="flex items-start gap-3">
                        <p className="font-medium">No Prize</p>
                        <p className="text-foreground">This one is just for fun</p>
                      </div>
                    )}
                  </div>              
                  
                  {/* Hints Section */}
                  {questToShow && progress && (
                    <div className="mt-4">
                      {/* Progress display */}
                      {progressLoading ? (
                        <h3 className="font-medium mb-3">Loading progress...</h3>
                      ) : progressError ? (
                        <h3 className="font-medium mb-3">{progressError}</h3>
                      ) : progress ? (
                        <div className="w-full flex items-center gap-2">
                          <h3 className="font-medium mb-3">Artefact(s) To Collect: {progress.collectedArtefactIds.length} / {questToShow.artefacts.length}</h3>
                        </div>
                      ) : null}
                      <div className="space-y-3">
                        {getVisibleArtefacts(questToShow.questType, questToShow.artefacts, progress).map((artefact) => {
                          const originalIndex = questToShow.artefacts.findIndex(a => a.artefactId === artefact.artefactId);
                          const isCollected = progress.collectedArtefactIds?.includes(artefact.artefactId);
                          const isNextInSequence = !progress.completed && 
                            questToShow.questType === 'sequential' && 
                            originalIndex === (progress.collectedArtefactIds?.length || 0);
                          const attempts = getAttempts();

                          if (questToShow.questType === 'sequential' && !isCollected && !isNextInSequence) {
                            return null;
                          }

                          const hintsToDisplay = getHintsToDisplay(artefact, attempts, progress);

                          return (
                            <div 
                              key={artefact.artefactId}
                              className={`flex flex-col rounded-lg p-4 ${
                                isNextInSequence
                                  ? 'glass bg-blue-500/20'
                                  : 'glass'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div className='flex justify-between items-center gap-2'>
                                  {isNextInSequence && !progress.completed && (
                                    <span className="ml-2 text-blue-600 text-sm">Current Target: </span>
                                  )}
                                  <span className="font-medium">{artefact.name}</span>
                                </div>
                              </div>
                              {/* Show hints section */}
                              {!isCollected && !progress.completed && !(artefact.hints.length === 0) && (
                                <div className="space-y-2 mt-3">
                                  <HintsToDisplay
                                    artefact={artefact}
                                    questId={questToShow.quest_id}
                                    hints={hintsToDisplay}
                                    attempts={attempts}
                                    isCollected={isCollected}
                                    completed={progress.completed}
                                    displayedHints={progress.displayedHints}
                                    onUpdateProgress={handleProgressUpdate}
                                  />
                                  {/* Show "Next Hint" only if there are more hints to unlock */}
                                  {attempts < artefact.hints.length && (
                                    <div className="text-sm glass p-3 rounded-md">
                                      <div className="flex gap-2 items-center">
                                        <span className="font-medium text-foreground">Next Hint</span>
                                        <span className="text-foreground text-xs">
                                          (Unlocks after you scan again)
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex flex-col gap-2 items-stretch">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="glassDestructive">Stop Quest</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>
                          All the progress you made in this quest will be lost.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="flex flex-row gap-2">
                        <DialogClose asChild>
                          <Button type="button" variant="glass" className='flex-1'>
                            Cancel
                          </Button>
                        </DialogClose>
                        <Button 
                          onClick={cancelQuest}
                          variant="glassDestructive"
                          className="flex-1"
                        >
                          Delete progress
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            </div>
          )}

          {/* Ongoing Quests Section */}
          {ongoingQuests.length > 0 && !questToShow && ongoing &&(
            <div className="m-0 mb-6">
              <div className="grid gap-6">
                {ongoingQuests.map((quest) => (
                  <Card key={quest.quest_id}>
                    <CardHeader>
                      <CardTitle>{quest.title}</CardTitle>
                      <CardDescription>{quest.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      {quest.dateRange && (
                        <div className="flex items-start gap-3">
                          <CalendarDays className="h-4 w-4 mt-0.5" />
                          <div>
                            <p className="font-medium">Available Until</p>
                            <p>
                              {quest.dateRange.to ? new Date(quest.dateRange.to).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 mt-0.5" />
                        <div>
                          <p className="font-medium">Artefacts</p>
                          <p>{quest.artefacts.length} to discover</p>
                        </div>
                      </div>
                      {quest.prize?.title ? (
                        <div className="flex items-start gap-3">
                          <Trophy className="h-4 w-4 mt-0.5 text-foreground" />
                          <div>
                            <p className="font-medium">Prize</p>
                            <p className="text-foreground">{quest.prize.title}</p>
                          </div>  
                        </div>
                      ): (
                        <div className="flex items-start gap-3">
                          <Trophy className="h-4 w-4 mt-0.5 text-foreground" />
                          <div>
                            <p className="font-medium">No Prize</p>
                            <p className="text-foreground">This one is just for fun</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button
                        onClick={() => acceptQuest(quest)}
                        variant="glass"
                        className="w-full sm:w-auto"
                      >
                        Accept Quest
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Quests Section */}
          {upcomingQuests.length > 0 && !questToShow && upcoming && (
            <div>
              <div className="grid gap-6">
                {upcomingQuests.map((quest) => (
                  <Card key={quest.quest_id}>
                    <CardHeader>
                      <CardTitle>{quest.title}</CardTitle>
                      <CardDescription>{quest.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      {quest.dateRange && (
                        <div className="flex items-start gap-3">
                          <CalendarDays className="h-4 w-4 mt-0.5" />
                          <div>
                            <p className="font-medium">Available From</p>
                            <p>
                              {quest.dateRange.from ? new Date(quest.dateRange.from).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 mt-0.5" />
                        <div>
                          <p className="font-medium">Artefacts</p>
                          <p>{quest.artefacts.length} to discover</p>
                        </div>
                      </div>
                      {quest.prize?.title ? (
                        <div className="flex items-start gap-3">
                          <Trophy className="h-4 w-4 mt-0.5 text-foreground" />
                          <div>
                            <p className="font-medium">Prize</p>
                            <p className="text-foreground">{quest.prize.title}</p>
                          </div>  
                        </div>
                          ): (
                          <div className="flex items-start gap-3">
                            <Trophy className="h-4 w-4 mt-0.5 text-foreground" />
                            <div>
                              <p className="font-medium">No Prize</p>
                              <p className="text-foreground">This one is just for fun</p>
                            </div>
                          </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button 
                        disabled 
                        variant="glassDestructive" 
                        className="w-full cursor-not-allowed"
                      >
                        Not Yet Available
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Completed Quests Section */}
          {completedQuests.length > 0 && !questToShow && completed && (
            <div>
              <div className="grid gap-6">
                {completedQuests.map((quest) => {
                  const completedQuestData = getCompletedQuestData(quest.quest_id);
                  return (
                    <Card key={quest.quest_id} className="border-green-200 bg-green-50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <span>{quest.title}</span>
                          <span className="text-green-600 text-sm">✓ Completed</span>
                        </CardTitle>
                        <CardDescription>{quest.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        {completedQuestData && (
                          <div className="flex items-start gap-3">
                            <CalendarDays className="h-4 w-4 mt-0.5 text-green-600" />
                            <div>
                              <p className="font-medium">Completed On</p>
                              <p className="text-green-700">
                                {new Date(completedQuestData.completedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 mt-0.5 text-green-600" />
                          <div>
                            <p className="font-medium">Quest Type</p>
                            <p className="text-green-700 capitalize">{quest.questType || 'Standard'}</p>
                          </div>
                        </div>
                        {quest.prize && (
                          <div className="flex items-start gap-3">
                            <Trophy className="h-4 w-4 mt-0.5 text-green-600" />
                            <div>
                              <p className="font-medium">Prize Earned</p>
                              <p className="text-green-700">{quest.prize.title}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="glass"
                              className="w-full !bg-green-200/40"
                              disabled={quest.prize?.title ? false : true }
                            >
                              <Gift className="h-4 w-4 mr-2" />
                              {quest.prize?.title? "View Prize" : "No prize available" }
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md gap-6">
                            <DialogHeader className="flex-1">
                              <DialogTitle>Prize for Completing {quest.title}</DialogTitle>
                            </DialogHeader>
                            
                            <div>
                              {quest.prize?.image ? (
                                <div className="w-full relative glass !bg-white rounded-md">
                                  <Image
                                    src={quest.prize?.image}
                                    alt={quest.prize?.title}
                                    width={1280}
                                    height={720}
                                    className="rounded-md object-cover w-full h-auto p-1"
                                    sizes="(max-width: 640px) 95vw, 100vw"
                                  />
                                </div>    
                              ) : ( 
                                <div>{quest.prize?.title}</div>
                              )}
                            </div>

                            <DialogFooter>
                              <DialogClose asChild>
                                <Button type="button" variant="glass">
                                  Close
                                </Button>
                              </DialogClose>
                            </DialogFooter> 
                          </DialogContent>
                        </Dialog>                        
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  );
}