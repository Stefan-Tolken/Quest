import React, { useState, useEffect } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { LeaderboardEntry } from "@/lib/types";
import { Trophy, Clock, Loader2, Download, Trash, AlertTriangle } from "lucide-react";

interface LeaderboardProps {
  questId: string;
  questTitle: string;
  isAdmin?: boolean;
  userId?: string; // Current user's ID to highlight their position (for client view)
}

export default function LeaderboardComponent({
  questId,
  questTitle,
  isAdmin = false,
  userId,
}: LeaderboardProps) {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"fastest" | "first">("fastest");
  const [isExporting, setIsExporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/leaderboard?questId=${questId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard data");
      }
      
      const data = await response.json();
      setLeaderboardData(data.leaderboard || []);
    } catch (err) {
      setError("Error loading leaderboard data");
      console.error("Leaderboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [questId]);

  // Format time taken (milliseconds) to a readable format
  const formatTimeTaken = (ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle CSV export
  const handleExportCsv = () => {
    try {
      setIsExporting(true);
      
      // Format data for CSV export
      const csvRows: string[][] = [];
      
      // Headers
      csvRows.push(["Rank", "User ID", "Completed At", "Time Taken (ms)", "Time Taken (formatted)"]);
      
      // Sort by time taken
      const sortedData = [...leaderboardData].sort((a, b) => a.timeTaken - b.timeTaken);
      
      // Add rows
      sortedData.forEach((entry, index) => {
        csvRows.push([
          (index + 1).toString(),
          entry.userId,
          entry.completedAt,
          entry.timeTaken.toString(),
          formatTimeTaken(entry.timeTaken)
        ]);
      });
      
      // Convert to CSV string
      const csvContent = csvRows.map(row => row.join(",")).join("\n");
      
      // Create a blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `quest-${questId}-leaderboard.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting leaderboard:", error);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle leaderboard reset
  const handleResetLeaderboard = async () => {
    try {
      setIsResetting(true);
      const response = await fetch(`/api/admin/reset-leaderboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ questId }),
      });

      if (!response.ok) {
        throw new Error("Failed to reset leaderboard");
      }

      // Refetch leaderboard data
      fetchLeaderboard();
    } catch (error) {
      console.error("Error resetting leaderboard:", error);
    } finally {
      setIsResetting(false);
    }
  };

  // Get fastest completions (sorted by timeTaken)
  const fastestCompletions = [...leaderboardData]
    .sort((a, b) => a.timeTaken - b.timeTaken)
    .slice(0, 10);

  // Get first completions (sorted by completedAt date)
  const firstCompletions = [...leaderboardData]
    .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
    .slice(0, 10);

  // Find current user's position in fastest ranking
  const userFastestRank = userId ? 
    leaderboardData
      .sort((a, b) => a.timeTaken - b.timeTaken)
      .findIndex(entry => entry.userId === userId) + 1 : 
    null;

  // Find current user's position in first ranking
  const userFirstRank = userId ? 
    leaderboardData
      .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
      .findIndex(entry => entry.userId === userId) + 1 : 
    null;

  // User's data if available
  const userData = userId 
    ? leaderboardData.find(entry => entry.userId === userId) 
    : null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="mt-4 text-gray-500">Loading leaderboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-40">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (leaderboardData.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-50 rounded-md">
        <p className="text-gray-500">No completions recorded yet</p>
        <p className="text-sm text-gray-400 mt-1">Be the first to complete this quest!</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-xl font-bold">{questTitle} Leaderboard</h2>
        <p className="text-gray-500 mt-1">
          See the top performers for this quest
        </p>
      </div>
      
      {isAdmin && (
        <div className="mb-6 flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export CSV
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isResetting}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {isResetting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash className="h-4 w-4" />
                )}
                Reset Leaderboard
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Reset Leaderboard
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all leaderboard entries for this quest. 
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleResetLeaderboard}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <div className="ml-auto text-sm text-gray-500">
            {leaderboardData.length} {leaderboardData.length === 1 ? 'entry' : 'entries'} total
          </div>
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "fastest" | "first")}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="fastest" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Fastest Times
          </TabsTrigger>
          <TabsTrigger value="first" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            First Completions
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="fastest" className="mt-0">
          <div className="bg-white rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 w-12">#</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">User</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Time</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 hidden md:table-cell">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {fastestCompletions.map((entry, index) => (
                    <tr 
                      key={`${entry.userId}-${entry.completedAt}`} 
                      className={`${entry.userId === userId ? "bg-blue-50" : index === 0 ? "bg-yellow-50" : ""}`}
                    >
                      <td className="px-4 py-3">
                        {index === 0 ? (
                          <Badge className="bg-yellow-500">1st</Badge>
                        ) : index === 1 ? (
                          <Badge className="bg-gray-400">2nd</Badge>
                        ) : index === 2 ? (
                          <Badge className="bg-amber-700">3rd</Badge>
                        ) : (
                          <span className="text-gray-700">{index + 1}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {entry.userId === userId ? (
                          <span className="font-semibold">You</span>
                        ) : (
                          <span>{entry.userId.substring(0, 8)}...</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium">
                        {formatTimeTaken(entry.timeTaken)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                        {formatDate(entry.completedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="first" className="mt-0">
          <div className="bg-white rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 w-12">#</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">User</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Completed</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 hidden md:table-cell">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {firstCompletions.map((entry, index) => (
                    <tr 
                      key={`${entry.userId}-${entry.completedAt}`} 
                      className={`${entry.userId === userId ? "bg-blue-50" : index === 0 ? "bg-blue-50" : ""}`}
                    >
                      <td className="px-4 py-3">
                        {index === 0 ? (
                          <Badge className="bg-blue-500">1st</Badge>
                        ) : index === 1 ? (
                          <Badge className="bg-gray-400">2nd</Badge>
                        ) : index === 2 ? (
                          <Badge className="bg-amber-700">3rd</Badge>
                        ) : (
                          <span className="text-gray-700">{index + 1}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {entry.userId === userId ? (
                          <span className="font-semibold">You</span>
                        ) : (
                          <span>{entry.userId.substring(0, 8)}...</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium">
                        {formatDate(entry.completedAt)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                        {formatTimeTaken(entry.timeTaken)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {userId && userData && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="text-sm font-semibold mb-2 text-blue-800">Your Ranking</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Fastest Time</p>
              <p className="font-medium">
                {userFastestRank ? (
                  <>
                    <span className="font-bold">{userFastestRank}</span>
                    <span className="text-sm text-gray-600 ml-2">
                      ({formatTimeTaken(userData.timeTaken)})
                    </span>
                  </>
                ) : (
                  "Not ranked"
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Completion Order</p>
              <p className="font-medium">
                {userFirstRank ? (
                  <>
                    <span className="font-bold">{userFirstRank}</span>
                    <span className="text-sm text-gray-600 ml-2">
                      ({formatDate(userData.completedAt)})
                    </span>
                  </>
                ) : (
                  "Not ranked"
                )}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {!isAdmin && (
        <div className="mt-4 text-sm text-gray-500 italic text-center">
          {leaderboardData.length} total {leaderboardData.length === 1 ? 'completion' : 'completions'}
        </div>
      )}
    </div>
  );
}