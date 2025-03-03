import { ArrowUpDown, Search } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const OverallAttendanceTable = ({ studentsAttendance }: { studentsAttendance: any }) => {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  }>({
    key: "-1",
    direction: "ascending",
  });
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = Array.isArray(studentsAttendance)
    ? studentsAttendance.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : [];

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortConfig.key === "-1") return 0;
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === "ascending" ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === "ascending" ? 1 : -1;
    }
    return 0;
  });

  const handleSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="container mx-auto space-y-4 px-4 pt-8 lg:px-20">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">Overall Attendance</h1>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-sm text-muted-foreground">Above 75%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-sm text-muted-foreground">Below 75%</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setSortConfig({ key: "-1", direction: "ascending" })}
              >
                Reset Sort
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-muted/50">
            <TableHead className="w-16">S.No</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("name")}
                className="flex items-center gap-2"
              >
                Name
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("username")}
                className="flex items-center gap-2"
              >
                Roll Number
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("percentage")}
                className="flex items-center gap-2"
              >
                Percentage
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>Classes Attended</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((item: any, index: number) => (
            <TableRow key={item.username} className="hover:bg-muted/50">
              <TableCell>{index + 1}</TableCell>
              <TableCell>
                <div className="flex items-center gap-4">
                  <img
                    src={item.image || "https://i.postimg.cc/zXj77wQG/image.png"}
                    width={40}
                    height={40}
                    alt="profile image"
                    className="rounded-full"
                  />
                  <span>{item.name}</span>
                </div>
              </TableCell>
              <TableCell>{item.username}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      item.percentage < 75 ? "bg-red-500" : "bg-emerald-500"
                    }`}
                  />
                  <span
                    className={`rounded-md px-2 py-1 text-xs font-medium ${
                      item.percentage < 75
                        ? "bg-red-500/10 text-red-400"
                        : "bg-emerald-500/10 text-emerald-600"
                    }`}
                  >
                    {Math.round(item.percentage)}%
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {item.classesAttended || 0}/{item.totalClasses || 0}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default OverallAttendanceTable;
