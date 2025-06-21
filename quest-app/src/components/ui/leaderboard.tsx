import React, { useState, useEffect, useCallback } from "react";
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
import { Trophy, Clock, Loader2, Download, Trash, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";

interface LeaderboardProps {
  questId: string;
  questTitle: string;
  isAdmin?: boolean;
  userId?: string; // Current user's ID to highlight their position (for client view)
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
      setError(null); // Clear any previous errors
      const response = await fetch(`/api/leaderboard?questId=${questId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard data");
      }
      
      const data = await response.json();
      setLeaderboardData(data.leaderboard || []);
    } catch (err) {
      setError("Error loading leaderboard data");
      setLeaderboardData([]); // Set empty array to trigger "No users found" display
      console.error("Leaderboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [questId]);

  // DEMO: Inject dummy leaderboard data
//   useEffect(() => {
//     setTimeout(() => {
//       setLeaderboardData([
//         {
//           userId: "b40874b8-b011-7084-c99b-0b6a838ff063",
//           userEmail: "alice@example.com",
//           timeTaken: 95,
//           completedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
//           questId: questId
//         },
//         {
//           userId: "142884a8-3031-7096-147c-cdefa495fe88",
//           userEmail: "bob@example.com",
//           timeTaken: 62,
//           completedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
//           questId: questId
//         },
//         {
//           userId: "142884a8-3031-7496-147c-cdefa495fe88",
//           userEmail: "mandie@example.com",
//           timeTaken: 1004,
//           completedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
//           questId: questId
//         },
//         {
//           userId: "142884a8-3031-7496-147c-cdefa4232e88",
//           userEmail: "marcellerouxsomethinglong@example.com",
//           timeTaken: 26,
//           completedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
//           questId: questId
//         },
//         {
//           userId: "142884a8-3351-7496-147c-cdefa495fe88",
//           userEmail: "james@example.com",
//           timeTaken: 74,
//           completedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
//           questId: questId
//         },
//         {
//           userId: "142834a8-3031-7096-147c-cdefa495fe88",
//           userEmail: "rob@example.com",
//           timeTaken: 6562,
//           completedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
//           questId: questId
//         },
//         {
//           userId: "243884a8-3031-7096-147c-cdefa495fe88",
//           userEmail: "charlie@example.com",
//           timeTaken: 156,
//           completedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
//           questId: questId
//         },
//         {
//           userId: "343884a8-3031-7096-147c-cdefa495fe88",
//           userEmail: "diana@example.com",
//           timeTaken: 89,
//           completedAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
//           questId: questId
//         },
//         {
//           userId: "443884a8-3031-7096-147c-cdefa495fe88",
//           userEmail: "eve@example.com",
//           timeTaken: 234,
//           completedAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
//           questId: questId
//         },
//         {
//           userId: "543884a8-3031-7096-147c-cdefa495fe88",
//           userEmail: "frank@example.com",
//           timeTaken: 178,
//           completedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
//           questId: questId
//         },
//         {
//           userId: "643884a8-3031-7096-147c-cdefa495fe88",
//           userEmail: "grace@example.com",
//           timeTaken: 299,
//           completedAt: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
//           questId: questId
//         },
//         {
//           userId: "743884a8-3031-7096-147c-cdefa495fe88",
//           userEmail: "henry@example.com",
//           timeTaken: 134,
//           completedAt: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
//           questId: questId
//         },
//         {
//           userId: "843884a8-3031-7096-147c-cdefa495fe88",
//           userEmail: "iris@example.com",
//           timeTaken: 87,
//           completedAt: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
//           questId: questId
//         },
//         {
//           userId: "943884a8-3031-7096-147c-cdefa495fe88",
//           userEmail: "jack@example.com",
//           timeTaken: 445,
//           completedAt: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
//           questId: questId
//         },
//         {
//           userId: "a43884a8-3031-7096-147c-cdefa495fe88",
//           userEmail: "kate@example.com",
//           timeTaken: 67,
//           completedAt: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
//           questId: questId
//         }
//       ]);
//       setLoading(false);
//     }, 500);
//   }, [questId]);

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
    
    // Fallback to truncated user ID
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
      
      // Format data for CSV export
      const csvRows: string[][] = [];
      
      // Headers
      csvRows.push(["Rank", "User ID", "User Email", "Completed At", "Time Taken (seconds)", "Time Taken (formatted)"]);
      
      // Sort by time taken
      const sortedData = [...leaderboardData].sort((a, b) => a.timeTaken - b.timeTaken);
      
      // Add rows
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

  // Compact pagination component for modal
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

    // Smart page number display for limited space
    const getVisiblePages = () => {
      const pages: (number | string)[] = [];
      const maxVisible = 5; // Maximum number of page buttons to show
      
      if (totalPages <= maxVisible) {
        // Show all pages if total is small
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Always show first page
        pages.push(1);
        
        let start = Math.max(2, currentPage - 1);
        let end = Math.min(totalPages - 1, currentPage + 1);
        
        // Adjust window if too close to boundaries
        if (currentPage <= 3) {
          end = Math.min(totalPages - 1, 4);
        }
        if (currentPage >= totalPages - 2) {
          start = Math.max(2, totalPages - 3);
        }
        
        // Add ellipsis if gap
        if (start > 2) {
          pages.push('...');
        }
        
        // Add middle pages
        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
        
        // Add ellipsis if gap
        if (end < totalPages - 1) {
          pages.push('...');
        }
        
        // Always show last page
        if (totalPages > 1) {
          pages.push(totalPages);
        }
      }
      
      return pages;
    };

    return (
      <div className="flex items-center justify-between py-3 px-4 border-t bg-gray-50/50">
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
      <div className="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-md space-y-3">
        <p className="text-gray-500 text-lg">No users found</p>
        <p className="text-sm text-gray-400">{error}</p>
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
      <div className="text-center py-10 bg-gray-50 rounded-md">
        <p className="text-gray-500">No users found</p>
        <p className="text-sm text-gray-400 mt-1">Be the first to complete this quest!</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-4">
        <h2 className="text-lg font-bold">{questTitle} Leaderboard</h2>
        <p className="text-sm text-gray-500 mt-1">
          See the top performers for this quest
        </p>
      </div>
      
      {isAdmin && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
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
          
          <div className="text-xs text-gray-500">
            {leaderboardData.length} {leaderboardData.length === 1 ? 'entry' : 'entries'} total
          </div>
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "fastest" | "first")}>
        <TabsList className="grid w-full grid-cols-2 mb-3">
          <TabsTrigger value="fastest" className="flex items-center gap-2 text-sm">
            <Clock className="h-3 w-3" />
            Fastest Times
          </TabsTrigger>
          <TabsTrigger value="first" className="flex items-center gap-2 text-sm">
            <Trophy className="h-3 w-3" />
            First Completions
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="fastest" className="mt-0">
          <div className="bg-white rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 text-xs w-8">#</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 text-xs">User</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 text-xs">Time</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 text-xs hidden md:table-cell">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {fastestPaginatedData.map((entry, index) => {
                    const globalRank = fastestStartIndex + index + 1;
                    return (
                      <tr 
                        key={`${entry.userId}-${entry.completedAt}`} 
                        className={`${entry.userId === userId ? "bg-blue-50" : globalRank === 1 ? "bg-yellow-50" : ""} hover:bg-gray-50`}
                      >
                        <td className="px-3 py-2">
                          {globalRank === 1 ? (
                            <Badge className="bg-yellow-500 text-xs">1st</Badge>
                          ) : globalRank === 2 ? (
                            <Badge className="bg-gray-400 text-xs">2nd</Badge>
                          ) : globalRank === 3 ? (
                            <Badge className="bg-amber-700 text-xs">3rd</Badge>
                          ) : (
                            <span className="text-gray-700 text-xs">{globalRank}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-medium text-xs">
                          <div className="max-w-[150px] overflow-x-auto" style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent'
                          }}>
                            <style jsx>{`
                              div::-webkit-scrollbar {
                                height: 4px;
                              }
                              div::-webkit-scrollbar-track {
                                background: transparent;
                              }
                              div::-webkit-scrollbar-thumb {
                                background: rgba(156, 163, 175, 0.2);
                                border-radius: 2px;
                              }
                              div::-webkit-scrollbar-thumb:hover {
                                background: rgba(156, 163, 175, 0.4);
                              }
                            `}</style>
                            <div className="whitespace-nowrap">
                              {formatUserName(entry)}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-gray-700 font-medium text-xs">
                          {formatTimeTaken(entry.timeTaken)}
                        </td>
                        <td className="px-3 py-2 text-gray-500 text-xs hidden md:table-cell">
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
          <div className="bg-white rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 text-xs w-8">#</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 text-xs">User</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 text-xs">Completed</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 text-xs hidden md:table-cell">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {firstPaginatedData.map((entry, index) => {
                    const globalRank = firstStartIndex + index + 1;
                    return (
                      <tr 
                        key={`${entry.userId}-${entry.completedAt}`} 
                        className={`${entry.userId === userId ? "bg-blue-50" : globalRank === 1 ? "bg-blue-50" : ""} hover:bg-gray-50`}
                      >
                        <td className="px-3 py-2">
                          {globalRank === 1 ? (
                            <Badge className="bg-blue-500 text-xs">1st</Badge>
                          ) : globalRank === 2 ? (
                            <Badge className="bg-gray-400 text-xs">2nd</Badge>
                          ) : globalRank === 3 ? (
                            <Badge className="bg-amber-700 text-xs">3rd</Badge>
                          ) : (
                            <span className="text-gray-700 text-xs">{globalRank}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-medium text-xs">
                          <div className="max-w-[150px] overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
                            <div className="whitespace-nowrap">
                              {formatUserName(entry)}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-gray-700 font-medium text-xs">
                          {formatDate(entry.completedAt)}
                        </td>
                        <td className="px-3 py-2 text-gray-500 text-xs hidden md:table-cell">
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
      
      {userId && userData && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="text-xs font-semibold mb-2 text-blue-800">Your Ranking</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500">Fastest Time</p>
              <p className="font-medium text-sm">
                {userFastestRank ? (
                  <>
                    <span className="font-bold">#{userFastestRank}</span>
                    <span className="text-xs text-gray-600 ml-2">
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
              <p className="font-medium text-sm">
                {userFirstRank ? (
                  <>
                    <span className="font-bold">#{userFirstRank}</span>
                    <span className="text-xs text-gray-600 ml-2">
                      ({formatDate(userData.completedAt).split(',')[0]})
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
        <div className="mt-3 text-xs text-gray-500 italic text-center">
          {leaderboardData.length} total {leaderboardData.length === 1 ? 'completion' : 'completions'}
        </div>
      )}
    </div>
  );
}