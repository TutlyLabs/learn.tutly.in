import {
  ArrowUpDown,
  Download,
  Edit2,
  Eye,
  Filter,
  LayoutGrid,
  MoreHorizontal,
  MoreVertical,
  Plus,
  Table as TableIcon,
  Trash2,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSearchParams } from "@/hooks/use-search-params";
import { useToast } from "@/hooks/use-toast";

import { AdvancedCrudDialog } from "./AdvancedCrudDialog";
import BulkImport from "./BulkImport";

export interface IAction {
  label: string;
  icon: React.ReactNode;
  onClick: (row: any) => void | Promise<void>;
  variant?: "default" | "destructive";
}

export type FilterCondition = {
  column: string;
  value: string;
  operator: "contains" | "equals" | "startsWith" | "endsWith" | "greaterThan" | "lessThan";
};

export type Column = {
  key: string;
  name: string;
  label?: string;
  type?:
    | "text"
    | "number"
    | "date"
    | "datetime-local"
    | "time"
    | "email"
    | "tel"
    | "url"
    | "password"
    | "select"
    | "textarea"
    | "checkbox"
    | "radio"
    | "color"
    | "file"
    | "range"
    | "month"
    | "week";
  options?: { label: string; value: any }[];
  sortable?: boolean;
  filterable?: boolean;
  hidden?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
  validation?: {
    required?: boolean;
    regex?: RegExp;
    pattern?: RegExp;
    message?: string;
    minLength?: number;
    maxLength?: number;
    custom?: (value: any) => string | undefined;
  };
  min?: number | string;
  max?: number | string;
  step?: number | string;
  rows?: number;
  accept?: string;
  multiple?: boolean;
  placeholder?: string;
  hideInTable?: boolean;
};

type DisplayTableProps = {
  data: Record<string, any>[];
  columns: Column[];
  actions?: IAction[];
  onEdit?: (data: any) => Promise<{ data: any; error?: { message: string } }>;
  onDelete?: ({ id }: { id: any }) => Promise<{ data: any; error?: { message: string } }>;
  onCreate?: (data: any) => Promise<{ data: any; error?: { message: string } }>;
  onView?: ({ id }: { id: any }) => Promise<{ data: any; error?: { message: string } }>;
  onBulkImport?: (data: any[]) => Promise<{ data: any; error?: { message: string } }>;
  exportable?: boolean;
  searchable?: boolean;
  title?: string;
  defaultView?: "table" | "grid";
  filterable?: boolean;
};

export default function DisplayTable({
  data: initialData,
  columns,
  actions = [],
  onEdit,
  onDelete,
  onCreate,
  onView,
  onBulkImport,
  exportable = true,
  searchable = true,
  title = "Data Table",
  defaultView = "table",
  filterable = true,
}: DisplayTableProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [data, setData] = useState(initialData);

  const searchTerm = searchParams.get("search") || "";
  const viewMode = (searchParams.get("view") as "table" | "grid") || defaultView;
  const dialogMode =
    (searchParams.get("dialog") as "create" | "edit" | "view" | "delete") || "create";
  const selectedId = searchParams.get("id");
  const selectedRow = data.find((row) => row.id === selectedId);
  const isDialogOpen = Boolean(searchParams.get("dialog"));
  const { toast } = useToast();

  const activeFilters: FilterCondition[] = searchParams
    .getAll("filter")
    .map((f: string) => {
      const [column, operator, value] = f.split(":");
      if (!column || !operator || !value) return undefined;
      return {
        column,
        operator: operator as FilterCondition["operator"],
        value,
      };
    })
    .filter((f: FilterCondition | undefined): f is FilterCondition => f !== undefined);

  const sortConfig = searchParams.get("sort")
    ? {
        key: searchParams.get("sort") || "",
        direction: (searchParams.get("direction") as "asc" | "desc") || "asc",
      }
    : null;

  useEffect(() => {
    let sortedData = [...initialData];

    if (sortConfig) {
      sortedData.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (sortConfig.direction === "asc") {
          return aValue > bValue ? 1 : -1;
        }
        return aValue < bValue ? 1 : -1;
      });
    }

    setData(sortedData);
  }, [initialData, sortConfig]);

  const handleSort = (key: string) => {
    const column = columns.find((col) => col.key === key);
    if (!column?.sortable) return;

    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    setSearchParams((prev: URLSearchParams) => {
      prev.set("sort", key);
      prev.set("direction", direction);
      return prev;
    });
  };

  const addFilter = (column: string, value: string, operator: FilterCondition["operator"]) => {
    setSearchParams((prev: URLSearchParams) => {
      prev.append("filter", `${column}:${operator}:${value}`);
      return prev;
    });
  };

  const removeFilter = (index: number) => {
    setSearchParams((prev: URLSearchParams) => {
      const filters: string[] = prev.getAll("filter");
      filters.splice(index, 1);
      prev.delete("filter");
      filters.forEach((f) => prev.append("filter", f));
      return prev;
    });
  };

  const handleView = (row: any) => {
    try {
      if (onView) {
        setSearchParams((prev: URLSearchParams) => {
          prev.set("dialog", "view");
          prev.set("id", row.id);
          return prev;
        });
      }
    } catch (error) {
      console.error("View error:", error);
    }
  };

  const handleDialogClose = () => {
    setSearchParams((prev: URLSearchParams) => {
      prev.delete("dialog");
      prev.delete("id");
      return prev;
    });
  };

  const DeleteConfirmation = () => (
    <Dialog open={isDialogOpen && dialogMode === "delete"} onOpenChange={handleDialogClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Record</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>Are you sure you want to delete this record?</p>
          <div className="p-4 border rounded-md bg-muted space-y-2">
            <div className="font-medium">Record ID: {selectedRow?.id}</div>
            {columns
              .filter((col) => !col.hidden)
              .slice(0, 3)
              .map((col) => (
                <div key={col.key} className="text-sm">
                  <span className="font-medium">{col.label || col.name}:</span>{" "}
                  {col.type === "date"
                    ? new Date(selectedRow?.[col.key]).toLocaleDateString()
                    : col.render
                      ? col.render(selectedRow?.[col.key], selectedRow)
                      : selectedRow?.[col.key]}
                </div>
              ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleDialogClose}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (selectedRow) {
                  const success = await handleDelete(selectedRow);
                  if (success) {
                    handleDialogClose();
                  }
                }
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const renderGridView = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data.map((row, index) => (
          <div
            key={index}
            className="bg-background rounded-lg border shadow-sm hover:shadow-md transition-shadow p-4 relative"
          >
            <div className="absolute top-2 right-2">
              {(actions.length > 0 || onEdit || onDelete || onView) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {actions.map((action) => (
                      <DropdownMenuItem
                        key={action.label}
                        onClick={() => action.onClick(row)}
                        className={action.variant === "destructive" ? "text-destructive" : ""}
                      >
                        <div className="flex items-center">
                          {action.icon}
                          {action.label}
                        </div>
                      </DropdownMenuItem>
                    ))}
                    {actions.length > 0 && (onView || onEdit || onDelete) && (
                      <DropdownMenuSeparator className="my-2" />
                    )}
                    {onView && (
                      <DropdownMenuItem onClick={() => handleView(row)}>
                        <div className="flex items-center">
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </div>
                      </DropdownMenuItem>
                    )}
                    {onEdit && (
                      <DropdownMenuItem
                        onClick={() => {
                          setSearchParams((prev: URLSearchParams) => {
                            prev.set("dialog", "edit");
                            prev.set("id", row.id);
                            return prev;
                          });
                        }}
                      >
                        <div className="flex items-center">
                          <Edit2 className="mr-2 h-4 w-4" />
                          Edit
                        </div>
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={() => {
                          setSearchParams((prev: URLSearchParams) => {
                            prev.set("dialog", "delete");
                            prev.set("id", row.id);
                            return prev;
                          });
                        }}
                      >
                        <div className="flex items-center">
                          <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                          Delete
                        </div>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div className="space-y-2 pt-4">
              {columns
                .filter((column) => !column.hidden)
                .map((column) => (
                  <div key={column.key} className="flex justify-between items-center">
                    <div className="text-sm font-medium text-muted-foreground">
                      {column.label || column.name}:
                    </div>
                    <div className="text-sm">
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const FilterMenu = () => {
    const [selectedColumn, setSelectedColumn] = useState("");
    const [filterValue, setFilterValue] = useState("");
    const [operator, setOperator] = useState<FilterCondition["operator"]>("contains");

    const filterableColumns = columns.filter((col) => col.filterable);

    return (
      <Popover open={filterMenuOpen} onOpenChange={setFilterMenuOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Column</Label>
              <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                <SelectTrigger>
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {filterableColumns.map((column) => (
                    <SelectItem key={column.key} value={column.key}>
                      {column.label || column.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Operator</Label>
              <Select
                value={operator}
                onValueChange={(value: FilterCondition["operator"]) => setOperator(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select operator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contains">Contains</SelectItem>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="startsWith">Starts with</SelectItem>
                  <SelectItem value="endsWith">Ends with</SelectItem>
                  <SelectItem value="greaterThan">Greater than</SelectItem>
                  <SelectItem value="lessThan">Less than</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Value</Label>
              <Input
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                placeholder="Filter value..."
              />
            </div>

            <Button
              className="w-full"
              disabled={!selectedColumn || !filterValue}
              onClick={() => {
                addFilter(selectedColumn, filterValue, operator);
                setSelectedColumn("");
                setFilterValue("");
                setOperator("contains");
              }}
            >
              Apply Filter
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  const exportToCSV = () => {
    const visibleColumns = columns.filter((col) => !col.hidden);
    const headers = visibleColumns.map((col) => col.label || col.name).join(",");
    const rows = data.map((row) =>
      visibleColumns.map((col) => JSON.stringify(row[col.key] ?? "")).join(",")
    );
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "_")}_export.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCreate = async (data: any) => {
    try {
      if (onCreate) {
        const { error } = await onCreate(data);
        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
          return false;
        }
        toast({
          title: "Success",
          description: "Record created successfully",
        });
        return true;
      }
      return false;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create record",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleEdit = async (row: any) => {
    try {
      if (onEdit) {
        const { error } = await onEdit(row);
        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
          return false;
        }
        toast({
          title: "Success",
          description: "Record updated successfully",
        });
        return true;
      }
      return false;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update record",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleDelete = async (row: any) => {
    try {
      if (onDelete) {
        const { error } = await onDelete(row);
        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
          return false;
        }
        toast({
          title: "Success",
          description: "Record deleted successfully",
        });
        return true;
      }
      return false;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete record",
        variant: "destructive",
      });
      return false;
    }
  };

  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  const handleSearch = useCallback(
    (value: string) => {
      setLocalSearchTerm(value);

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        setSearchParams((prev: URLSearchParams) => {
          if (value) {
            prev.set("search", value);
          } else {
            prev.delete("search");
          }
          return prev;
        });
      }, 500);
    },
    [setSearchParams]
  );

  const filteredData = data.filter((row) => {
    if (localSearchTerm) {
      const searchFields = columns
        .filter((col) => !col.hidden)
        .map((col) => row[col.key])
        .join(" ")
        .toLowerCase();

      if (!searchFields.includes(localSearchTerm.toLowerCase())) {
        return false;
      }
    }

    return activeFilters.every((filter) => {
      const value = row[filter.column];
      if (value === undefined || value === null) return false;

      const stringValue = String(value).toLowerCase();
      const filterValue = filter.value.toLowerCase();

      switch (filter.operator) {
        case "contains":
          return stringValue.includes(filterValue);
        case "equals":
          return stringValue === filterValue;
        case "startsWith":
          return stringValue.startsWith(filterValue);
        case "endsWith":
          return stringValue.endsWith(filterValue);
        case "greaterThan":
          return Number(value) > Number(filterValue);
        case "lessThan":
          return Number(value) < Number(filterValue);
        default:
          return true;
      }
    });
  });

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="flex gap-2 items-center">
          {searchable && (
            <Input
              placeholder="Search..."
              value={localSearchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="max-w-sm"
            />
          )}
          {filterable && <FilterMenu />}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchParams((prev: URLSearchParams) => {
                prev.set("view", viewMode === "table" ? "grid" : "table");
                return prev;
              });
            }}
            className="flex items-center gap-2 px-3"
          >
            {viewMode === "table" ? (
              <>
                <TableIcon className="h-4 w-4" />
                <span>Table View</span>
              </>
            ) : (
              <>
                <LayoutGrid className="h-4 w-4" />
                <span>Grid View</span>
              </>
            )}
          </Button>
          {onCreate && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchParams((prev: URLSearchParams) => {
                  prev.set("dialog", "create");
                  return prev;
                });
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>New</span>
            </Button>
          )}
          {onBulkImport && (
            <BulkImport
              columns={columns}
              data={[]}
              onImport={async (importedData) => {
                if (onBulkImport) {
                  try {
                    await onBulkImport(importedData);
                    toast({
                      title: "Success",
                      description: "Bulk import completed successfully",
                    });
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Bulk import failed",
                      variant: "destructive",
                    });
                  }
                }
              }}
            />
          )}
          {exportable && (
            <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
          )}
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter, index) => {
            const column = columns.find((col) => col.key === filter.column);
            return (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                <span>{column?.label || column?.name}</span>
                <span className="text-xs opacity-70">{filter.operator}</span>
                <span>{filter.value}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => removeFilter(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
          {activeFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6"
              onClick={() =>
                setSearchParams((prev: URLSearchParams) => {
                  prev.delete("filter");
                  return prev;
                })
              }
            >
              Clear all
            </Button>
          )}
        </div>
      )}

      {viewMode === "table" ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns
                  .filter((column) => !column.hidden && !column.hideInTable)
                  .map((column) => (
                    <TableHead
                      key={column.key}
                      className={column.sortable ? "cursor-pointer" : ""}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      <div className="flex items-center">
                        <span>{column.label || column.name}</span>
                        {column.sortable && <ArrowUpDown className="ml-2 h-4 w-4" />}
                      </div>
                    </TableHead>
                  ))}
                {(actions.length > 0 || onEdit || onDelete || onView) && (
                  <TableHead>Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((row, index) => (
                <TableRow key={index}>
                  {columns
                    .filter((column) => !column.hidden && !column.hideInTable)
                    .map((column) => (
                      <TableCell key={`${index}-${column.key}`}>
                        {column.render ? column.render(row[column.key], row) : row[column.key]}
                      </TableCell>
                    ))}
                  {(actions.length > 0 || onEdit || onDelete || onView) && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {actions.map((action) => (
                              <DropdownMenuItem
                                key={action.label}
                                onClick={() => action.onClick(row)}
                                className={action.variant === "destructive" ? "text-red-500" : ""}
                              >
                                <div className="flex items-center">
                                  {action.icon}
                                  {action.label}
                                </div>
                              </DropdownMenuItem>
                            ))}
                            {actions.length > 0 && (onView || onEdit || onDelete) && (
                              <DropdownMenuSeparator className="my-2" />
                            )}
                            {onView && (
                              <DropdownMenuItem onClick={() => handleView(row)}>
                                <div className="flex items-center">
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </div>
                              </DropdownMenuItem>
                            )}
                            {onEdit && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSearchParams((prev: URLSearchParams) => {
                                    prev.set("dialog", "edit");
                                    prev.set("id", row.id);
                                    return prev;
                                  });
                                }}
                              >
                                <div className="flex items-center">
                                  <Edit2 className="mr-2 h-4 w-4" />
                                  Edit
                                </div>
                              </DropdownMenuItem>
                            )}
                            {onDelete && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSearchParams((prev: URLSearchParams) => {
                                    prev.set("dialog", "delete");
                                    prev.set("id", row.id);
                                    return prev;
                                  });
                                }}
                              >
                                <div className="flex items-center">
                                  <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                                  Delete
                                </div>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        renderGridView()
      )}

      {isDialogOpen && (
        <>
          {dialogMode === "delete" && <DeleteConfirmation />}
          {dialogMode === "view" && (
            <Dialog open={true} onOpenChange={handleDialogClose}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>View Record</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {columns
                    .filter((col) => !col.hidden)
                    .map((col) => (
                      <div key={col.key} className="space-y-2">
                        <Label>{col.label || col.name}</Label>
                        <div className="p-2 border rounded-md bg-muted">
                          {selectedRow?.[col.key]}
                        </div>
                      </div>
                    ))}
                  <div className="flex justify-end">
                    <Button
                      onClick={() =>
                        setSearchParams((prev: URLSearchParams) => {
                          prev.delete("dialog");
                          prev.delete("id");
                          return prev;
                        })
                      }
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          {(dialogMode === "create" || dialogMode === "edit") && (
            <AdvancedCrudDialog
              isOpen={true}
              onClose={handleDialogClose}
              onSubmit={async (formData) => {
                try {
                  if (dialogMode === "create") {
                    const success = await handleCreate(formData);
                    if (success) {
                      setSearchParams((prev: URLSearchParams) => {
                        prev.delete("dialog");
                        return prev;
                      });
                    }
                  } else if (dialogMode === "edit") {
                    const success = await handleEdit({
                      id: selectedRow?.id,
                      ...formData,
                    });
                    if (success) {
                      setSearchParams((prev: URLSearchParams) => {
                        prev.delete("dialog");
                        return prev;
                      });
                    }
                  }
                } catch (error) {
                  toast({
                    title: "Error",
                    description: `Failed to ${dialogMode} record`,
                    variant: "destructive",
                  });
                }
              }}
              onDelete={async () => {
                if (selectedRow) {
                  const success = await handleDelete(selectedRow);
                  if (success) {
                    setSearchParams((prev: URLSearchParams) => {
                      prev.delete("dialog");
                      return prev;
                    });
                  }
                }
              }}
              title={
                dialogMode === "create"
                  ? "Create New Record"
                  : dialogMode === "edit"
                    ? "Edit Record"
                    : "Delete Record"
              }
              columns={columns}
              initialData={dialogMode === "create" ? {} : selectedRow}
              mode={dialogMode}
            />
          )}
        </>
      )}
    </div>
  );
}
