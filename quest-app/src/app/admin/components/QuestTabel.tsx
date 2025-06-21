"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash, ArrowUpDown, LineChart } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Quest } from "@/lib/types";
import LeaderboardModal from "./modals/leaderboardModal";

interface QuestsTableProps {
  quests: Quest[];
  onDeleteQuest: (id: string) => void;
  isAdmin?: boolean;
  userId?: string; // Optional: current user ID for client-side view
  userEmail?: string; // Add user email prop
}

export default function QuestsTable({ 
  quests, 
  onDeleteQuest,
  isAdmin = true,
  userId,
  userEmail
}: QuestsTableProps) {
  const router = useRouter();
  
  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  // Memoize date formatting function to prevent re-computation
  const formatDate = useMemo(() => 
    (dateStr: string | Date) => {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }, []
  );

  // Memoize status calculation to prevent re-computation
  const getQuestStatus = useMemo(() => 
    (quest: Quest) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const startDate = quest.dateRange?.from ? new Date(quest.dateRange.from) : null;
      const endDate = quest.dateRange?.to ? new Date(quest.dateRange.to) : null;
      
      let status = "Unknown";
      let statusColor = "bg-gray-500";
      
      if (startDate && endDate) {
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        
        if (today >= startDate && today <= endDate) {
          status = "Active";
          statusColor = "bg-green-500";
        } else if (today > endDate) {
          status = "Past";
          statusColor = "bg-red-500";
        } else if (today < startDate) {
          status = "Coming Up";
          statusColor = "bg-yellow-500";
        }
      }
      
      return { status, statusColor };
    }, []
  );

  // Memoize column definitions
  const columns: ColumnDef<Quest>[] = useMemo(() => [
    {
      accessorKey: "title",
      header: ({ column }) => {
        return (
          <Button
            variant="subtle"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:cursor-pointer justify-start pl-6"
          >
            Quest Title
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium pl-6">{row.getValue("title")}</div>
      ),
    },
    {
      accessorKey: "status",
      id: "status",
      header: ({ column }) => {
        return (
          <Button
            variant="subtle"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:cursor-pointer"
          >
            Status
          </Button>
        );
      },
      cell: ({ row }) => {
        const quest = row.original;
        const { status, statusColor } = getQuestStatus(quest);
        
        return (
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusColor}`}></div>
            <span className="text-sm font-medium">{status}</span>
          </div>
        );
      },
      accessorFn: (row) => {
        const quest = row;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const startDate = quest.dateRange?.from ? new Date(quest.dateRange.from) : null;
        const endDate = quest.dateRange?.to ? new Date(quest.dateRange.to) : null;
        
        let status = "Unknown";
        
        if (startDate && endDate) {
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          
          if (today >= startDate && today <= endDate) {
            status = "Active";
          } else if (today > endDate) {
            status = "Past";
          } else if (today < startDate) {
            status = "Coming Up";
          }
        }

        return status;
      }
    },
    {
      id: "start_date",
      header: ({ column }) => {
        return (
          <Button
            variant="subtle"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:cursor-pointer"
          >
            Start Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const quest = row.original;
        const startDate = quest.dateRange?.from;
        
        if (!startDate) {
          return <div className="text-gray-400 text-sm ml-3">No start dates set</div>;
        }
        
        return (
          <div className="text-sm text-gray-600 ml-3">
            {formatDate(startDate)}
          </div>
        );
      },
      accessorFn: (row) => {
        if (row.dateRange?.from) {
          const date = new Date(row.dateRange.from);
          return `${date.getTime()} ${formatDate(row.dateRange.from)}`;
        }
        return "No start dates set";
      },
      enableSorting: true,
    },
    {
      id: "end_date",
      header: ({ column }) => {
        return (
          <Button
            variant="subtle"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:cursor-pointer"
          >
            End Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const quest = row.original;
        const endDate = quest.dateRange?.to;
        
        if (!endDate) {
          return <div className="text-gray-400 text-sm ml-3">No end dates set</div>;
        }
        
        return (
          <div className="text-sm ml-3 text-gray-600">
            {formatDate(endDate)}
          </div>
        );
      },
      accessorFn: (row) => {
        if (row.dateRange?.to) {
          const date = new Date(row.dateRange.to);
          return `${date.getTime()} ${formatDate(row.dateRange.to)}`;
        }
        return "No end dates set";
      },
      enableSorting: true,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const quest = row.original;

        return (
          <div className="flex items-center justify-end gap-2">
            <LeaderboardModal
              questId={quest.quest_id}
              questTitle={quest.title}
              isAdmin={isAdmin}
              userId={userId}
              userEmail={userEmail}
              buttonVariant="default"
              buttonSize="sm"
              className="text-white"
            />
            {isAdmin && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/admin/quest-builder?edit=${quest.quest_id}`);
                  }}
                  className="flex items-center gap-1 hover:cursor-pointer"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteQuest(quest.quest_id);
                  }}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:cursor-pointer"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ], [isAdmin, userId, userEmail, formatDate, getQuestStatus, router, onDeleteQuest]);

  // Initialize table with memoized data
  const table = useReactTable({
    data: quests,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 6, // Sets the number of rows per page to 6
      },
    },
  });

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Quests</h2>
        <Button
          variant="default"
          onClick={() => router.push("/admin/quest-builder")}
          className="hover:cursor-pointer"
        >
          Create New Quest
        </Button>
      </div>

      <div className="w-full">
        <div className="flex items-center py-4">
          <Input
            placeholder="Search any quest table details..."
            value={table.getState().globalFilter ?? ""}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            className="w-80 placeholder:text-gray-400 p-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-10 resize-none text-base"
          />
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.getColumn("title")?.toggleVisibility()}
              className={`hover:cursor-pointer ${table.getColumn("title")?.getIsVisible() ? "" : "opacity-50"}`}
            >
              Title
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.getColumn("status")?.toggleVisibility()}
              className={`hover:cursor-pointer ${table.getColumn("status")?.getIsVisible() ? "" : "opacity-50"}`}
            >
              Status
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.getColumn("start_date")?.toggleVisibility()}
              className={`hover:cursor-pointer ${table.getColumn("start_date")?.getIsVisible() ? "" : "opacity-50"}`}
            >
              Start
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.getColumn("end_date")?.toggleVisibility()}
              className={`hover:cursor-pointer ${table.getColumn("end_date")?.getIsVisible() ? "" : "opacity-50"}`}
            >
              End
            </Button>
          </div>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="hover:bg-gray-50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No quests found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="flex items-center justify-between py-4">
          <div className="text-muted-foreground text-sm">
            Showing {table.getRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} quest(s).
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="hover:cursor-pointer disabled:hover:cursor-not-allowed"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="hover:cursor-pointer disabled:hover:cursor-not-allowed"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}