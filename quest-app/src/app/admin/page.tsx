"use client";

import { useData } from "@/context/dataContext";
import { Button } from "@/components/ui/button";
import { Edit, Trash, QrCode as QrCodeIcon, ArrowUpDown, X, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SuccessPopup from "@/components/ui/SuccessPopup";
import QRCodeGenerator from "@/components/QRGenerator"; // Adjust path as needed
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Artefact, Quest } from "@/lib/types";

export default function AdminHome() {
  const { artefacts, quests, loading } = useData();
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"artefact" | "quest" | null>(null);
  const [deleteWarning, setDeleteWarning] = useState<string>("");
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  
  // QR Code popup state
  const [showQRPopup, setShowQRPopup] = useState(false);
  const [selectedArtefact, setSelectedArtefact] = useState<Artefact | null>(null);
  const [contentType, setContentType] = useState<"png" | "jpg" | "jpeg">("png");
  
  // Data table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  // Quest table state
  const [questSorting, setQuestSorting] = useState<SortingState>([]);
  const [questColumnFilters, setQuestColumnFilters] = useState<ColumnFiltersState>([]);
  const [questColumnVisibility, setQuestColumnVisibility] = useState<VisibilityState>({});

  // Handle QR code generation
  const handleArtefactQR = (artefact: Artefact) => {
    setSelectedArtefact(artefact);
    setShowQRPopup(true);
  };

  // Handle QR code download
  const handleQRDownload = () => {
    if (!selectedArtefact) return;
    
    const svg = document.querySelector('#qr-popup svg') as SVGElement;
    if (!svg) return;

    // Create a canvas to convert SVG to image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      // Determine MIME type and quality based on selected format
      let mimeType = 'image/png';
      let quality = 1;
      let extension = 'png';
      
      if (contentType === 'jpg' || contentType === 'jpeg') {
        mimeType = 'image/jpeg';
        quality = 0.95;
        extension = contentType;
      }
      
      // Download the image
      const imageUrl = canvas.toDataURL(mimeType, quality);
      const downloadLink = document.createElement('a');
      downloadLink.href = imageUrl;
      downloadLink.download = `qr-code-${selectedArtefact.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.${extension}`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  // Define columns for the artefacts table
  const artefactColumns: ColumnDef<Artefact>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="hover:cursor-pointer"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="hover:cursor-pointer"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:cursor-pointer"
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "artist",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:cursor-pointer"
          >
            Artist
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-gray-600">{row.getValue("artist") || "Unknown"}</div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const artefact = row.original;

        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/admin/page-builder?edit=${artefact.id}`);
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
                handleArtefactQR(artefact);
              }}
              className="flex items-center gap-1 text-green-600 hover:text-green-700 hover:cursor-pointer"
            >
              <QrCodeIcon className="h-4 w-4" />
              QR
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteArtefact(artefact.id);
              }}
              className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:cursor-pointer"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  
  const questColumns: ColumnDef<Quest>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
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
      id: "status",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:cursor-pointer"
          >
            Status
          </Button>
        );
      },
      cell: ({ row }) => {
        const quest = row.original;
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
        
        return (
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusColor}`}></div>
            <span className="text-sm font-medium">{status}</span>
          </div>
        );
      },
    },
    {
      id: "date_range",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:cursor-pointer"
          >
            Date Range
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const quest = row.original;
        const startDate = quest.dateRange?.from;
        const endDate = quest.dateRange?.to;
        
        if (!startDate && !endDate) {
          return <div className="text-gray-400 text-sm">No dates set</div>;
        }
        
        const formatDate = (dateStr: string | Date) => {
          return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
        };
        
        if (startDate && endDate) {
          return (
            <div className="text-sm text-gray-600">
              {formatDate(startDate)} - {formatDate(endDate)}
            </div>
          );
        } else if (startDate) {
          return (
            <div className="text-sm text-gray-600">
              From {formatDate(startDate)}
            </div>
          );
        } else if (endDate) {
          return (
            <div className="text-sm text-gray-600">
              Until {formatDate(endDate)}
            </div>
          );
        }
        
        return <div className="text-gray-400 text-sm">-</div>;
      },
      sortingFn: (rowA, rowB) => {
        const today = new Date();
        
        const getClosestDate = (quest: Quest) => {
          const startDate = quest.dateRange?.from ? new Date(quest.dateRange.from) : null;
          const endDate = quest.dateRange?.to ? new Date(quest.dateRange.to) : null;
          
          if (!startDate && !endDate) return new Date('9999-12-31'); // Far future for no dates
          
          const dates = [startDate, endDate].filter(Boolean) as Date[];
          
          // Find the date closest to today
          return dates.reduce((closest, current) => {
            const closestDiff = Math.abs(closest.getTime() - today.getTime());
            const currentDiff = Math.abs(current.getTime() - today.getTime());
            return currentDiff < closestDiff ? current : closest;
          });
        };
        
        const dateA = getClosestDate(rowA.original);
        const dateB = getClosestDate(rowB.original);
          // Sort by closest to today, taking into account the sort direction
        const diffA = Math.abs(dateA.getTime() - today.getTime());
        const diffB = Math.abs(dateB.getTime() - today.getTime());
        
        // Get sort order from column info - if ascending, smaller diffs (closer dates) come first
        // if descending, larger diffs (further dates) come first
        const sortOrder = questTable.getColumn("date_range")?.getIsSorted() === "desc" ? -1 : 1;
        return (diffA - diffB) * sortOrder;
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const quest = row.original;

        return (
          <div className="flex items-center justify-end gap-2">
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
                handleDeleteQuest(quest.quest_id);
              }}
              className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:cursor-pointer"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  // Initialize the tables
  const table = useReactTable({
    data: artefacts,
    columns: artefactColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const questTable = useReactTable({
    data: quests,
    columns: questColumns,
    onSortingChange: setQuestSorting,
    onColumnFiltersChange: setQuestColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setQuestColumnVisibility,
    state: {
      sorting: questSorting,
      columnFilters: questColumnFilters,
      columnVisibility: questColumnVisibility,
    },
  });

  useEffect(() => {
    console.log('I am the admin page');
  }, []);

  if (loading) {
    return (
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-[90vh] p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start w-full max-w-4xl">
          <div className="flex flex-col w-full gap-8">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-gray-500 mb-6">
                Manage your quests and artefacts here.
              </p>
            </div>
            <p>Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  const handleDeleteArtefact = async (id: string) => {
    // Check if artefact is used in any quest
    const res = await fetch("/api/check-artifact-usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artefactId: id }),
    });
    const data = await res.json();
    if (data.usedIn && data.usedIn.length > 0) {
      setDeleteWarning(
        `This artefact is used in the following quest(s):\n${data.usedIn
          .map((q: { title: string }) => q.title)
          .join(", ")}. You must remove it from all quests before deleting.`
      );
      setDeletingId(id);
      setDeleteType("artefact");
      return;
    }
    setDeleteWarning("");
    setDeletingId(id);
    setDeleteType("artefact");
  };

  const handleDeleteQuest = (id: string) => {
    setDeletingId(id);
    setDeleteType("quest");
    setDeleteWarning("");
  };

  const confirmDelete = async () => {
    if (!deletingId || !deleteType) return;
    const url = deleteType === "artefact" ? "/api/delete-artifact" : "/api/delete-quest";
    const res = await fetch(url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deletingId }),
    });
    if (res.ok) {
      setShowDeleteSuccess(true);
      setTimeout(() => window.location.reload(), 1200);
    }
    setDeletingId(null);
    setDeleteType(null);
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-[90vh] p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start w-full max-w-6xl">
        <div className="flex flex-col w-full gap-8">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-gray-500 mb-6">
              Manage your quests and artefacts here.
            </p>
          </div>

          {/* Quests Section - Updated Data Table */}
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
                  placeholder="Search quests..."
                  value={(questTable.getColumn("title")?.getFilterValue() as string) ?? ""}
                  onChange={(event) =>
                    questTable.getColumn("title")?.setFilterValue(event.target.value)
                  }
                  className="max-w-sm"
                />
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    {questTable.getHeaderGroups().map((headerGroup) => (
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
                    {questTable.getRowModel().rows?.length ? (
                      questTable.getRowModel().rows.map((row) => (
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
                          colSpan={questColumns.length}
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
                  Showing {questTable.getRowModel().rows.length} of{" "}
                  {questTable.getFilteredRowModel().rows.length} quest(s).
                </div>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => questTable.previousPage()}
                    disabled={!questTable.getCanPreviousPage()}
                    className="hover:cursor-pointer disabled:hover:cursor-not-allowed"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => questTable.nextPage()}
                    disabled={!questTable.getCanNextPage()}
                    className="hover:cursor-pointer disabled:hover:cursor-not-allowed"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Artefacts Section - New Data Table */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Artefacts</h2>
              <Button
                variant="default"
                onClick={() => router.push("/admin/page-builder")}
                className="hover:cursor-pointer"
              >
                Create New Artefact
              </Button>
            </div>
            
            {/* Data Table */}
            <div className="w-full">
              <div className="flex items-center py-4">
                <Input
                  placeholder="Filter artefacts..."
                  value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                  onChange={(event) =>
                    table.getColumn("name")?.setFilterValue(event.target.value)
                  }
                  className="max-w-sm"
                />
                {/* Simple column visibility - removed dropdown due to dependency issues */}
                <div className="ml-auto flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.getColumn("name")?.toggleVisibility()}
                    className={`hover:cursor-pointer ${table.getColumn("name")?.getIsVisible() ? "" : "opacity-50"}`}
                  >
                    Name
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.getColumn("artist")?.toggleVisibility()}
                    className={`hover:cursor-pointer ${table.getColumn("artist")?.getIsVisible() ? "" : "opacity-50"}`}
                  >
                    Artist
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
                          data-state={row.getIsSelected() && "selected"}
                          onClick={() => row.toggleSelected()}
                          className="cursor-pointer hover:bg-gray-50 hover:cursor-pointer"
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
                          colSpan={artefactColumns.length}
                          className="h-24 text-center"
                        >
                          No artefacts found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-end space-x-2 py-4">
                <div className="text-muted-foreground flex-1 text-sm">
                  {table.getFilteredSelectedRowModel().rows.length} of{" "}
                  {table.getFilteredRowModel().rows.length} row(s) selected.
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
        </div>
      </main>
      
      {/* QR Code Popup Modal */}
      {showQRPopup && selectedArtefact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">
                QR Code for {selectedArtefact.name}
              </h3>
              <button
                onClick={() => {
                  setShowQRPopup(false);
                  setSelectedArtefact(null);
                }}
                className="text-gray-400 hover:text-gray-600 hover:cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div id="qr-popup" className="flex flex-col items-center gap-6">
              <QRCodeGenerator
                data={{ artefactId: selectedArtefact.id }}
                size={250}
                className="bg-gray-50 p-4 rounded-lg"
              />
              
              <div className="flex gap-3 w-full">
                <Button
                  variant="default"
                  onClick={handleQRDownload}
                  className="flex-1 flex items-center h-10 justify-center gap-2 hover:cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  Download as {contentType.toUpperCase()}
                </Button>
                
                {/* Custom styled select dropdown */}
                <div className="relative w-20">
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value as "png" | "jpg" | "jpeg")}
                    className="w-full h-10 px-3 text-sm bg-white border border-gray-300 rounded-md shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:cursor-pointer appearance-none"
                  >
                    <option value="png">PNG</option>
                    <option value="jpg">JPG</option>
                    <option value="jpeg">JPEG</option>
                  </select>
                  {/* Custom dropdown arrow */}
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => {
                    setShowQRPopup(false);
                    setSelectedArtefact(null);
                  }}
                  className="flex-1 hover:cursor-pointer h-10"
                >
                  Close
                </Button>
              </div>
            </div>
            
            {selectedArtefact.artist && (
              <div className="mt-4 text-sm text-gray-600 text-center">
                Artist: {selectedArtefact.artist}
              </div>
            )}
          </div>
        </div>
      )}      
      
      {/* Delete Confirmation Modal */}
      {/* Delete Confirmation Modal - Updated with shadcn styling */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-white rounded-lg shadow-xl border p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <Trash className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete {deleteType === 'artefact' ? 'Artefact' : 'Quest'}
                </h3>
                <p className="text-sm text-gray-500">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-700">
                {deleteWarning
                  ? deleteWarning
                  : `Are you sure you want to delete this ${deleteType}? This will permanently remove it from your system.`}
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setDeletingId(null);
                  setDeleteType(null);
                  setDeleteWarning("");
                }}
                className="hover:cursor-pointer"
              >
                Cancel
              </Button>
              {!deleteWarning && (
                <Button
                  variant="destructive"
                  onClick={confirmDelete}
                  className="hover:cursor-pointer"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete {deleteType === 'artefact' ? 'Artefact' : 'Quest'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      {showDeleteSuccess && (
        <SuccessPopup message="Deleted successfully!" onOk={() => window.location.reload()} />
      )}
    </div>
  );
}