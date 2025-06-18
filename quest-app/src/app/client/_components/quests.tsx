// components/ui/quests.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useData } from '@/context/dataContext';
import { useQuest } from '@/context/questContext';
import { useUserData } from '@/hooks/useUserData'; // Import the user data hook
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { CalendarDays, Trophy, MapPin, Gift } from 'lucide-react';
import type { Hint, QuestProgress, MainQuest } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';

// Separate component for hints display to properly handle hooks
const HintsDisplay = ({ 
  artefact, 
  questId, 
  hints, 
  isCollected, 
  completed,
  displayedHints,
  onUpdateProgress 
}: { 
  artefact: MainQuest['artefacts'][0],
  questId: string,
  hints: Hint[],
  isCollected: boolean,
  completed: boolean,
  displayedHints: Record<string, boolean>,
  onUpdateProgress: (updates: Partial<QuestProgress>) => void
}) => {
  useEffect(() => {
    if (!isCollected && !completed) {
      hints.forEach((hint, idx) => {
        const hintKey = `${artefact.artefactId}-${idx}`;
        if (!displayedHints[hintKey]) {
          fetch(`/api/user-quest-progress`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              questId: questId,
              artefactId: artefact.artefactId,
              displayedHint: { [hintKey]: true }
            })
          }).catch(console.error);

          onUpdateProgress({
            displayedHints: {
              ...displayedHints,
              [hintKey]: true
            }
          });
        }
      });
    }
  }, [artefact.artefactId, hints, isCollected, completed, displayedHints, questId, onUpdateProgress]);

  return (
    <>
      {hints.map((hint, idx) => (
        <div 
          key={idx}
          className="text-sm bg-white p-3 rounded border border-gray-200"
        >
          <div className="flex gap-2 items-center">
            <span className="font-medium">Hint {idx + 1}</span>
          </div>
          <p className="mt-1 text-gray-600">{hint.description}</p>
        </div>
      ))}
    </>
  );
};

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

export default function Quests() {
  const { quests, loading, error } = useData();
  const { activeQuest, acceptQuest, cancelQuest, checkQuestCompletion } = useQuest();
  const { userData } = useUserData(); // Get user data to check completed quests
  const [progress, setProgress] = useState<QuestProgress | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [ongoing, setOngoing] = useState(true);
  const [upcoming, setUpcoming] = useState(false);
  const [completed, setCompleted] = useState(false);
  
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

  // Check if a quest is completed by the user
  const isQuestCompleted = useCallback((questId: string): boolean => {
    return userData?.completed_quests?.some(completedQuest => 
      completedQuest.questId === questId
    ) ?? false;
  }, [userData?.completed_quests]);

  // Get completed quest data
  const getCompletedQuestData = useCallback((questId: string) => {
    return userData?.completed_quests?.find(completedQuest => 
      completedQuest.questId === questId
    );
  }, [userData?.completed_quests]);

  // Placeholder function for viewing prize
  const handleViewPrize = useCallback((quest: MainQuest) => {
    const completedQuestData = getCompletedQuestData(quest.quest_id);
    alert(`Prize for "${quest.title}":\n${completedQuestData?.prize || quest.prize?.title || 'No prize information available'}`);
  }, [getCompletedQuestData]);

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

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Quests</h1>
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-6 space-y-4">
              <div className="h-6 w-3/4 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-4 w-full bg-gray-200 animate-pulse rounded"></div>
              <div className="h-4 w-2/3 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-10 w-32 bg-gray-200 animate-pulse rounded"></div>
            </div>
          ))}
        </div>
      </div>
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

  const now = new Date();
  let questToShow: MainQuest | null = null;
  const ongoingQuests: MainQuest[] = [];
  const upcomingQuests: MainQuest[] = [];
  const completedQuests: MainQuest[] = [];

  // Categorize quests
  for (const quest of quests) {
    if (isMainQuest(quest)) {
      const from = parseDate(quest.dateRange?.from);
      const to = parseDate(quest.dateRange?.to);
      const isAccepted = activeQuest?.quest_id === quest.quest_id;
      const isCompleted = isQuestCompleted(quest.quest_id);

      if (isCompleted) {
        completedQuests.push(quest);
      } else if (isAccepted) {
        questToShow = quest;
      } else if (from && from > now) {
        upcomingQuests.push(quest);
      } else if (from && from <= now && (!to || to > now)) {
        ongoingQuests.push(quest);
      }
    }
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
      {!questToShow && (
        <div className="fixed z-50 top-0 left-0 flex justify-evenly gap-6 items-center p-6 w-full">
          <Button
            variant="glass"
            className={`flex-1 font-bold ${ongoing ? '!bg-blue-500/60' : ''}`}
            onClick={handleOngoing}
          >Ongoing</Button>
          <Button
            variant="glass"
            className={`flex-1 font-bold ${upcoming ? '!bg-orange-500/60' : ''}`} 
            onClick={handleUpcoming}
          >Upcomming</Button>
          <Button
            variant="glass"
            className={`flex-1 font-bold ${completed ? '!bg-green-500/60' : ''}`}
            onClick={handleCompleted}
          >Completed</Button>
        </div>  
      )}
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
                        <CalendarDays className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Available Until</p>
                          <p className="text-muted-foreground">
                            {questToShow.dateRange.to ? new Date(questToShow.dateRange.to).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Artefacts</p>
                        <p className="text-muted-foreground">
                          {questToShow.artefacts.length} to discover
                        </p>
                      </div>
                    </div>
                    {questToShow.prize && (
                      <div className="flex items-start gap-3">
                        <Trophy className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Prize</p>
                          <p className="text-muted-foreground">{questToShow.prize.title}</p>
                        </div>
                      </div>
                    )}
                  </div>              
                  
                  {/* Hints Section */}
                  {questToShow && progress && (
                    <div className="mt-4">
                      <h3 className="font-medium text-blue-800 mb-3">Quest Progress & Hints</h3>
                      <div className="space-y-3">
                        {getVisibleArtefacts(questToShow.questType, questToShow.artefacts, progress).map((artefact) => {
                          const originalIndex = questToShow.artefacts.findIndex(a => a.artefactId === artefact.artefactId);
                          const isCollected = progress.collectedArtefactIds?.includes(artefact.artefactId);
                          const isNextInSequence = !progress.completed && 
                            questToShow.questType === 'sequential' && 
                            originalIndex === (progress.collectedArtefactIds?.length || 0);
                          const attempts = getAttempts();
                          const isLastAttempted = progress.lastAttemptedArtefactId === artefact.artefactId;

                          if (questToShow.questType === 'sequential' && !isCollected && !isNextInSequence) {
                            return null;
                          }

                          const hintsToDisplay = getHintsToDisplay(artefact, attempts, progress);

                          return (
                            <div 
                              key={artefact.artefactId}
                              className={`rounded-lg border p-4 ${
                                isNextInSequence
                                  ? 'bg-blue-50 border-blue-200'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <span className="font-medium">{artefact.name}</span>
                                  {isNextInSequence && !progress.completed && (
                                    <span className="ml-2 text-blue-600 text-sm">Current Target</span>
                                  )}
                                </div>
                                {(attempts > 0 && isLastAttempted && !isCollected) && (
                                  <span className="text-sm text-gray-500">
                                    Attempts: {attempts}
                                  </span>
                                )}
                              </div>
                              {/* Show hints section */}
                              {!isCollected && !progress.completed && artefact.hints && (
                                <div className="space-y-2 mt-3">
                                  <HintsDisplay
                                    artefact={artefact}
                                    questId={questToShow.quest_id}
                                    hints={hintsToDisplay}
                                    isCollected={isCollected}
                                    completed={progress.completed}
                                    displayedHints={progress.displayedHints}
                                    onUpdateProgress={handleProgressUpdate}
                                  />
                                  {artefact.hints.some(hint => attempts < hint.displayAfterAttempts) && (
                                    <div className="text-sm bg-gray-50 p-3 rounded border border-gray-200">
                                      <div className="flex gap-2 items-center">
                                        <span className="font-medium text-gray-400">Next Hint</span>
                                        <span className="text-gray-400 text-xs">
                                          (Unlocks after more attempts)
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
                  {/* Progress display */}
                  {progressLoading ? (
                    <div className="text-blue-500">Loading progress...</div>
                  ) : progressError ? (
                    <div className="text-red-500">{progressError}</div>
                  ) : progress ? (
                    <div className="w-full flex items-center gap-2">
                      <span className="font-medium">Artefacts found:</span>
                      <span>
                        {progress.collectedArtefactIds.length} / {questToShow.artefacts.length}
                      </span>
                    </div>
                  ) : null}

                  <Button 
                    onClick={cancelQuest}
                    variant="destructive"
                    className="w-full sm:w-auto"
                  >
                    Cancel Quest
                  </Button>
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
                      {quest.prize && (
                        <div className="flex items-start gap-3">
                          <Trophy className="h-4 w-4 mt-0.5" />
                          <div>
                            <p className="font-medium">Prize</p>
                            <p>{quest.prize.title}</p>
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
                      {quest.prize && (
                        <div className="flex items-start gap-3">
                          <Trophy className="h-4 w-4 mt-0.5" />
                          <div>
                            <p className="font-medium">Prize</p>
                            <p>{quest.prize.title}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button 
                        disabled 
                        variant="destructive" 
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
                      <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                            <p className="font-medium">Artefacts Found</p>
                            <p className="text-green-700">{quest.artefacts.length} / {quest.artefacts.length}</p>
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
                        <Button
                          onClick={() => handleViewPrize(quest)}
                          variant="outline"
                          className="w-full sm:w-auto border-green-300 text-green-700 hover:bg-green-100"
                        >
                          <Gift className="h-4 w-4 mr-2" />
                          View Prize
                        </Button>
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