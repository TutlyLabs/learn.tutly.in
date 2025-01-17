import { LiveKitRoom } from "@livekit/components-react";
import { type Attachment, type Class, FileType, type Notes, type Video } from "@prisma/client";
import { actions } from "astro:actions";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

import {
  FaBookmark,
  FaExternalLinkAlt,
  FaPencilAlt,
  FaPlus,
  FaRegBookmark,
  FaStickyNote,
  FaTags,
  FaTrashAlt,
} from "react-icons/fa";
import { RiEdit2Fill } from "react-icons/ri";
import { useDebounce } from "use-debounce";
import VideoPlayer from "@/components/VideoPlayer";
import RichTextEditor from "@/components/editor/RichTextEditor";
import { StreamPlayer } from "@/components/stream-player";
import { TokenContext } from "@/components/token-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CreateStreamResponse, JoinStreamResponse } from "@/lib/controller";
import {Card} from "@/components/ui/card"
import NewAttachmentPage from "./NewAssignments";

export default function Class({
  classes,
  classId,
  courseId,
  currentUser,
  details,
  isBookmarked,
  initialNote,
  serverUrl,
}: {
  classes: any;
  classId: string;
  courseId: string;
  currentUser: any;
  details:
    | (Class & {
        title: string;
        video: Video | null;
        attachments: Attachment[];
      })
    | null;
  isBookmarked: boolean;
  initialNote?: Notes | null;
  serverUrl: string;
}) {
  if (!details) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  const { video, title, createdAt, attachments } = details;

  const isCourseAdmin = currentUser?.adminForCourses?.some(
    (course: { id: string }) => course.id === courseId
  );
  const haveAdminAccess = currentUser.role == "INSTRUCTOR" || isCourseAdmin;

  const [liveStarted, setLiveStarted] = useState(false);

  const renderVideo = () => {
    const [loading, setLoading] = useState(false);
    const [insAuthToken, setInsAuthToken] = useState("");
    const [insRoomToken, setInsRoomToken] = useState("");
    const [authToken, setAuthToken] = useState("");

    const searchParams = new URLSearchParams(window.location.search);
    const startInstantMeet = searchParams.get("stream");

    const onGoLive = async () => {
      setLoading(true);
      try {
        const { data: response, error } = await actions.stream_createStream({
          room_name: details.title,
          metadata: {
            creator_identity: currentUser.name,
            enable_chat: true,
            allow_participation: true,
          },
          headers: {
            Authorization: `Token ${authToken}`,
          },
        });

        if (error) {
          console.error("Failed to go live:", error);
          return;
        }

        if (response.data) {
          setInsAuthToken(response.data.auth_token);
          setInsRoomToken(response.data.connection_details.token);
          setLiveStarted(true);
        } else {
          console.error("No response data received");
        }
      } catch (error) {
        console.error("Failed to go live:", error);
      } finally {
        setLoading(false);
      }
    };

    if (haveAdminAccess) {
      if (!insAuthToken && !insRoomToken) {
        return (
          <span className="text-sm text-muted-foreground flex items-center justify-center h-full">
            <Button variant="link" className="text-blue-500" disabled={loading} onClick={onGoLive}>
              {loading ? "Going Live..." : "Start a Stream"}
            </Button>
          </span>
        );
      }

      return (
        <div>
          <TokenContext.Provider value={insAuthToken}>
            <LiveKitRoom serverUrl={serverUrl} token={insRoomToken}>
              <StreamPlayer isHost />
            </LiveKitRoom>
          </TokenContext.Provider>
        </div>
      );
    }

    const [roomToken, setRoomToken] = useState("");

    const onJoin = async () => {
      setLoading(true);
      try {
        const { data: response, error } = await actions.stream_joinStream({
          room_name: details.title,
          identity: currentUser.name,
          headers: {
            Authorization: `Token ${authToken}`,
          },
        });

        if (error) {
          console.error("Failed to join:", error);
          return;
        }

        const {
          auth_token,
          connection_details: { token },
        } = response as JoinStreamResponse;
        setAuthToken(auth_token);
        setRoomToken(token);
        setLiveStarted(true);
      } catch (error) {
        console.error("Failed to join:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!haveAdminAccess) {
      if (!authToken && !roomToken) {
        return (
          <span className="text-sm text-muted-foreground flex items-center justify-center h-full">
            <button
              disabled={loading}
              className="text-blue-500"
              onClick={() => {
                onJoin();
              }}
            >
              {loading ? "Joining..." : "Join the Stream"}
            </button>
          </span>
        );
      }

      return (
        <TokenContext.Provider value={authToken}>
          <LiveKitRoom serverUrl={serverUrl} token={roomToken}>
            <StreamPlayer />
          </LiveKitRoom>
        </TokenContext.Provider>
      );
    }

    return "No video available";
  };

  const renderAttachmentLink = (attachment: Attachment) => {
    if (attachment.attachmentType === "ASSIGNMENT") {
      return (
        <a href={`/assignments/${attachment.id}`}>
          <FaExternalLinkAlt className="m-auto h-4 w-4" />
        </a>
      );
    }

    if (attachment.link) {
      return (
        <a href={attachment.link} className="text-sm">
          <FaExternalLinkAlt className="m-auto h-4 w-4" />
        </a>
      );
    }

    return "No link";
  };

  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [notes, setNotes] = useState(initialNote?.description);
  const [debouncedNotes] = useDebounce(notes, 1000);
  const [notesStatus, setNotesStatus] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [tags, setTags] = useState<string[]>(initialNote?.tags || []);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    const saveNotes = async () => {
      if (debouncedNotes) {
        try {
          setNotesStatus("Saving...");
          await actions.notes_updateNote({
            objectId: classId,
            category: "CLASS",
            description: debouncedNotes,
            tags: tags,
            causedObjects: { classId: classId, courseId: courseId },
          });
          setLastSaved(new Date());
          setNotesStatus("Saved");
        } catch (error) {
          setNotesStatus("Failed to save");
        }
      }
    };

    saveNotes();
  }, [debouncedNotes, classId, tags]);

  const handleDelete = async () => {
    try {
      await actions.attachments_deleteAttachment({
        id: selectedAttachment?.id!,
      });
      toast.success("Assignment deleted successfully");
      window.location.reload();
    } catch (error) {
      toast.error("Failed to delete assignment");
    }
  };

  const toggleBookMark = async () => {
    try {
      const response = await actions.bookmarks_toggleBookmark({
        objectId: classId,
        category: "CLASS",
        causedObjects: { classId: classId, courseId: courseId },
      });

      if (response.error) {
        toast.error("failed to add bookmark");
      } else {
        toast.success(isBookmarked ? "Bookmark removed" : "Bookmark added");
        window.location.reload();
      }
    } catch (error) {
      toast.error("Failed to toggle bookmark");
    }
  };

  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="flex flex-col gap-4 md:m-5">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1">
          <div className="h-full w-full rounded-xl">
            <div>
              <div className="mb-2 flex w-full items-center justify-between">
                <div className="flex items-center justify-start space-x-5">
                  <p className="text-xl font-semibold">{title}</p>
                  {haveAdminAccess && (
                    <div className="flex items-center gap-3">
                      <a href={`/courses/${courseId}/classes/${classId}/edit`}>
                        <RiEdit2Fill className="h-5 w-5" />
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleBookMark}
                      className="hover:bg-secondary/80"
                    >
                      {isBookmarked ? (
                        <FaBookmark className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <FaRegBookmark className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  {liveStarted && (
                    <div className="flex items-center justify-start ">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-1" />
                      <span className="text-sm font-semibold text-muted-foreground">Live</span>
                    </div>
                  )}
                  <p className="text-sm font-medium">{dayjs(createdAt).format("MMM D, YYYY")}</p>
                </div>
              </div>
              <div
                id="StreamPlayer"
                className="flex-1 text-secondary-100 w-full aspect-video bg-gray-500/10 rounded-xl "
              >
                {renderVideo()}
              </div>
            </div>
          </div>
        </div>
        <div className="w-full pb-4 md:m-0 md:w-[350px]">
          <div className="h-full w-full rounded-xl p-2">
            {haveAdminAccess && (
              <div className="flex w-full justify-end mb-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="text-white flex items-center gap-2 -mt-2">
                      Add an assignment
                      <FaPlus />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="min-w-[70vw] max-h-[90vh] overflow-hidden">
                    <DialogHeader>
                      <DialogTitle>Add Assignment</DialogTitle>
                      <DialogDescription>Create a new assignment for this class.</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[70vh] overflow-y-auto">
                      <NewAttachmentPage classes={classes} courseId={courseId} classId={classId} />
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            <table className="w-full border-collapse">
              <thead className="mb-4 border-b-2 border-secondary-400 font-semibold">
                <tr>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Link</th>
                  <th className="px-4 py-2">Due by</th>
                  {haveAdminAccess && <th className="px-4 py-2">Actions</th>}
                </tr>
              </thead>
              <tbody className="text-white">
                {!attachments?.length ? (
                  <tr className="bg-blue-500 text-center">
                    <td className="py-4 text-center text-lg" colSpan={4}>
                      No assignments
                    </td>
                  </tr>
                ) : (
                  attachments.map((attachment, index) => (
                    <tr className="bg-blue-500 text-center" key={index}>
                      <td className="px-4 py-2">
                        <div className="font-semibold">
                          {attachment.title}
                          <div className="text-sm font-medium text-neutral-300">
                            {attachment.attachmentType.toLowerCase()}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2">{renderAttachmentLink(attachment)}</td>
                      <td className="px-4 py-2">
                        {attachment.attachmentType === "ASSIGNMENT" && attachment.dueDate
                          ? dayjs(attachment.dueDate).format("MMM D, YYYY")
                          : "-"}
                      </td>
                      {haveAdminAccess && (
                        <td className="px-4 py-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <BsThreeDotsVertical className="h-5 w-5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedAttachment(attachment);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <FaPencilAlt className="h-4 w-4" />
                                  Edit
                                </div>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setSelectedAttachment(attachment);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <FaTrashAlt className="h-4 w-4" />
                                  Delete
                                </div>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div className="w-full bg-transparent rounded-xl shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <FaStickyNote className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Class Notes</h2>
          </div>
          <div className="flex items-center gap-2 flex-1">
            <FaTags className="h-5 w-5 text-blue-600" />
            <div className="flex flex-wrap gap-2 items-center">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="px-3 py-1 flex items-center gap-2">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="text-xs hover:text-red-500">
                    ×
                  </button>
                </Badge>
              ))}
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Add tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTag()}
                  className="w-32 h-8"
                />
                <Button variant="outline" size="sm" onClick={addTag}>
                  Add
                </Button>
              </div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {notesStatus && <span>{notesStatus}</span>}
            {lastSaved && <span> • Last saved {dayjs(lastSaved).fromNow()}</span>}
          </div>
        </div>

        <RichTextEditor
          initialValue={notes || ""}
          onChange={(value) => setNotes(value || "")}
          allowUpload={true}
          fileUploadOptions={{
            fileType: FileType.NOTES,
            associatingId: classId,
            allowedExtensions: ["jpeg", "jpg", "png", "gif", "svg", "webp"],
          }}
        />
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="min-w-[70vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
            <DialogDescription>Modify the assignment details.</DialogDescription>
          </DialogHeader>
          {selectedAttachment && (
            <NewAttachmentPage
              classes={classes}
              courseId={courseId}
              classId={classId}
              isEditing={true}
              attachment={selectedAttachment}
              onComplete={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the assignment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
