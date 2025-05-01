// components/ui/quests.tsx
'use client';
import { useData } from '@/context/dataContext';
import { useQuest } from '@/context/questContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { CalendarDays, Trophy, MapPin, ScanEye } from 'lucide-react';

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

  return (
    <div className="pb-20 p-6 space-y-6">
      <h1 className="text-2xl font-bold">Quests</h1>
      
      <div className="grid gap-6">
        {quests.map((quest) => {
          const isActive = activeQuest?.quest_id === quest.quest_id;
          const hasActiveQuest = activeQuest && !isActive;

          // Hide other quests when one is active
          if (activeQuest && !isActive) return null;

          // Only show quest if the scheduled date has been reached
          if (quest.dateRange && new Date(quest.dateRange.from) > new Date()) return null;

          return (
            <Card key={quest.quest_id} className={isActive ? 'border-blue-200 bg-blue-50' : ''}>
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
                        {new Date(quest.dateRange.to).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Artefacts</p>
                    <p className="text-muted-foreground">
                      {quest.artifacts.length} to discover
                    </p>
                  </div>
                </div>

                {quest.prize && (
                  <div className="flex items-start gap-3">
                    <Trophy className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Prize</p>
                      <p className="text-muted-foreground">
                        {quest.prize.title}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter>
                {isActive ? (
                  <Button 
                    onClick={cancelQuest}
                    variant="destructive"
                    className="w-full sm:w-auto"
                  >
                    Cancel Quest
                  </Button>
                ) : (
                  <Button
                    onClick={() => acceptQuest(quest)}
                    variant="default"
                    className="w-full sm:w-auto"
                  >
                    Accept Quest
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}