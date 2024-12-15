import { User } from "@prisma/client";
import { actions } from "astro:actions";
import { useState } from "react";
import { toast } from "react-hot-toast";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import day from "@/lib/dayjs";

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

const UserCards = ({ users }: { users: User[] }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 9;

  const handleSendMessage = async () => {
    try {
      await actions.notifications_notifyUser({
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

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(users.length / usersPerPage);

  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 py-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {currentUsers.map((user) => (
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

      {/* Pagination Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="sm"
          className="min-w-[100px] font-medium tracking-wide"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <span className="flex items-center text-sm font-medium text-foreground">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="min-w-[100px] font-medium tracking-wide"
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default UserCards;
