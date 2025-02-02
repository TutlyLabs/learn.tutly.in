import type { Role } from "@prisma/client";
import { useCallback, useRef, useState } from "react";
import { toast } from "react-hot-toast";

import { Pagination } from "@/components/table/Pagination";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSearchParams } from "@/hooks/use-search-params";
import day from "@/lib/dayjs";
import { api } from "@/trpc/react";

type UserData = {
  id: string;
  name: string | null;
  username: string;
  email: string | null;
  mobile: string | null;
  image: string | null;
  role: Role;
  lastSeen: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const renderOnlineStatus = ({ lastSeen }: { lastSeen: Date | null }) => {
  if (!lastSeen) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={50}>
          <TooltipTrigger asChild>
            <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
          </TooltipTrigger>
          <TooltipContent side="top" align="center" sideOffset={5}>
            <p>Never logged in</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const now = day();
  const lastSeenTime = day(lastSeen);
  const diffInMinutes = now.diff(lastSeenTime, "minute");
  const isOnline = diffInMinutes < 2;

  return (
    <>
      <TooltipProvider>
        <Tooltip delayDuration={50}>
          <TooltipTrigger asChild>
            <div
              className={`absolute right-2 top-2 h-2 w-2 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-gray-500"}`}
            />
          </TooltipTrigger>
          <TooltipContent side="top" align="center" sideOffset={5}>
            <p>{isOnline ? "User is currently online!" : `Last seen ${lastSeenTime.fromNow()}`}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <span className="ml-2 text-xs">
        {isOnline ? "(Online)" : `(Last seen ${lastSeenTime.fromNow()})`}
      </span>
    </>
  );
};

interface UserCardsProps {
  users: UserData[];
  totalItems: number;
  activeCount: number;
  defaultPageSize: number;
}

type SortOption = {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
};

const sortOptions: SortOption[] = [
  { label: "Last Active", value: "last-login" },
  { label: "Least Active", value: "active-asc" },
  { label: "Name (A-Z)", value: "name-asc" },
  { label: "Name (Z-A)", value: "name-desc" },
  { label: "Join Date (Newest)", value: "join-date-desc" },
  { label: "Join Date (Oldest)", value: "join-date-asc" },
];

const filterOptions: SortOption[] = [
  { label: "All Users", value: "all" },
  { label: "Online", value: "online" },
  { label: "Students", value: "STUDENT" },
  { label: "Mentors", value: "MENTOR" },
];

const UserCards = ({ users, totalItems, activeCount, defaultPageSize }: UserCardsProps) => {
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [message, setMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "last-login");
  const [activeFilter, setActiveFilter] = useState(
    searchParams.get("online-only") === "true" ? "online" : searchParams.get("role") || "all"
  );
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const handleSearch = useCallback(
    (value: string) => {
      setSearchTerm(value);

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
          prev.set("page", "1");
          return prev;
        });
      }, 500);
    },
    [setSearchParams]
  );

  const handleSort = (value: string) => {
    setSortBy(value);
    setSearchParams((prev: URLSearchParams) => {
      prev.set("sort", value);
      prev.set("page", "1");
      return prev;
    });
  };

  const handleFilter = (value: string) => {
    setActiveFilter(value);
    setSearchParams((prev: URLSearchParams) => {
      prev.delete("role");
      prev.delete("online-only");

      if (value !== "all") {
        if (value === "online") {
          prev.set("online-only", "true");
        } else {
          prev.set("role", value);
        }
      }

      prev.set("page", "1");
      return prev;
    });
  };

  const currentPage = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("limit") || defaultPageSize.toString());
  const totalPages = Math.ceil(totalItems / pageSize);

  const { mutateAsync: notifyUser } = api.notifications.notifyUser.useMutation();

  const handleSendMessage = async () => {
    try {
      await notifyUser({
        userId: selectedUser?.id!,
        message,
      });
      toast.success("Message sent successfully!");
      setMessage("");
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const handlePageChange = (page: number) => {
    setSearchParams((prev: URLSearchParams) => {
      prev.set("page", page.toString());
      return prev;
    });
  };

  const handlePageSizeChange = (size: number) => {
    setSearchParams((prev: URLSearchParams) => {
      prev.set("limit", size.toString());
      prev.set("page", "1");
      return prev;
    });
  };

  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Users</h2>
          <div className="flex gap-2">
            <Badge variant="secondary">Total: {totalItems}</Badge>
            <Badge variant="outline">Active: {activeCount}</Badge>
          </div>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Select value={sortBy} onValueChange={handleSort}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={activeFilter} onValueChange={handleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by" />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full sm:w-[200px]"
          />
        </div>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">
            {activeFilter === "online" ? "No users are currently online" : "No users found"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <Card
              key={user.id}
              className="group relative overflow-hidden bg-card transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
            >
              <CardHeader className="flex flex-row items-center gap-4 p-4">
                <Avatar className="h-12 w-12 ring-2 ring-primary/20 transition-transform duration-300 group-hover:scale-110">
                  <AvatarImage
                    src={user.image ?? "/placeholder.jpg"}
                    alt={user.name ?? ""}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                    {user.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") ?? user.username?.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-0.5">
                  <CardTitle className="text-lg font-bold tracking-tight">
                    {user.name ?? user.username}
                  </CardTitle>
                  <CardDescription className="text-sm font-medium text-muted-foreground">
                    {user.role}
                    {renderOnlineStatus({ lastSeen: user.lastSeen })}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-4 pt-0">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-foreground">Email:</span>
                    <span className="text-muted-foreground hover:text-foreground transition-colors">
                      {user.email ?? "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-foreground">Mobile:</span>
                    <span className="text-muted-foreground hover:text-foreground transition-colors">
                      {user.mobile ?? "N/A"}
                    </span>
                  </div>
                  <Dialog
                    open={isOpen && selectedUser?.id === user.id}
                    onOpenChange={(open) => {
                      setIsOpen(open);
                      if (!open) setSelectedUser(null);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 w-full border font-medium tracking-wide transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
                        onClick={() => setSelectedUser(user)}
                      >
                        Notify User
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold">
                          Send Message to {user.name ?? user.username}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                          Send a notification message to this user
                        </DialogDescription>
                      </DialogHeader>
                      <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message here..."
                        className="min-h-[160px] resize-none text-base leading-relaxed"
                      />
                      <DialogFooter>
                        <Button
                          onClick={handleSendMessage}
                          size="lg"
                          className="w-full font-semibold"
                        >
                          Send Message
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
};

export default UserCards;
