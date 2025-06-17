// components/admin/ArtefactsTable.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash, QrCode as QrCodeIcon, ArrowUpDown, CheckSquare } from "lucide-react";
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
import { Artefact } from "@/lib/types";

interface ArtefactsTableProps {
  artefacts: Artefact[];
  onDeleteArtefact: (id: string) => void;
  onGenerateQR: (artefact: Artefact) => void;
  onBulkQRDownload: (selectedArtefacts: Artefact[]) => void | Promise<void>;
}

export default function ArtefactsTable({ 
  artefacts, 
  onDeleteArtefact, 
  onGenerateQR, 
  onBulkQRDownload 
}: ArtefactsTableProps) {
  const router = useRouter();
  
  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  // Column definitions
  const columns: ColumnDef<Artefact>[] = [
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
            variant="subtle"
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
            variant="subtle"
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
                onGenerateQR(artefact);
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
                onDeleteArtefact(artefact.id);
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

  // Initialize table
  const table = useReactTable({
    data: artefacts,
    columns,
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
    initialState: {
        pagination: {
            pageSize: 6, // This sets the number of rows per page to 6
        },
    },
  });

  // Get selected artefacts for bulk operations
  const getSelectedArtefacts = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    return selectedRows.map(row => row.original);
  };

  const handleBulkQRDownload = () => {
    const selectedArtefacts = getSelectedArtefacts();
    if (selectedArtefacts.length === 0) {
      alert('Please select at least one artefact to download QR codes.');
      return;
    }
    onBulkQRDownload(selectedArtefacts);
  };

  // Handle select all filtered artefacts
  const handleSelectAllFiltered = () => {
    // This will select all rows that match the current filter
    table.toggleAllRowsSelected(true);
  };

  // Handle deselect all
  const handleDeselectAll = () => {
    table.toggleAllRowsSelected(false);
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Artefacts</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSelectAllFiltered}
            className="flex items-center gap-2 hover:cursor-pointer"
          >
            <CheckSquare className="h-4 w-4" />
            Select All
          </Button>
          
          <Button
            variant="outline"
            onClick={handleDeselectAll}
            disabled={table.getFilteredSelectedRowModel().rows.length === 0}
            className="flex items-center gap-2 hover:cursor-pointer disabled:hover:cursor-not-allowed"
          >
            Deselect All
          </Button>
          
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
      
      <div className="w-full">
        <div className="flex items-center py-4">
          <Input
            placeholder="Filter artefacts..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="w-80 placeholder:text-gray-400 p-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-10 resize-none text-base"
          />
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
                    colSpan={columns.length}
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
  );
}