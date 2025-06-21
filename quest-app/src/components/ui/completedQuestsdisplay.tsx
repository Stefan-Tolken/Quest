import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Medal,
  Calendar,
  Users,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { CompletedQuest, Quest, LeaderboardEntry, UserData } from '@/lib/types';

interface CompletedQuestsDisplayProps {
  userId: string;
  userEmail?: string;
  completedQuests: CompletedQuest[];
  onQuestClick?: (questId: string) => void;
}

interface QuestWithLeaderboard extends Quest {
  userRank?: number;
  totalCompletions?: number;
  userTime?: number;
  top10?: LeaderboardEntry[];
}

interface EnhancedLeaderboardEntry extends LeaderboardEntry {
  displayName?: string;
}

const CompletedQuestsDisplay: React.FC<CompletedQuestsDisplayProps> = ({
  userId,
  userEmail,
  completedQuests,
  onQuestClick
}) => {
  const [questsWithData, setQuestsWithData] = useState<QuestWithLeaderboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedQuests, setExpandedQuests] = useState<Set<string>>(new Set());
  const [usersData, setUsersData] = useState<Map<string, UserData>>(new Map());

  // Fetch all users data for display names
  useEffect(() => {
    const fetchUsersData = async () => {
      try {
        const response = await fetch('/api/users');
        const data = await response.json();
        
        if (response.ok && data.users) {
          const usersMap = new Map<string, UserData>();
          data.users.forEach((user: UserData) => {
            usersMap.set(user.userId, user);
          });
          setUsersData(usersMap);
        }
      } catch (error) {
        console.error('Error fetching users data:', error);
      }
    };

    fetchUsersData();
  }, []);

  // Fetch quest details and leaderboard data
  useEffect(() => {
    const fetchQuestData = async () => {
      try {
        // Fetch quest details and leaderboard data for each completed quest
        const questPromises = completedQuests.map(async (completedQuest) => {
          try {
            // Fetch individual quest details
            const questResponse = await fetch(`/api/get-quest?questId=${completedQuest.questId}`);
            const questData = await questResponse.json();
            
            if (!questResponse.ok) {
              console.warn(`Failed to fetch quest ${completedQuest.questId}:`, questData.error);
              return null;
            }

            // Fetch leaderboard data
            const leaderboardResponse = await fetch(`/api/leaderboard?questId=${completedQuest.questId}`);
            const leaderboardData = await leaderboardResponse.json();
            
            if (leaderboardResponse.ok) {
              const leaderboard: LeaderboardEntry[] = leaderboardData.leaderboard || [];
              
              // Sort by fastest times for ranking
              const sortedByTime = [...leaderboard].sort((a, b) => a.timeTaken - b.timeTaken);
              const userEntry = sortedByTime.find(entry => entry.userId === userId);
              const userRank = userEntry ? sortedByTime.indexOf(userEntry) + 1 : undefined;
              
              return {
                ...questData.quest,
                userRank,
                totalCompletions: leaderboard.length,
                userTime: userEntry?.timeTaken,
                top10: sortedByTime.slice(0, 10)
              };
            } else {
              console.warn(`Failed to fetch leaderboard for quest ${completedQuest.questId}:`, leaderboardData.error);
              // Return quest data without leaderboard info
              return {
                ...questData.quest,
                userRank: undefined,
                totalCompletions: 0,
                userTime: undefined,
                top10: []
              };
            }
          } catch (error) {
            console.error(`Error fetching data for quest ${completedQuest.questId}:`, error);
            return null;
          }
        });

        const results = await Promise.all(questPromises);
        setQuestsWithData(results.filter(Boolean) as QuestWithLeaderboard[]);
      } catch (error) {
        console.error('Error fetching quest data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (completedQuests.length > 0) {
      fetchQuestData();
    } else {
      setLoading(false);
    }
  }, [completedQuests, userId]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatUserName = (entry: LeaderboardEntry) => {
    if (entry.userId === userId) return "You";
    
    // Try to get display name from users data
    const userData = usersData.get(entry.userId);
    if (userData?.displayName) {
      return userData.displayName;
    }
    
    // Fallback to some name
    return "Student";
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-300 text-foreground">1st</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400 text-foreground">2nd</Badge>;
    if (rank === 3) return <Badge className="bg-amber-700 text-foreground">3rd</Badge>;
    if (rank <= 10) return <Badge variant="secondary">Top 10</Badge>;
    if (rank <= 50) return <Badge variant="outline">Top 50</Badge>;
    return <Badge variant="outline">#{rank}</Badge>;
  };

  const toggleExpanded = (questId: string) => {
    const newExpanded = new Set(expandedQuests);
    if (newExpanded.has(questId)) {
      newExpanded.delete(questId);
    } else {
      newExpanded.add(questId);
    }
    setExpandedQuests(newExpanded);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-12 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (completedQuests.length === 0) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <Target className="h-12 w-12 text-foreground mx-auto mb-4" />
          <p className="text-foreground text-lg font-medium">No completed quests yet</p>
          <p className="text-foreground text-sm mt-1">Start exploring to see your achievements here!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {questsWithData.map((quest) => {
        const isExpanded = expandedQuests.has(quest.quest_id);
        const completedQuest = completedQuests.find(cq => cq.questId === quest.quest_id);
        
        return (
          <Card key={quest.quest_id} className={`overflow-hidden mb-4 ${quest.userRank === 1 ? "!bg-yellow-300/20" : ""}`}>
            <CardHeader className="">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-foreground line-clamp-2 leading-tight text-xl">
                    {quest.title}
                  </CardTitle>
                </div>
                {quest.userRank && (
                  <div className="flex-shrink-0">
                    {getRankBadge(quest.userRank)}
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex gap-2">
                  <Clock className="h-4 w-4" />
                  <div>
                    <p className="text-xs text-foreground">Your Time</p>
                    <p className="font-medium text-sm">
                      {quest.userTime ? formatTime(quest.userTime) : 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Users className="h-4 w-4" />
                  <div>
                    <p className="text-xs text-foreground">Total Players</p>
                    <p className="font-medium text-sm">{quest.totalCompletions || 0}</p>
                  </div>
                </div>
              </div>

              {/* Completion Date */}
              {completedQuest?.completedAt && (
                <div className="flex items-center gap-2 mb-4 text-sm text-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Completed {new Date(completedQuest.completedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}

              {/* Leaderboard Toggle */}
              {quest.top10 && quest.top10.length > 0 && (
                <Collapsible 
                  open={isExpanded} 
                  onOpenChange={() => toggleExpanded(quest.quest_id)}
                >
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="glass" 
                      size="sm" 
                      className="w-full justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <Medal className="h-4 w-4" />
                        View Leaderboard
                      </span>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="mt-4">
                    <div className="glass rounded-lg overflow-hidden">
                      {/* Top 10 */}
                      <div className="px-3 py-2 border-b border-background/50">
                        <h4 className="text-sm font-medium text-foreground">Top 10 Fastest Times</h4>
                      </div>
                      
                      <div className="max-h-64 overflow-y-auto rounded-b-lg">
                        {quest.top10.map((entry, index) => (
                          <div 
                            key={`${entry.userId}-${entry.completedAt}`}
                            className={`flex items-center justify-between px-3 py-2 text-sm ${
                              entry.userId === userId ? 'bg-background/20 ' : ''
                            } ${index < quest.top10!.length - 1 ? 'border-b border-background/50' : ''}`}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className="flex-shrink-0 w-6 text-center font-medium text-foreground">
                                {index + 1}
                              </span>
                              <span className="truncate font-medium">
                                {formatUserName(entry)}
                              </span>
                            </div>
                            <span className="flex-shrink-0 font-medium text-foreground">
                              {formatTime(entry.timeTaken)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* User's Position (if not in top 10) */}
                      {quest.userRank && quest.userRank > 10 && (
                        <div className="border-t border-background/50 bg-background/20 px-3 py-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-3">
                              <span className="w-6 text-center font-bold text-foreground">
                                {quest.userRank}
                              </span>
                              <span className="font-medium text-foreground">You</span>
                            </div>
                            <span className="font-medium text-foreground">
                              {quest.userTime ? formatTime(quest.userTime) : 'N/A'}
                            </span>
                          </div>
                          <p className="text-xs text-foreground mt-1 pl-9">
                            Your ranking out of {quest.totalCompletions} players
                          </p>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Action Button */}
              {onQuestClick && (
                <Button 
                  variant="glass" 
                  size="sm" 
                  className="w-full mt-3"
                  onClick={() => onQuestClick(quest.quest_id)}
                >
                  View Quest Details
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </>
  );
};

export default CompletedQuestsDisplay;