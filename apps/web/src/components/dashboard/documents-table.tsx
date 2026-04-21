"use client";

import { useState, useEffect } from "react";
import {
  useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel,
  getSortedRowModel, flexRender, type ColumnDef, type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, Search, FileText, FileOutput } from "lucide-react";
import { API_URL } from "@/lib/constants";

type Document = {
  id: string;
  input_filename: string;
  input_content_type: string;
  input_size_bytes: number;
  output_filename: string | null;
  output_size_bytes: number | null;
  conversion_type: "to_markdown" | "to_pdf";
  status: "pending" | "processing" | "completed" | "failed";
  error_message: string | null;
  created_at: string;
  expires_at: string;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const columns: ColumnDef<Document>[] = [
  {
    accessorKey: "input_filename",
    header: ({ column }) => (
      <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Input File <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="font-medium truncate max-w-[200px]" title={row.original.input_filename}>
          {row.original.input_filename}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "output_filename",
    header: "Output File",
    cell: ({ row }) => (
      <span className="truncate max-w-[200px] text-sm" title={row.original.output_filename || ""}>
        {row.original.output_filename || "—"}
      </span>
    ),
  },
  {
    accessorKey: "conversion_type",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="outline" className="gap-1">
        {row.original.conversion_type === "to_markdown" ? (
          <><FileText className="h-3 w-3" /> MD</>
        ) : (
          <><FileOutput className="h-3 w-3" /> PDF</>
        )}
      </Badge>
    ),
    filterFn: "equals",
  },
  {
    accessorKey: "input_size_bytes",
    header: ({ column }) => (
      <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Input <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => formatBytes(row.original.input_size_bytes),
  },
  {
    id: "output_size",
    header: "Output",
    cell: ({ row }) => row.original.output_size_bytes ? formatBytes(row.original.output_size_bytes) : "—",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const s = row.original.status;
      const variant = s === "completed" ? "default" : s === "failed" ? "destructive" : "secondary";
      return <Badge variant={variant}>{s}</Badge>;
    },
    filterFn: "equals",
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        When <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => timeAgo(row.original.created_at),
  },
];

export function DocumentsTable() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([{ id: "created_at", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("dk_token");
    if (!token) return;
    fetch(`${API_URL}/v1/documents`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setDocs(data.documents || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const table = useReactTable({
    data: docs,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 sm:w-[300px]"
          />
        </div>
        <div className="flex gap-2">
          <Select
            onValueChange={(v) =>
              table.getColumn("conversion_type")?.setFilterValue(v === "all" ? undefined : v)
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="to_markdown">Markdown</SelectItem>
              <SelectItem value="to_pdf">PDF</SelectItem>
            </SelectContent>
          </Select>
          <Select
            onValueChange={(v) =>
              table.getColumn("status")?.setFilterValue(v === "all" ? undefined : v)
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No documents yet. Convert a document to see it here.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} document(s)
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
