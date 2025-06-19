import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Clock, Loader2, Medal } from "lucide-react";
import { LeaderboardEntry } from "@/lib/types";
import LeaderboardModal from "./leaderboardModal";

interface CompactLeaderboardProps {
  questId: string;
  questTitle: string;
  userId?: string; // Current user's ID to highlight their position
  userEmail?: string; // Add userEmail prop
  className?: string;
  autoLoad?: boolean; // New prop to control auto-loading
}

export default function CompactLeaderboard({
  questId,
  questTitle,
  userId,
  userEmail,
  className = "",
  autoLoad = false, // Default to false to prevent automatic loading
}: CompactLeaderboardProps) {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);

  const fetchLeaderboard = async () => {
    if (hasLoaded) return; // Prevent duplicate fetches
    
    try {
      setLoading(true);
      const response = await fetch(`/api/leaderboard?questId=${questId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard data");
      }
      
      const data = await response.json();
      setLeaderboardData(data.leaderboard || []);
      setHasLoaded(true);
    } catch (err) {
      setError("Error loading leaderboard data");
      console.error("Leaderboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad) {
      fetchLeaderboard();
    }
  }, [questId, autoLoad]);

  // Handle manual load when user clicks to expand/view
  const handleLoadData = () => {
    if (!hasLoaded) {
      fetchLeaderboard();
    }
  };

  // Format user display name
  const formatUserName = (entry: LeaderboardEntry) => {
    if (entry.userId === userId) {
      return "You";
    }
    
    if (entry.userEmail) {
      // Show just the username part before @ for cleaner display
      return entry.userEmail.split('@')[0];
    }
    
    // Fallback to truncated user ID
    return `${entry.userId.substring(0, 6)}...`;
  };

  // Format time taken (milliseconds) to a readable format
  const formatTimeTaken = (secondsTotal: number) => {
    const seconds = Math.floor(secondsTotal % 60);
    const minutes = Math.floor((secondsTotal / 60) % 60);
    const hours = Math.floor(secondsTotal / 3600);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Get fastest completions (sorted by timeTaken)
  const topThreeFastest = [...leaderboardData]
    .sort((a, b) => a.timeTaken - b.timeTaken)
    .slice(0, 3);

  // Find current user's position in fastest ranking
  const userFastestRank = userId ? 
    leaderboardData
      .sort((a, b) => a.timeTaken - b.timeTaken)
      .findIndex(entry => entry.userId === userId) + 1 : 
    null;

  // User's data if available
  const userData = userId 
    ? leaderboardData.find(entry => entry.userId === userId) 
    : null;

  return (
    <Card className={`w-full overflow-hidden ${className}`}>
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          <span>Quest Leaderboard</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {!hasLoaded && !loading ? (
          <div className="text-center py-4">
            <Button
              variant="outline"
              onClick={handleLoadData}
              className="mb-2"
            >
              Load Leaderboard
            </Button>
            <p className="text-sm text-gray-500">Click to view rankings</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center h-24">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="text-center py-4 text-red-500 text-sm">
            {error}
          </div>
        ) : (
          <>
            {topThreeFastest.length > 0 ? (
              <div className="space-y-3">
                {topThreeFastest.map((entry, index) => (
                  <div 
                    key={`${entry.userId}-${entry.completedAt}`} 
                    className={`flex items-center justify-between ${entry.userId === userId ? "bg-blue-50 p-2 rounded-md" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      {index === 0 ? (
                        <Medal className="h-5 w-5 text-yellow-500" />
                      ) : index === 1 ? (
                        <Medal className="h-5 w-5 text-gray-400" />
                      ) : index === 2 ? (
                        <Medal className="h-5 w-5 text-amber-700" />
                      ) : (
                        <span className="font-semibold w-5 text-center">{index + 1}</span>
                      )}
                      <span className="text-sm font-medium">
                        {formatUserName(entry)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {formatTimeTaken(entry.timeTaken)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                No completions yet. Be the first!
              </div>
            )}

            {userId && userData && userFastestRank && userFastestRank > 3 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between bg-blue-50 p-2 rounded-md">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold w-5 text-center">{userFastestRank}</span>
                    <span className="text-sm font-medium">You</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {formatTimeTaken(userData.timeTaken)}
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        <div className="mt-4">
          <LeaderboardModal
            questId={questId}
            questTitle={questTitle}
            userId={userId}
            userEmail={userEmail}
            buttonVariant="outline"
            buttonSize="sm"
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  );
}