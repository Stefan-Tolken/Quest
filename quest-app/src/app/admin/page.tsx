"use client";

import React from "react";
import { useData } from "@/context/dataContext";
import { Button } from "@/components/ui/button";
import { Edit, Trash, QrCode as QrCodeIcon, ArrowUpDown, X, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SuccessPopup from "@/components/ui/SuccessPopup";
import QRCodeGenerator from "@/components/QRGenerator";
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
  
  // Bulk QR Download state
  const [showBulkQRPopup, setShowBulkQRPopup] = useState(false);
  const [bulkDownloadType, setBulkDownloadType] = useState<"pdf" | "images">("images");
  const [bulkImageType, setBulkImageType] = useState<"png" | "jpg" | "jpeg">("png");
  const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);
  
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

  // Get selected artefacts
  const getSelectedArtefacts = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    return selectedRows.map(row => row.original);
  };

  // Generate QR code as canvas
  const generateQRCanvas = async (artefact: Artefact, size: number = 200): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
      // Create a temporary container for QR generation
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.innerHTML = `<div id="temp-qr-${artefact.id}"></div>`;
      document.body.appendChild(tempDiv);

      const qrContainer = document.getElementById(`temp-qr-${artefact.id}`);
      if (!qrContainer) {
        document.body.removeChild(tempDiv);
        reject(new Error('Could not create QR container'));
        return;
      }

      // Create a React root and render the QR component
      import('react-dom/client').then(({ createRoot }) => {
        const root = createRoot(qrContainer);
        
        // Render your QRCodeGenerator component
        // Render QRCodeGenerator and extract the SVG after rendering
        root.render(
          React.createElement(QRCodeGenerator, {
            data: { artefactId: artefact.id },
            size: size,
          })
        );

        // Wait for the QRCodeGenerator to render, then extract the SVG and convert to canvas
        setTimeout(() => {
          const svgElement = qrContainer.querySelector('svg');
          if (!svgElement) {
            root.unmount();
            document.body.removeChild(tempDiv);
            reject(new Error('Could not find QR SVG element'));
            return;
          }

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            root.unmount();
            document.body.removeChild(tempDiv);
            reject(new Error('Could not get canvas context'));
            return;
          }

          const svgData = new XMLSerializer().serializeToString(svgElement);
          const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(svgBlob);

          const img = new Image();
          img.onload = () => {
            canvas.width = size;
            canvas.height = size;
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            // Clean up
            URL.revokeObjectURL(url);
            root.unmount();
            document.body.removeChild(tempDiv);
            resolve(canvas);
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            root.unmount();
            document.body.removeChild(tempDiv);
            reject(new Error('Failed to load QR image'));
          };
          img.src = url;
        }, 100);
      }).catch(error => {
        document.body.removeChild(tempDiv);
        reject(error);
      });
    });
  };

  // Handle bulk download as images
  const handleBulkDownloadImages = async () => {
    const selectedArtefacts = getSelectedArtefacts();
    if (selectedArtefacts.length === 0) return;

    setIsGeneratingBulk(true);
    
    try {
      for (const artefact of selectedArtefacts) {
        const canvas = await generateQRCanvas(artefact);
        
        // Determine MIME type and quality based on selected format
        let mimeType = 'image/png';
        let quality = 1;
        let extension = 'png';
        
        if (bulkImageType === 'jpg' || bulkImageType === 'jpeg') {
          mimeType = 'image/jpeg';
          quality = 0.95;
          extension = bulkImageType;
        }
        
        // Download the image
        const imageUrl = canvas.toDataURL(mimeType, quality);
        const downloadLink = document.createElement('a');
        downloadLink.href = imageUrl;
        downloadLink.download = `qr-code-${artefact.name.replace(/\s+/g, '-').toLowerCase()}.${extension}`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Small delay between downloads to prevent browser blocking
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('Error generating bulk QR codes:', error);
      alert('Error generating QR codes. Please try again.');
    }
    
    setIsGeneratingBulk(false);
    setShowBulkQRPopup(false);
  };

  // Handle bulk download as PDF
  const handleBulkDownloadPDF = async () => {
    const selectedArtefacts = getSelectedArtefacts();
    if (selectedArtefacts.length === 0) return;

    setIsGeneratingBulk(true);
    
    try {
      // You'll need to install jsPDF: npm install jspdf
      // For now, I'll create a simple implementation
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF();
      
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      const qrSize = 60; // mm
      const margin = 20; // mm
      const qrsPerRow = Math.floor((pageWidth - 2 * margin) / (qrSize + 10));
      const qrsPerCol = Math.floor((pageHeight - 2 * margin) / (qrSize + 20));
      const qrsPerPage = qrsPerRow * qrsPerCol;
      
      for (let i = 0; i < selectedArtefacts.length; i++) {
        const artefact = selectedArtefacts[i];
        
        // Add new page if needed
        if (i > 0 && i % qrsPerPage === 0) {
          pdf.addPage();
        }
        
        const pageIndex = i % qrsPerPage;
        const row = Math.floor(pageIndex / qrsPerRow);
        const col = pageIndex % qrsPerRow;
        
        const x = margin + col * (qrSize + 10);
        const y = margin + row * (qrSize + 20);
        
        // Generate QR code canvas
        const canvas = await generateQRCanvas(artefact, 200);
        const imgData = canvas.toDataURL('image/png');
        
        // Add QR code to PDF
        pdf.addImage(imgData, 'PNG', x, y, qrSize, qrSize);
        
        // Add artefact name below QR code
        pdf.setFontSize(8);
        pdf.text(artefact.name, x + qrSize/2, y + qrSize + 5, { align: 'center', maxWidth: qrSize });
        
        if (artefact.artist) {
          pdf.setFontSize(6);
          pdf.text(`by ${artefact.artist}`, x + qrSize/2, y + qrSize + 10, { align: 'center', maxWidth: qrSize });
        }
      }
      
      // Download PDF
      pdf.save(`qr-codes-bulk-${Date.now()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please make sure jsPDF is installed.');
    }
    
    setIsGeneratingBulk(false);
    setShowBulkQRPopup(false);
  };

  // Handle bulk QR download
  const handleBulkQRDownload = () => {
    const selectedArtefacts = getSelectedArtefacts();
    if (selectedArtefacts.length === 0) {
      alert('Please select at least one artefact to download QR codes.');
      return;
    }
    setShowBulkQRPopup(true);
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
      accessorKey: "status",
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
      accessorKey: "dateRange.from",
      id: "start_date",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => {
              column.toggleSorting(column.getIsSorted() === "asc");
            }}
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
        
        const formatDate = (dateStr: string | Date) => {
          return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
        };
        
        if (startDate) {
          return (
            <div className="text-sm text-gray-600 ml-3">
              {formatDate(startDate)}
            </div>
          );
        }
        
        return <div className="text-gray-400 text-sm ml-3">-</div>;
      },
      accessorFn: (row) => {
        // This is key - provide an accessor function for sorting
        if (row.dateRange?.from) return new Date(row.dateRange.from).getTime();
        return Infinity; // Put items without dates at the end
      },
      sortingFn: (rowA, rowB) => {
        const getDateValue = (quest: Quest) => {
          if (quest.dateRange?.from) return new Date(quest.dateRange.from).getTime();
          return Infinity; // Items without dates go to the end
        };

        const dateA = getDateValue(rowA.original);
        const dateB = getDateValue(rowB.original);

        // Return -1, 0, or 1 for proper sorting
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        return 0;
      },
      enableSorting: true,
    },
    {
      accessorKey: "dateRange.to",
      id: "end_date",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => {
              column.toggleSorting(column.getIsSorted() === "asc");
            }}
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
        
        const formatDate = (dateStr: string | Date) => {
          return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
        };
        
        if (endDate) {
          return (
            <div className="text-sm ml-3 text-gray-600">
              {formatDate(endDate)}
            </div>
          );
        }
        
        return <div className="text-gray-400 text-sm ml-3">-</div>;
      },
      accessorFn: (row) => {
        if (row.dateRange?.to) return new Date(row.dateRange.to).getTime();
        return Infinity; // Put items without dates at the end
      },
      sortingFn: (rowA, rowB) => {
        const getDateValue = (quest: Quest) => {
          if (quest.dateRange?.to) return new Date(quest.dateRange.to).getTime();
          return Infinity; // Items without dates go to the end
        };

        const dateA = getDateValue(rowA.original);
        const dateB = getDateValue(rowB.original);

        // Return -1, 0, or 1 for proper sorting
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        return 0;
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
                <div className="ml-auto flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => questTable.getColumn("title")?.toggleVisibility()}
                    className={`hover:cursor-pointer ${questTable.getColumn("title")?.getIsVisible() ? "" : "opacity-50"}`}
                  >
                    Title
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => questTable.getColumn("status")?.toggleVisibility()}
                    className={`hover:cursor-pointer ${questTable.getColumn("status")?.getIsVisible() ? "" : "opacity-50"}`}
                  >
                    Status
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => questTable.getColumn("start_date")?.toggleVisibility()}
                    className={`hover:cursor-pointer ${questTable.getColumn("start_date")?.getIsVisible() ? "" : "opacity-50"}`}
                  >
                    Start
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => questTable.getColumn("end_date")?.toggleVisibility()}
                    className={`hover:cursor-pointer ${questTable.getColumn("end_date")?.getIsVisible() ? "" : "opacity-50"}`}
                  >
                    End
                  </Button>
                </div>
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
              <div className="flex gap-2">
                {/* Bulk QR Download Button */}
                <Button
                  variant="outline"
                  onClick={handleBulkQRDownload}
                  disabled={table.getFilteredSelectedRowModel().rows.length === 0}
                  className="flex items-center gap-2 hover:cursor-pointer disabled:hover:cursor-not-allowed"
                >
                  <QrCodeIcon className="h-4 w-4" />
                  Download QR Codes ({table.getFilteredSelectedRowModel().rows.length})
                </Button>
                
                <Button
                  variant="default"
                  onClick={() => router.push("/admin/page-builder")}
                  className="hover:cursor-pointer"
                >
                  Create New Artefact
                </Button>
              </div>
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
                size={200}
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

      {showBulkQRPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">
                Download QR Codes ({getSelectedArtefacts().length} selected)
              </h3>
              <button
                onClick={() => setShowBulkQRPopup(false)}
                className="text-gray-400 hover:text-gray-600 hover:cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Download Type Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">
                  Download Format
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="bulkDownloadType"
                      value="images"
                      checked={bulkDownloadType === "images"}
                      onChange={(e) => setBulkDownloadType(e.target.value as "pdf" | "images")}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Individual Images</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="bulkDownloadType"
                      value="pdf"
                      checked={bulkDownloadType === "pdf"}
                      onChange={(e) => setBulkDownloadType(e.target.value as "pdf" | "images")}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Single PDF File</span>
                  </label>
                </div>
              </div>

              {/* Image Type Selection (only show when images is selected) */}
              {bulkDownloadType === "images" && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block">
                    Image Format
                  </label>
                  <div className="relative">
                    <select
                      value={bulkImageType}
                      onChange={(e) => setBulkImageType(e.target.value as "png" | "jpg" | "jpeg")}
                      className="w-full h-10 px-3 text-sm bg-white border border-gray-300 rounded-md shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:cursor-pointer appearance-none"
                    >
                      <option value="png">PNG</option>
                      <option value="jpg">JPG</option>
                      <option value="jpeg">JPEG</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Selected Artefacts Preview */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Selected Artefacts
                </label>
                <div className="max-h-32 overflow-y-auto bg-gray-50 rounded-md p-3">
                  {getSelectedArtefacts().map((artefact, index) => (
                    <div key={artefact.id} className="text-sm text-gray-600 py-1">
                      {index + 1}. {artefact.name} {artefact.artist && `by ${artefact.artist}`}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowBulkQRPopup(false)}
                  className="flex-1 hover:cursor-pointer"
                  disabled={isGeneratingBulk}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  onClick={bulkDownloadType === "pdf" ? handleBulkDownloadPDF : handleBulkDownloadImages}
                  className="flex-1 flex items-center justify-center gap-2 hover:cursor-pointer"
                  disabled={isGeneratingBulk}
                >
                  {isGeneratingBulk ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download {bulkDownloadType === "pdf" ? "PDF" : `${bulkImageType.toUpperCase()} Images`}
                    </>
                  )}
                </Button>
              </div>
            </div>
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