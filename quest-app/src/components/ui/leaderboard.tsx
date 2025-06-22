import React, { useState, useEffect, useCallback } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LeaderboardEntry } from "@/lib/types";
import { Trophy, Clock, Loader2, Download, ChevronLeft, ChevronRight } from "lucide-react";

interface LeaderboardProps {
  questId: string;
  questTitle: string;
  isAdmin?: boolean;
  userId?: string;
  userEmail?: string;
}

export default function LeaderboardComponent({
  questId,
  questTitle,
  isAdmin = false,
  userId,
  userEmail
}: LeaderboardProps) {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"fastest" | "first">("fastest");
  const [isExporting, setIsExporting] = useState(false);
  
  // Pagination state
  const [fastestCurrentPage, setFastestCurrentPage] = useState(1);
  const [firstCurrentPage, setFirstCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/leaderboard?questId=${questId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard data");
      }
      
      const data = await response.json();
      setLeaderboardData(data.leaderboard || []);
    } catch (err) {
      setError("Error loading leaderboard data");
      setLeaderboardData([]);
      console.error("Leaderboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [questId]);

  useEffect(() => {
    fetchLeaderboard();
  }, [questId, fetchLeaderboard]);

  // Reset pagination when tab changes
  useEffect(() => {
    if (activeTab === "fastest") {
      setFastestCurrentPage(1);
    } else {
      setFirstCurrentPage(1);
    }
  }, [activeTab]);

  // Format user display name
  const formatUserName = (entry: LeaderboardEntry) => {
    if (entry.userId === userId) {
      return "You";
    }
    
    if (entry.userEmail) {
      return entry.userEmail;
    }
    
    return `${entry.userId.substring(0, 8)}...`;
  };

  // Format time taken (seconds) to a readable format
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
      
      const csvRows: string[][] = [];
      csvRows.push(["Rank", "User ID", "User Email", "Completed At", "Time Taken (seconds)", "Time Taken (formatted)"]);
      
      const sortedData = [...leaderboardData].sort((a, b) => a.timeTaken - b.timeTaken);
      
      sortedData.forEach((entry, index) => {
        csvRows.push([
          (index + 1).toString(),
          entry.userId,
          entry.userEmail || '',
          entry.completedAt,
          entry.timeTaken.toString(),
          formatTimeTaken(entry.timeTaken)
        ]);
      });
      
      const csvContent = csvRows.map(row => row.join(",")).join("\n");
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

  // Get fastest completions (sorted by timeTaken)
  const fastestCompletions = [...leaderboardData]
    .sort((a, b) => a.timeTaken - b.timeTaken);

  // Get first completions (sorted by completedAt date)
  const firstCompletions = [...leaderboardData]
    .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());

  // Pagination calculations for fastest completions
  const fastestTotalPages = Math.ceil(fastestCompletions.length / itemsPerPage);
  const fastestStartIndex = (fastestCurrentPage - 1) * itemsPerPage;
  const fastestEndIndex = fastestStartIndex + itemsPerPage;
  const fastestPaginatedData = fastestCompletions.slice(fastestStartIndex, fastestEndIndex);

  // Pagination calculations for first completions
  const firstTotalPages = Math.ceil(firstCompletions.length / itemsPerPage);
  const firstStartIndex = (firstCurrentPage - 1) * itemsPerPage;
  const firstEndIndex = firstStartIndex + itemsPerPage;
  const firstPaginatedData = firstCompletions.slice(firstStartIndex, firstEndIndex);

  // Find current user's position in fastest ranking
  const userFastestRank = userId ? 
    fastestCompletions.findIndex(entry => entry.userId === userId) + 1 : 
    null;

  // Find current user's position in first ranking
  const userFirstRank = userId ? 
    firstCompletions.findIndex(entry => entry.userId === userId) + 1 : 
    null;

  // User's data if available
  const userData = userId 
    ? leaderboardData.find(entry => entry.userId === userId) 
    : null;

  // Compact pagination component
  const PaginationControls = ({ 
    currentPage, 
    totalPages, 
    onPageChange, 
    totalItems,
    itemsPerPage 
  }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    itemsPerPage: number;
  }) => {
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const getVisiblePages = () => {
      const pages: (number | string)[] = [];
      const maxVisible = 5;
      
      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        
        let start = Math.max(2, currentPage - 1);
        let end = Math.min(totalPages - 1, currentPage + 1);
        
        if (currentPage <= 3) {
          end = Math.min(totalPages - 1, 4);
        }
        if (currentPage >= totalPages - 2) {
          start = Math.max(2, totalPages - 3);
        }
        
        if (start > 2) {
          pages.push('...');
        }
        
        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
        
        if (end < totalPages - 1) {
          pages.push('...');
        }
        
        if (totalPages > 1) {
          pages.push(totalPages);
        }
      }
      
      return pages;
    };

    return (
      <div className="flex items-center justify-between py-3 px-4 border-t bg-gray-50">
        <div className="text-xs text-gray-500">
          {startItem}-{endItem} of {totalItems}
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-7 px-2 text-xs"
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          
          <div className="flex items-center gap-1">
            {getVisiblePages().map((page, index) => {
              if (page === '...') {
                return <span key={`ellipsis-${index}`} className="px-1 text-xs text-gray-400">...</span>;
              }
              
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  className="h-7 w-7 p-0 text-xs"
                >
                  {page}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-7 px-2 text-xs"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  };

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
      <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border space-y-3">
        <div className="text-center">
          <p className="text-gray-500 text-lg font-medium">No users found</p>
          <p className="text-sm text-gray-400 mt-1">{error}</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.location.reload()}
          className="mt-2"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (leaderboardData.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border">
        <div className="flex flex-col items-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <Trophy className="h-6 w-6 text-gray-400" />
          </div>
          <div>
            <p className="text-gray-500 font-medium">No users found</p>
            <p className="text-sm text-gray-400 mt-1">Be the first to complete this quest!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900">{questTitle}</h3>
        <p className="text-sm text-gray-500 mt-1">
          See the top performers for this quest
        </p>
      </div>
      
      {/* Admin Controls */}
      {isAdmin && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 p-4 bg-gray-50 rounded-lg border">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={isExporting}
            className="flex items-center gap-2 text-xs"
          >
            {isExporting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Download className="h-3 w-3" />
            )}
            Export CSV
          </Button>
          
          <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
            {leaderboardData.length} {leaderboardData.length === 1 ? 'entry' : 'entries'} total
          </div>
        </div>
      )}
      
      {/* Toggle Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "fastest" | "first")}>
        <div className="flex items-center justify-center mb-6">
          <div className="inline-flex bg-gray-100 rounded-lg p-1 w-full">
            <TabsList className="!bg-transparent !border-none !shadow-none grid w-full grid-cols-2 h-auto gap-1 p-0">
              <TabsTrigger 
                value="fastest" 
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-md font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-800 data-[state=inactive]:bg-transparent !border-0 !border-transparent"
              >
                <Clock className="h-3 w-3" />
                Fastest Times
              </TabsTrigger>
              <TabsTrigger 
                value="first" 
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-md font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-800 data-[state=inactive]:bg-transparent !border-0 !border-transparent"
              >
                <Trophy className="h-3 w-3" />
                First Completions
              </TabsTrigger>
            </TabsList>
          </div>
        </div>
        
        <TabsContent value="fastest" className="mt-0">
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs w-16">#</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs">User</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs">Time</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs hidden md:table-cell">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fastestPaginatedData.map((entry, index) => {
                    const globalRank = fastestStartIndex + index + 1;
                    return (
                      <tr 
                        key={`${entry.userId}-${entry.completedAt}`} 
                        className={`${
                          entry.userId === userId 
                            ? "bg-blue-50 border-l-4 border-l-blue-400" 
                            : globalRank === 1 
                            ? "bg-yellow-50" 
                            : "hover:bg-gray-50"
                        } transition-colors`}
                      >
                        <td className="px-4 py-3">
                          {globalRank === 1 ? (
                            <Badge className="bg-yellow-500 text-white text-xs font-medium">1st</Badge>
                          ) : globalRank === 2 ? (
                            <Badge className="bg-gray-400 text-white text-xs font-medium">2nd</Badge>
                          ) : globalRank === 3 ? (
                            <Badge className="bg-amber-700 text-white text-xs font-medium">3rd</Badge>
                          ) : (
                            <span className="text-gray-700 text-sm font-medium">{globalRank}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-sm">
                          <div className="max-w-[200px] truncate">
                            {formatUserName(entry)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 font-medium text-sm">
                          {formatTimeTaken(entry.timeTaken)}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">
                          {formatDate(entry.completedAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <PaginationControls
              currentPage={fastestCurrentPage}
              totalPages={fastestTotalPages}
              onPageChange={setFastestCurrentPage}
              totalItems={fastestCompletions.length}
              itemsPerPage={itemsPerPage}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="first" className="mt-0">
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs w-16">#</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs">User</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs">Completed</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs hidden md:table-cell">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {firstPaginatedData.map((entry, index) => {
                    const globalRank = firstStartIndex + index + 1;
                    return (
                      <tr 
                        key={`${entry.userId}-${entry.completedAt}`} 
                        className={`${
                          entry.userId === userId 
                            ? "bg-blue-50 border-l-4 border-l-blue-400" 
                            : globalRank === 1 
                            ? "bg-blue-50" 
                            : "hover:bg-gray-50"
                        } transition-colors`}
                      >
                        <td className="px-4 py-3">
                          {globalRank === 1 ? (
                            <Badge className="bg-blue-500 text-white text-xs font-medium">1st</Badge>
                          ) : globalRank === 2 ? (
                            <Badge className="bg-gray-400 text-white text-xs font-medium">2nd</Badge>
                          ) : globalRank === 3 ? (
                            <Badge className="bg-amber-700 text-white text-xs font-medium">3rd</Badge>
                          ) : (
                            <span className="text-gray-700 text-sm font-medium">{globalRank}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-sm">
                          <div className="max-w-[200px] truncate">
                            {formatUserName(entry)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 font-medium text-sm">
                          {formatDate(entry.completedAt)}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">
                          {formatTimeTaken(entry.timeTaken)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <PaginationControls
              currentPage={firstCurrentPage}
              totalPages={firstTotalPages}
              onPageChange={setFirstCurrentPage}
              totalItems={firstCompletions.length}
              itemsPerPage={itemsPerPage}
            />
          </div>
        </TabsContent>
      </Tabs>
      
      {/* User Ranking Summary */}
      {userId && userData && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-semibold mb-3 text-blue-800 flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Your Ranking
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded border">
              <p className="text-xs text-gray-500 mb-1">Fastest Time</p>
              <p className="font-medium text-sm">
                {userFastestRank ? (
                  <>
                    <span className="font-bold text-blue-600">#{userFastestRank}</span>
                    <span className="text-xs text-gray-600 ml-2">
                      ({formatTimeTaken(userData.timeTaken)})
                    </span>
                  </>
                ) : (
                  <span className="text-gray-400">Not ranked</span>
                )}
              </p>
            </div>
            <div className="bg-white p-3 rounded border">
              <p className="text-xs text-gray-500 mb-1">Completion Order</p>
              <p className="font-medium text-sm">
                {userFirstRank ? (
                  <>
                    <span className="font-bold text-blue-600">#{userFirstRank}</span>
                    <span className="text-xs text-gray-600 ml-2">
                      ({formatDate(userData.completedAt).split(',')[0]})
                    </span>
                  </>
                ) : (
                  <span className="text-gray-400">Not ranked</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Footer Stats */}
      {!isAdmin && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-full border">
            <Trophy className="h-3 w-3" />
            {leaderboardData.length} total {leaderboardData.length === 1 ? 'completion' : 'completions'}
          </div>
        </div>
      )}
    </div>
  );
}