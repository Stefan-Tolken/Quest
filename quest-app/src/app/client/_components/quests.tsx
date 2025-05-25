// components/ui/quests.tsx
'use client';
import { useData } from '@/context/dataContext';
import { useQuest } from '@/context/questContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { CalendarDays, Trophy, MapPin } from 'lucide-react';
import type { Quest as MainQuest } from "@/lib/types";
import { useEffect, useState } from 'react';

export default function Quests() {
  const { quests, loading, error } = useData();
  const { activeQuest, acceptQuest, cancelQuest } = useQuest();

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
        <h1 className="text-2xl font-bold mb-4">Quests</h1>
        <div className="text-red-500">Error loading quests: {error}</div>
      </div>
    );
  }

  if (!quests.length) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Quests</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No quests available at this time</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Helper to parse dates safely
  const parseDate = (date: any) => (date ? new Date(date) : undefined);
  const now = new Date();

  // Categorize quests
  let acceptedQuest: MainQuest | null = null;
  const ongoingQuests: MainQuest[] = [];
  const upcomingQuests: MainQuest[] = [];

  for (let i = 0; i < quests.length; i++) {
    const quest = quests[i] as MainQuest;
    const from = parseDate(quest.dateRange?.from);
    const to = parseDate(quest.dateRange?.to);
    const isAccepted = activeQuest?.quest_id === quest.quest_id;

    if (isAccepted) {
      acceptedQuest = quest;
      continue;
    }
    if (from && from > now) {
      upcomingQuests.push(quest);
    } else if (from && from <= now && (!to || to > now)) {
      ongoingQuests.push(quest);
    }
    // Past quests (to && to < now) are not shown
  }

  // Type guard for acceptedQuest
  function isMainQuest(q: any): q is MainQuest {
    return q && typeof q === 'object' && typeof q.title === 'string' && typeof q.quest_id === 'string';
  }

  let questToShow: MainQuest | null = null;
  if (isMainQuest(acceptedQuest)) {
    questToShow = acceptedQuest;
  }
  // User quest progress state
  const [progress, setProgress] = useState<{ 
    collectedArtefactIds: string[]; 
    completed: boolean; 
    completedAt?: string | null;
    attempts: number[]; // Track attempts as array of numbers
  } | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);

  // Helper function to get attempts for a specific artifact
  const getAttempts = (artifactIndex: number) => {
    if (!progress?.attempts) return 0;
    return progress.attempts[artifactIndex] || 0;
  };

  // Fetch user quest progress when accepted quest changes
  useEffect(() => {
    if (!questToShow) {
      setProgress(null);
      return;
    }
    setProgressLoading(true);
    setProgressError(null);
    // Get JWT token from localStorage (adjust key as needed for your app)
    let token = localStorage.getItem('token');
    if (!token && typeof window !== 'undefined') {
      // Try to find Cognito OIDC user in sessionStorage
      const oidcKey = Object.keys(sessionStorage).find(k => k.startsWith('oidc.user:'));
      if (oidcKey) {
        try {
          const oidcUser = JSON.parse(sessionStorage.getItem(oidcKey) || '{}');
          token = oidcUser.id_token;
        } catch {}
      }
    }
    fetch(`/api/user-quest-progress?questId=${questToShow.quest_id}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        setProgress(data);
        setProgressLoading(false);
      })
      .catch(err => {
        setProgressError('Could not load progress');
        setProgressLoading(false);
      });
  }, [questToShow]);

  return (
    <div className="pb-20 p-6 space-y-10">
      <h1 className="text-2xl font-bold">Quests</h1>

      {/* Accepted Quest Section */}
      {questToShow && (
        <div>
          <h2 className="text-xl font-semibold mb-2 text-blue-700">Accepted Quest</h2>
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle>{questToShow.title}</CardTitle>
              <CardDescription>{questToShow.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4">
              {/* Main quest info */}
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
                      {Array.isArray(questToShow.artefacts) ? questToShow.artefacts.length : 0} to discover
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
              {progress && questToShow.artefacts && (
                <div className="mt-4">
                  <h3 className="font-medium text-blue-800 mb-3">Quest Progress & Hints</h3>
                  <div className="space-y-3">
                    {questToShow.artefacts.map((artefact: any, index: number) => {
                      const isCollected = progress.collectedArtefactIds?.includes(artefact.artefactId);
                      const isNextInSequence = !progress.completed && questToShow.questType === 'sequential' && 
                        index === (progress.collectedArtefactIds?.length || 0);
                      const attempts = progress.attempts?.[index] || 0;
                      
                      // Only show next artifact and collected ones in sequential mode
                      if (questToShow.questType === 'sequential' && !isCollected && !isNextInSequence) {
                        return null;
                      }

                      return (
                        <div 
                          key={artefact.artefactId}
                          className={`rounded-lg border p-4 ${
                            isCollected 
                              ? 'bg-green-50 border-green-200' 
                              : isNextInSequence
                              ? 'bg-blue-50 border-blue-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="font-medium">{artefact.name}</span>
                              {isCollected && (
                                <span className="ml-2 text-green-600 text-sm">✓ Found</span>
                              )}
                              {isNextInSequence && !progress.completed && (
                                <span className="ml-2 text-blue-600 text-sm">Current Target</span>
                              )}
                            </div>
                            {attempts > 0 && !isCollected && (
                              <span className="text-sm text-gray-500">
                                Attempts: {attempts}
                              </span>
                            )}
                          </div>
                          
                          {/* Show hints based on number of attempts */}
                          {!isCollected && !progress.completed && artefact.hints && (
                            <div className="space-y-2 mt-3">
                              {artefact.hints.slice(0, attempts).map((hint: any, hintIndex: number) => (
                                <div 
                                  key={hintIndex}
                                  className="text-sm bg-white p-3 rounded border border-gray-200"
                                >
                                  <div className="flex gap-2 items-center">
                                    <span className="font-medium">Hint {hintIndex + 1}</span>
                                  </div>
                                  <p className="mt-1 text-gray-600">{hint.description}</p>
                                </div>
                              ))}
                              {/* Show placeholder for next hint if there are more available */}
                              {attempts < artefact.hints.length && (
                                <div 
                                  className="text-sm bg-gray-50 p-3 rounded border border-gray-200"
                                >
                                  <div className="flex gap-2 items-center">
                                    <span className="font-medium text-gray-400">Next Hint</span>
                                    <span className="text-gray-400 text-xs">
                                      (Unlocks after next attempt)
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
                  {progress.completed ? (
                    <span className="text-green-600 font-semibold">Quest Completed! 🎉</span>
                  ) : (
                    <>
                      <span className="font-medium">Artefacts found:</span>
                      <span>
                        {Array.isArray(progress?.collectedArtefactIds) ? progress.collectedArtefactIds.length : 0} / 
                        {Array.isArray(questToShow.artefacts) ? questToShow.artefacts.length : 0}
                      </span>
                    </>
                  )}
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
      {ongoingQuests.length > 0 && !acceptedQuest && (
        <div>
          <h2 className="text-xl font-semibold mb-2 text-green-700">Ongoing Quests</h2>
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
                      <CalendarDays className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Available Until</p>
                        <p className="text-muted-foreground">
                          {quest.dateRange.to ? new Date(quest.dateRange.to).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Artefacts</p>
                      <p className="text-muted-foreground">
                        {Array.isArray(quest.artefacts) ? quest.artefacts.length : 0} to discover
                      </p>
                    </div>
                  </div>
                  {quest.prize && (
                    <div className="flex items-start gap-3">
                      <Trophy className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Prize</p>
                        <p className="text-muted-foreground">{quest.prize.title}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => acceptQuest(quest)}
                    variant="default"
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
      {upcomingQuests.length > 0 && !acceptedQuest && (
        <div>
          <h2 className="text-xl font-semibold mb-2 text-gray-700">Upcoming Quests</h2>
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
                      <CalendarDays className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Available From</p>
                        <p className="text-muted-foreground">
                          {quest.dateRange.from ? new Date(quest.dateRange.from).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Artefacts</p>
                      <p className="text-muted-foreground">
                        {Array.isArray(quest.artefacts) ? quest.artefacts.length : 0} to discover
                      </p>
                    </div>
                  </div>
                  {quest.prize && (
                    <div className="flex items-start gap-3">
                      <Trophy className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Prize</p>
                        <p className="text-muted-foreground">{quest.prize.title}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button disabled variant="secondary" className="w-full sm:w-auto opacity-60 cursor-not-allowed">
                    Not Yet Available
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}