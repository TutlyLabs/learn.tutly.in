import { actions } from "astro:actions";
import { AlertCircle, Search, UserPlus, UserX, Users } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { FaSort, FaSortAlphaDown, FaSortAlphaDownAlt, FaUserPlus } from "react-icons/fa";
import { FaUserXmark } from "react-icons/fa6";
import { MdOutlineBlock } from "react-icons/md";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "@/hooks/use-router";

const UserTable = ({ users, params }: { users: Array<any>; params: any }) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [searchBar, setSearchBar] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [sortColumn, setSortColumn] = useState<string>("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchBar.trim().toLowerCase()) ||
      user.name?.toLowerCase().includes(searchBar.trim().toLowerCase()) ||
      user.email?.toLowerCase().includes(searchBar.trim().toLowerCase());

    if (!matchesSearch) return false;

    switch (activeTab) {
      case "enrolled":
        return user.enrolledUsers.some(({ course }: { course: any }) => course.id === params.id);
      case "not-enrolled":
        return !user.enrolledUsers.some(({ course }: { course: any }) => course.id === params.id);
      case "mentors":
        return user.role === "MENTOR";
      case "students":
        return user.role === "STUDENT";
      default:
        return true;
    }
  });

  const displayedUsers = filteredUsers;

  const mentors = users.filter(
    (user) =>
      user.role === "MENTOR" &&
      user.enrolledUsers.find(({ course }: { course: any }) => course.id === params.id) !==
        undefined
  );

  const handleNotifyUsers = async () => {
    toast.loading("Sending notifications...");
    try {
      setLoading(true);

      const { error } = await actions.notifications_notifyBulkUsers({
        message: notificationMessage,
        courseId: params.id,
        customLink: redirectUrl,
      });

      if (error) {
        toast.dismiss();
        toast.error(error.message);
        setLoading(false);
        return;
      }

      toast.dismiss();
      toast.success("Notifications sent successfully");
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      toast.dismiss();
      toast.error(err.response?.data?.error || "Failed to send notifications");
    }
  };

  const handleEnroll = async (username: string) => {
    toast.loading("Enrolling user...");
    try {
      setLoading(true);

      const { error } = await actions.courses_enrollStudentToCourse({
        courseId: params.id,
        username,
      });

      if (error) {
        toast.dismiss();
        toast.error(error.message);
        setLoading(false);
        return;
      }

      toast.dismiss();
      toast.success(`${username} enrolled successfully`);
      router.push(router.pathname);
      setLoading(false);
    } catch (err: any) {
      router.push(router.pathname);
      setLoading(false);
      toast.dismiss();
      toast.error(err.response.data.error);
    }
  };

  const handleUnenroll = async (username: string) => {
    toast.loading("Unenrolling user...");
    try {
      setLoading(true);

      const { error } = await actions.courses_unenrollStudentFromCourse({
        courseId: params.id,
        username,
      });

      if (error) {
        toast.dismiss();
        toast.error(error.message);
        setLoading(false);
        return;
      }
      toast.dismiss();
      toast.success(`${username} unenrolled successfully`);
      setLoading(false);
      router.push(router.pathname);
    } catch (err: any) {
      setLoading(false);
      toast.dismiss();
      toast.error(err.response.data.error);
    }
  };

  const handleMentorChange = async (username: string, mentorUsername: string) => {
    toast.loading("Updating mentor...");
    try {
      setLoading(true);

      await actions.courses_updateMentor({ courseId: params.id, username, mentorUsername });

      toast.dismiss();
      toast.success(`Mentor updated successfully`);
      setLoading(false);
      router.push(router.pathname);
    } catch (err: any) {
      setLoading(false);
      toast.dismiss();
      toast.error(err.response.data.error);
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
  };

  const enrolledCount = users.filter((user) =>
    user.enrolledUsers.some(({ course }: { course: any }) => course.id === params.id)
  ).length;

  const notEnrolledCount = users.length - enrolledCount;

  const mentorCount = users.filter((user) => user.role === "MENTOR").length;

  const sortedUsers = [...displayedUsers].sort((a, b) => {
    if (sortColumn) {
      if (sortColumn === "username") {
        return sortOrder === "asc"
          ? a.username.localeCompare(b.username)
          : b.username.localeCompare(a.username);
      } else if (sortColumn === "name") {
        return sortOrder === "asc"
          ? (a.name || "").localeCompare(b.name || "")
          : (b.name || "").localeCompare(a.name || "");
      } else if (sortColumn === "role") {
        return sortOrder === "asc" ? a.role.localeCompare(b.role) : b.role.localeCompare(a.role);
      } else if (sortColumn === "email") {
        return sortOrder === "asc"
          ? (a.email || "").localeCompare(b.email || "")
          : (b.email || "").localeCompare(a.email || "");
      }
    } else {
      const aEnrolled = a.enrolledUsers.some(
        ({ course }: { course: any }) => course.id === params.id
      );
      const bEnrolled = b.enrolledUsers.some(
        ({ course }: { course: any }) => course.id === params.id
      );

      if (aEnrolled && !bEnrolled) return -1;
      if (!aEnrolled && bEnrolled) return 1;

      if (a.role !== b.role) {
        if (a.role === "MENTOR") return -1;
        if (b.role === "MENTOR") return 1;
        if (a.role === "STUDENT") return -1;
        if (b.role === "STUDENT") return 1;
      }

      return a.username.localeCompare(b.username);
    }
    return 0;
  });

  return (
    <Card className="mb-8 w-full">
      <CardHeader>
        <CardTitle className="text-2xl">User Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-x-4 md:space-y-0">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by username, name or email..."
              value={searchBar}
              onChange={(e) => setSearchBar(e.target.value)}
              className="pl-9"
            />
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <AlertCircle className="h-4 w-4" />
                Notify Users
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Notification to Course Users</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 p-4">
                <Input
                  placeholder="Enter notification message"
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                />
                <Input
                  placeholder="Enter redirect URL (optional)"
                  value={redirectUrl}
                  onChange={(e) => setRedirectUrl(e.target.value)}
                />
                <Button
                  onClick={handleNotifyUsers}
                  disabled={loading || !notificationMessage}
                  className="w-full"
                >
                  Send Notification
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="all" className="gap-2">
              <Users className="h-4 w-4" />
              All
              <Badge variant="outline" className="ml-1">
                {users.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="enrolled" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Enrolled
              <Badge variant="outline" className="ml-1">
                {enrolledCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="not-enrolled" className="gap-2">
              <UserX className="h-4 w-4" />
              Not Enrolled
              <Badge variant="outline" className="ml-1">
                {notEnrolledCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="mentors" className="gap-2">
              Mentors
              <Badge variant="outline" className="ml-1">
                {mentorCount}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="rounded-md border w-full">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-16">S.No</TableHead>
                <TableHead>
                  <div
                    className="flex cursor-pointer items-center"
                    onClick={() => handleSort("username")}
                  >
                    Username
                    {sortColumn !== "username" && <FaSort className="ml-1 h-3 w-3" />}
                    {sortColumn === "username" && sortOrder === "asc" && (
                      <FaSortAlphaDown className="ml-1 h-3 w-3" />
                    )}
                    {sortColumn === "username" && sortOrder === "desc" && (
                      <FaSortAlphaDownAlt className="ml-1 h-3 w-3" />
                    )}
                  </div>
                </TableHead>
                <TableHead>
                  <div
                    className="flex cursor-pointer items-center"
                    onClick={() => handleSort("name")}
                  >
                    Name
                    {sortColumn !== "name" && <FaSort className="ml-1 h-3 w-3" />}
                    {sortColumn === "name" && sortOrder === "asc" && (
                      <FaSortAlphaDown className="ml-1 h-3 w-3" />
                    )}
                    {sortColumn === "name" && sortOrder === "desc" && (
                      <FaSortAlphaDownAlt className="ml-1 h-3 w-3" />
                    )}
                  </div>
                </TableHead>
                <TableHead>
                  <div
                    className="flex cursor-pointer items-center"
                    onClick={() => handleSort("role")}
                  >
                    Role
                    {sortColumn !== "role" && <FaSort className="ml-1 h-3 w-3" />}
                    {sortColumn === "role" && sortOrder === "asc" && (
                      <FaSortAlphaDown className="ml-1 h-3 w-3" />
                    )}
                    {sortColumn === "role" && sortOrder === "desc" && (
                      <FaSortAlphaDownAlt className="ml-1 h-3 w-3" />
                    )}
                  </div>
                </TableHead>
                <TableHead>
                  <div
                    className="flex cursor-pointer items-center"
                    onClick={() => handleSort("email")}
                  >
                    Email
                    {sortColumn !== "email" && <FaSort className="ml-1 h-3 w-3" />}
                    {sortColumn === "email" && sortOrder === "asc" && (
                      <FaSortAlphaDown className="ml-1 h-3 w-3" />
                    )}
                    {sortColumn === "email" && sortOrder === "desc" && (
                      <FaSortAlphaDownAlt className="ml-1 h-3 w-3" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Mentor</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <MdOutlineBlock className="h-5 w-5 text-muted-foreground" />
                      <span className="text-muted-foreground">No users found</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {sortedUsers.map((user, index) => (
                <TableRow key={user.id} className="group hover:bg-muted/50">
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <img
                        loading="lazy"
                        src={user.image || "/placeholder.jpg"}
                        alt={user.username}
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                      <span className="font-medium">{user.username}</span>
                    </div>
                  </TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "INSTRUCTOR" ? "secondary" : "outline"}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.role === "STUDENT" &&
                    user.enrolledUsers.find(
                      ({ course }: { course: any }) => course.id === params.id
                    ) !== undefined ? (
                      <div className="w-32">
                        <select
                          title="mentor"
                          value={
                            user.enrolledUsers.find(
                              ({ course }: { course: any }) => course.id === params.id
                            )?.mentorUsername || ""
                          }
                          onChange={(e) => handleMentorChange(user.username, e.target.value)}
                          disabled={loading}
                          className="w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        >
                          <option value="">None</option>
                          {mentors.map((mentor) => (
                            <option key={mentor.id} value={mentor.username}>
                              {mentor.username}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <Badge variant="outline">None</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.enrolledUsers.find(
                      ({ course }: { course: any }) => course.id === params.id
                    ) === undefined
                      ? user.role !== "INSTRUCTOR" && (
                          <Button
                            size="sm"
                            className="gap-1"
                            disabled={loading}
                            onClick={() => handleEnroll(user.username)}
                            variant="outline"
                          >
                            <FaUserPlus className="h-4 w-4" />
                            Enroll
                          </Button>
                        )
                      : user.role !== "INSTRUCTOR" && (
                          <Button
                            size="sm"
                            className="gap-1"
                            disabled={loading}
                            onClick={() => handleUnenroll(user.username)}
                            variant="destructive"
                          >
                            <FaUserXmark className="h-4 w-4" />
                            Unenroll
                          </Button>
                        )}
                    {user.role === "INSTRUCTOR" && <Badge variant="outline">No Action</Badge>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserTable;
