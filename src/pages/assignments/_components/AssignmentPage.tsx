import day from "dayjs";
import { useState } from "react";
import toast from "react-hot-toast";
import { FaSearch } from "react-icons/fa";
import { FaEye } from "react-icons/fa";
import { FiEdit } from "react-icons/fi";
import { MdOutlineDelete } from "react-icons/md";
import { RiWhatsappLine } from "react-icons/ri";

import MarkdownPreview from "@/components/MarkdownPreview";
import { Pagination } from "@/components/table/Pagination";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
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
import { useRouter } from "@/hooks/use-router";
import { useSearchParams } from "@/hooks/use-search-params";
import NewAttachmentPage from "@/pages/courses/[id]/classes/_components/NewAssignments";
import { api } from "@/trpc/react";

interface Props {
  currentUser: any;
  assignment: any;
  assignments: any;
  notSubmittedMentees: any;
  isCourseAdmin: boolean;
  username: string;
  mentors: string[];
  pagination: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
  };
}

export default function AssignmentPage({
  currentUser,
  assignment,
  assignments,
  notSubmittedMentees,
  isCourseAdmin = false,
  username,
  mentors,
  pagination,
}: Props) {
  const haveAdminAccess = currentUser && (currentUser.role === "INSTRUCTOR" || isCourseAdmin);

  const [_, setSearchParams] = useSearchParams();

  const handlePageChange = (page: number) => {
    setSearchParams((prev) => {
      prev.set("page", page.toString());
      return prev;
    });
  };

  const handlePageSizeChange = (size: number) => {
    setSearchParams((prev) => {
      prev.set("limit", size.toString());
      prev.set("page", "1");
      return prev;
    });
  };

  return (
    <div className="relative mx-2 my-2 md:mx-10">
      <h1 className="rounded bg-gradient-to-l from-blue-500 to-blue-600 p-2 text-center text-sm font-medium text-white md:text-lg">
        Assignment Submission : {assignment?.title}
      </h1>

      <div className="my-4 flex items-center justify-between text-xs font-medium md:text-sm">
        <p className="rounded bg-secondary-500 p-1 px-2 text-white">
          # {assignment?.class?.course?.title}
        </p>
        <div className="flex items-center justify-center gap-4">
          {assignment?.dueDate != null && (
            <div
              className={`rounded p-1 px-2 text-white ${
                new Date(assignment?.dueDate) > new Date() ? "bg-primary-600" : "bg-secondary-500"
              }`}
            >
              Last Date : {assignment?.dueDate.toISOString().split("T")[0]}
            </div>
          )}
        </div>
      </div>
      <div className="flex w-full items-center justify-between">
        <span className="mt-5 block">Details : 👇</span>
        <div className="flex items-center justify-center gap-4">
          <h1 className="rounded-md border p-1 text-sm">
            Max responses : {assignment?.maxSubmissions}
          </h1>
          {haveAdminAccess && (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="rounded-md bg-emerald-700 p-1 px-3 hover:bg-emerald-800">
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="min-w-[70vw] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit</DialogTitle>
                  <DialogDescription>Modify the assignment details.</DialogDescription>
                </DialogHeader>
                {assignment && (
                  <NewAttachmentPage
                    classes={assignment.class.course.classes}
                    courseId={assignment.courseId}
                    classId={assignment.classId}
                    isEditing={true}
                    attachment={assignment}
                  />
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      <div className="my-5">
        <MarkdownPreview
          className="text-xs"
          content={assignment?.details || "No details given to show"}
        />
      </div>

      <div className="my-4 flex flex-col gap-4 text-black">
        <div>
          <a
            target="_blank"
            href={`${assignment?.link}`}
            className="break-words text-sm font-semibold text-blue-400"
          >
            {assignment?.link}
          </a>
        </div>

        {currentUser?.role === "STUDENT" ? (
          <StudentAssignmentSubmission courseId={assignment.courseId} assignment={assignment} />
        ) : (
          <AdminAssignmentTable
            assignmentId={assignment.id}
            assignments={assignments}
            notSubmittedMentees={notSubmittedMentees}
            currentUser={currentUser}
            username={username}
            assignment={assignment}
            mentors={mentors}
          />
        )}
      </div>

      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        pageSize={pagination.pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
}
const StudentAssignmentSubmission = ({
  assignment,
  courseId,
}: {
  assignment: any;
  courseId: string;
}) => {
  const [externalLink, setExternalLink] = useState("");

  const { mutate: submitExternalLink } = api.submission.submitExternalLink.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (assignment.maxSubmissions <= assignment.submissions.length) {
      toast.error("Maximum submissions reached");
      return;
    }

    try {
      toast.loading("Submitting assignment...");

      const res = await submitExternalLink({
        assignmentId: assignment.id,
        externalLink,
        maxSubmissions: assignment.maxSubmissions,
        courseId,
      });

      console.log(res);
      toast.dismiss();
      toast.success("Assignment submitted successfully");
      setExternalLink("");
      window.location.reload();
    } catch (error) {
      toast.dismiss();
      toast.error("Error submitting assignment");
    }
  };

  const isMaxSubmissionsReached = assignment?.maxSubmissions <= assignment.submissions.length;
  const isPlaygroundSubmission = assignment.submissionMode === "HTML_CSS_JS";

  return (
    <div className="space-y-6">
      <div>
        {isMaxSubmissionsReached ? (
          <div className="my-5 text-center text-lg font-semibold text-white">
            No more responses are accepted!
          </div>
        ) : isPlaygroundSubmission ? (
          <Button asChild>
            <a href={`/playgrounds/html-css-js?assignmentId=${assignment.id}`} target="_blank">
              {assignment?.submissions.length === 0
                ? "Submit through Playground"
                : "Submit another response"}
            </a>
          </Button>
        ) : (
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                {assignment?.submissions.length === 0
                  ? "Submit External Link"
                  : "Submit another response"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add External Link</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="externalLink" className="text-right">
                    Link
                  </Label>
                  <Input
                    id="externalLink"
                    value={externalLink}
                    onChange={(e) => setExternalLink(e.target.value)}
                    placeholder="https://codesandbox.io/p/sandbox/..."
                    className="col-span-3"
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">Submit</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Submissions</h2>

        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="text-foreground">No.</TableHead>
              <TableHead className="text-foreground">View Submission</TableHead>
              <TableHead className="text-foreground">Submission Date</TableHead>
              <TableHead className="text-foreground">Feedback</TableHead>
              <TableHead className="text-foreground">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignment?.submissions.map((submission: any, index: number) => {
              const points = {
                responsiveness:
                  submission.points.find((p: any) => p.category === "RESPOSIVENESS")?.score || 0,
                styling: submission.points.find((p: any) => p.category === "STYLING")?.score || 0,
                other: submission.points.find((p: any) => p.category === "OTHER")?.score || 0,
              };

              const totalScore = Object.values(points).reduce((sum, score) => sum + score, 0);
              const submissionUrl = isPlaygroundSubmission
                ? `/playgrounds/html-css-js?submissionId=${submission.id}`
                : submission.submissionLink;

              return (
                <TableRow key={index}>
                  <TableCell className="text-foreground">{index + 1}</TableCell>
                  <TableCell>
                    <Button variant="link" asChild>
                      <a href={submissionUrl} target="_blank">
                        View
                      </a>
                    </Button>
                  </TableCell>
                  <TableCell className="text-foreground">
                    {submission.submissionDate.toISOString().split("T")[0] || "NA"}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {submission.overallFeedback || "NA"}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {totalScore ? "Submitted" : "NA"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

type AdminTableProps = {
  assignmentId: string;
  assignments: any[];
  notSubmittedMentees: any[];
  currentUser: any;
  username: string;
  assignment: any;
  mentors: string[];
};

const AdminAssignmentTable = ({
  assignmentId,
  assignments,
  notSubmittedMentees,
  currentUser,
  username,
  assignment,
  mentors,
}: AdminTableProps) => {
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editedScores, setEditedScores] = useState({
    responsiveness: 0,
    styling: 0,
    other: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [feedback, setFeedback] = useState("");
  const [modal, setModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedMentor = searchParams.get("mentor") || "all";

  const messages = [
    "Hi, how are you?",
    "Complete your assignments on time !!",
    "Make sure to review the recorded lectures for better understanding",
    "Good Work in web development,Keep Going",
    "Don't forget to participate actively in class discussions!",
    "Ask questions if you need clarification; we're here to help!",
    "Maintain proper attendance,your attendance was poor",
  ];

  const router = useRouter();

  const { mutate: addOverallFeedback } = api.submission.addOverallFeedback.useMutation();
  const { mutate: deleteSubmission } = api.submission.deleteSubmission.useMutation();
  const { mutate: addPoints } = api.points.addPoints.useMutation();

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setSearchParams((prev) => {
      if (value) {
        prev.set("search", value);
      } else {
        prev.delete("search");
      }
      prev.set("page", "1");
      return prev;
    });
  };

  const handleWhatsAppClick = (phone: string) => {
    setPhoneNumber(phone);
    setModal(true);
  };

  const handleSend = (message: string) => {
    window.location.href = `https://web.whatsapp.com/send?phone=${phoneNumber}&text=${message}&app_absent=0`;
    setModal(false);
  };

  const handleFeedback = async (submissionId: string) => {
    try {
      await addOverallFeedback({
        submissionId,
        feedback,
      });
      toast.success("Feedback saved successfully");
    } catch {
      toast.error("Failed to save feedback");
    }
  };

  const handleEdit = (index: number, submissionId: string) => {
    setEditingIndex(index);
    const submission = assignments.find((x: any) => x.id === submissionId);

    const getScore = (category: string) => {
      return submission?.points.find((point: any) => point.category === category)?.score || 0;
    };

    setEditedScores({
      responsiveness: getScore("RESPOSIVENESS"),
      styling: getScore("STYLING"),
      other: getScore("OTHER"),
    });
  };

  const handleSave = async (index: number) => {
    try {
      toast.loading("Updating Scores...");

      const marks = Object.entries(editedScores)
        .filter(([_, score]) => score > 0)
        .map(([category, score]) => ({
          category: category.toUpperCase(),
          score,
        }));

      await addPoints({
        submissionId: assignments[index].id,
        marks,
      });

      toast.success("Scores saved successfully");
    } catch {
      toast.error("Failed to save scores");
    } finally {
      toast.dismiss();
      setEditingIndex(-1);
      setFeedback("");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this submission?")) return;

    try {
      toast.loading("Deleting Submission...");
      await deleteSubmission({ submissionId: id });
      toast.success("Submission deleted successfully");
    } catch {
      toast.error("Failed to delete submission");
    } finally {
      setFeedback("");
      toast.dismiss();
    }
  };

  const [nonSubmissions, setNonSubmissions] = useState<boolean>(false);

  const handleMentorChange = (value: string) => {
    setSearchParams((prev) => {
      if (value === "all") {
        prev.delete("mentor");
      } else {
        prev.set("mentor", value);
      }
      return prev;
    });
  };

  return (
    <div>
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between  mb-2">
        <div className="flex items-center gap-6">
          <div className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white">
            Submissions : 👇
          </div>
          <Select value={selectedMentor} onValueChange={handleMentorChange}>
            <SelectTrigger className="w-[180px] text-white">
              <SelectValue placeholder="Filter by mentor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Mentors</SelectItem>
              {mentors.map((mentor) => (
                <SelectItem key={mentor} value={mentor}>
                  {mentor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => setNonSubmissions(!nonSubmissions)}
            variant="link"
            className="italic text-muted-foreground hover:text-foreground"
          >
            {!nonSubmissions ? "Not received from?" : "Received from?"}
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Input
              className="pl-8"
              placeholder="Search username"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <FaSearch className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          <Button
            onClick={() => {
              if (username) {
                router.push(`/assignments/${assignmentId}/evaluate?username=${username}`);
              } else {
                router.push(`/assignments/${assignmentId}/evaluate`);
              }
            }}
            className="bg-primary-600 text-white hover:bg-primary-700"
          >
            Evaluate
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        {nonSubmissions ? (
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead className="text-foreground">Sl.no</TableHead>
                <TableHead className="text-foreground">Username</TableHead>
                <TableHead className="text-foreground">Mentor</TableHead>
                <TableHead className="text-foreground">Notify</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notSubmittedMentees?.map((user: any, index: any) => (
                <TableRow key={index}>
                  <TableCell className="text-foreground">{index + 1}</TableCell>
                  <TableCell className="text-foreground">{user.username}</TableCell>
                  <TableCell className="text-foreground">{user.mentorUsername}</TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleWhatsAppClick("9160804126")}
                    >
                      <RiWhatsappLine className="h-5 w-5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead className="text-foreground">Sl.no</TableHead>
                <TableHead className="text-foreground">Username</TableHead>
                <TableHead className="text-foreground">Date</TableHead>
                <TableHead className="text-foreground">Responsive(10)</TableHead>
                <TableHead className="text-foreground">Styling(10)</TableHead>
                <TableHead className="text-foreground">Others(10)</TableHead>
                <TableHead className="text-foreground">Total</TableHead>
                <TableHead className="text-foreground">Feedback</TableHead>
                {currentUser.role !== "STUDENT" && (
                  <>
                    <TableHead className="text-foreground">Actions</TableHead>
                    <TableHead className="text-foreground">Evaluate</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments?.map((submission: any, index: any) => {
                const rValue = submission.points.find(
                  (point: any) => point.category === "RESPOSIVENESS"
                );
                const sValue = submission.points.find((point: any) => point.category === "STYLING");
                const oValue = submission.points.find((point: any) => point.category === "OTHER");

                const totalScore = [rValue, sValue, oValue].reduce((acc, currentValue) => {
                  return acc + (currentValue ? currentValue.score : 0);
                }, 0);

                return (
                  <TableRow key={index}>
                    <TableCell className="text-foreground">{index + 1}</TableCell>
                    <TableCell className="text-foreground">
                      <div>{submission.enrolledUser.username}</div>
                      <div className="text-xs text-muted-foreground">
                        {submission.enrolledUser.mentorUsername}
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">
                      {day(submission.submissionDate).format("DD MMM YYYY, hh:mm:ss A")}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {editingIndex === index ? (
                        <Input
                          type="number"
                          value={editedScores.responsiveness}
                          onChange={(e) => {
                            const newScore = parseInt(e.target.value);
                            if (!isNaN(newScore) && newScore >= 0 && newScore <= 10) {
                              setEditedScores((prevScores) => ({
                                ...prevScores,
                                responsiveness: newScore,
                              }));
                            }
                          }}
                          min={0}
                          max={10}
                          className="w-20"
                        />
                      ) : (
                        rValue?.score || "NA"
                      )}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {editingIndex === index ? (
                        <Input
                          type="number"
                          value={editedScores.styling}
                          onChange={(e) => {
                            const newScore = parseInt(e.target.value);
                            if (!isNaN(newScore) && newScore >= 0 && newScore <= 10) {
                              setEditedScores((prevScores) => ({
                                ...prevScores,
                                styling: newScore,
                              }));
                            }
                          }}
                          min={0}
                          max={10}
                          className="w-20"
                        />
                      ) : (
                        sValue?.score || "NA"
                      )}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {editingIndex === index ? (
                        <Input
                          type="number"
                          value={editedScores.other}
                          onChange={(e) => {
                            const newScore = parseInt(e.target.value);
                            if (!isNaN(newScore) && newScore >= 0 && newScore <= 10) {
                              setEditedScores((prevScores) => ({
                                ...prevScores,
                                other: newScore,
                              }));
                            }
                          }}
                          min={0}
                          max={10}
                          className="w-20"
                        />
                      ) : (
                        oValue?.score || "NA"
                      )}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {rValue?.score || sValue?.score || oValue?.score ? totalScore : "NA"}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {editingIndex === index ? (
                        <textarea
                          value={feedback}
                          defaultValue={submission.overallFeedback}
                          onChange={(e) => {
                            setFeedback(e.target.value);
                          }}
                          className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                      ) : (
                        submission.overallFeedback || "NA"
                      )}
                    </TableCell>
                    {currentUser.role !== "STUDENT" && (
                      <>
                        <TableCell>
                          {editingIndex === index ? (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  handleSave(index);
                                  handleFeedback(submission.id);
                                }}
                              >
                                Save
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setEditingIndex(-1)}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" asChild>
                                <a
                                  href={
                                    assignment.submissionMode === "HTML_CSS_JS"
                                      ? `/playgrounds/html-css-js?submissionId=${submission.id}`
                                      : submission.submissionLink
                                  }
                                  target="_blank"
                                >
                                  <FaEye className="h-4 w-4 text-white" />
                                </a>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  handleEdit(index, submission.id);
                                }}
                              >
                                <FiEdit className="h-4 w-4 text-white" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(submission.id)}
                              >
                                <MdOutlineDelete className="h-4 w-4 text-white" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="link" asChild>
                            <a
                              href={`/assignments/${assignmentId}/evaluate?submissionId=${submission.id}`}
                            >
                              Evaluate
                            </a>
                          </Button>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {modal && (
          <Dialog open={modal} onOpenChange={setModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Select a message to send</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-2">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-4 border-b border-border py-2"
                  >
                    <p className="text-sm text-foreground">{msg}</p>
                    <Button variant="link" onClick={() => handleSend(msg)}>
                      Send
                    </Button>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};
