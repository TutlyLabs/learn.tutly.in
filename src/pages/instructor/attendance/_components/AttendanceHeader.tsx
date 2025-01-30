import { actions } from "astro:actions";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { BiSolidCloudUpload } from "react-icons/bi";
import { MdDeleteOutline } from "react-icons/md";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// import { useRouter } from "@/hooks/use-router";
import BulkImport from "../../../../components/table/BulkImport";
import { Column } from "../../../../components/table/DisplayTable";

const columns: Column[] = [
  {
    key: "Name",
    name: "Name",
    label: "Name",
    type: "text",
    sortable: true,
    filterable: true,
    validation: {
      required: true,
      message: "Name must be a string",
    },
  },
  {
    key: "UserEmail",
    name: "Email",
    label: "Email",
    type: "email",
    sortable: true,
    filterable: true,
    validation: {
      required: false,
      regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Must be a valid email address",
    },
  },
  {
    key: "JoinTime",
    name: "Join Time",
    label: "Join Time",
    type: "datetime-local",
    sortable: true,
    filterable: true,
    validation: {
      required: true,
      message: "Join time is required",
    },
  },
  {
    key: "LeaveTime",
    name: "Leave Time",
    label: "Leave Time",
    type: "datetime-local",
    sortable: true,
    filterable: true,
    validation: {
      required: true,
      message: "Leave time is required",
    },
  },
  {
    key: "Duration",
    name: "Duration",
    label: "Duration (Minutes)",
    type: "number",
    sortable: true,
    filterable: true,
    validation: {
      required: true,
      regex: /^\d+$/,
      message: "Duration must be a positive number",
    },
  },
  {
    key: "Guest",
    name: "Guest",
    label: "Guest",
    type: "text",
    sortable: true,
    filterable: true,
    validation: {
      required: false,
    },
  },
  {
    key: "RecordingDisclaimerResponse",
    name: "Recording Consent",
    label: "Recording Consent",
    type: "text",
    sortable: true,
    filterable: true,
    validation: {
      required: false,
    },
  },
  {
    key: "InWaitingRoom",
    name: "Waiting Room",
    label: "In Waiting Room",
    type: "text",
    sortable: true,
    filterable: true,
    validation: {
      required: false,
    },
  },
  {
    key: "username",
    name: "Username",
    label: "Username",
    type: "text",
    sortable: true,
    filterable: true,
    validation: {
      required: false,
    },
    render(_, row) {
      return String(row.Name).substring(0, 10).toUpperCase();
    },
  },
];

export default function AttendanceHeader({
  role,
  pastpresentStudents,
  courses,
  currentCourse,
  setCurrentCourse,
  currentClass,
  setCurrentClass,
  onSelectFile,
  fileData,
  selectedFile,
  handleUpload,
  maxInstructionDuration,
  setMaxInstructionDuration,
  handleBulkUpload,
}: any) {
  //   const router = useRouter();

  const handleDelete = async (x: any) => {
    try {
      await actions.attendances_deleteClassAttendance({
        classId: x,
      });
      toast.success("Attendance deleted successfully");
    } catch (e: any) {
      toast.error("Failed to delete attendance");
    }
  };

  const [clientMaxDuration, setClientMaxDuration] = useState<number>(maxInstructionDuration);

  useEffect(() => {
    let maxDuration = 0;
    const calculateMaxDuration = () => {
      fileData?.forEach((student: any) => {
        if (student.Duration > maxDuration) {
          maxDuration = student.Duration;
        }
      });
      setClientMaxDuration(maxDuration);
      setMaxInstructionDuration(maxDuration);
    };

    if (fileData) {
      calculateMaxDuration();
    }
  }, [fileData, setMaxInstructionDuration]);

  const handleClientUpload = async () => {
    setMaxInstructionDuration(clientMaxDuration);

    await new Promise((resolve) => setTimeout(resolve, 100));

    handleUpload();
  };

  const handleClientMaxDuration = (e: any) => {
    const newDuration = parseInt(e.target.value);
    setClientMaxDuration(newDuration);
    setMaxInstructionDuration(newDuration);
  };

  return (
    <>
      <div className="mx-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select
            value={currentCourse?.id || ""}
            onValueChange={(value) => {
              const selected = courses?.find((course: any) => course.id === value);
              setCurrentCourse(selected);
            }}
          >
            <SelectTrigger className="w-[245px] bg-background">
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              {courses?.length === 0 ? (
                <SelectItem value="empty" disabled>
                  No courses exist
                </SelectItem>
              ) : (
                courses?.map((course: any) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <Select
            value={currentClass?.id || ""}
            onValueChange={(value) => {
              const selected = currentCourse?.classes.find((x: any) => x.id === value);
              setCurrentClass(selected);
            }}
            disabled={!currentCourse}
          >
            <SelectTrigger className="w-[245px] bg-background">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {!currentCourse ? (
                <SelectItem value="empty" disabled>
                  Select a course first
                </SelectItem>
              ) : (
                currentCourse.classes.map((x: any) => (
                  <SelectItem key={x.id} value={x.id}>
                    {x.title} ({dayjs(x.createdAt).format("DD-MM-YYYY")})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {role === "INSTRUCTOR" && (
          <>
            {pastpresentStudents.length === 0 ? (
              <div className="flex items-center gap-2">
                <input
                  title="file"
                  type="file"
                  className="w-60 cursor-pointer rounded border-none bg-primary-600 font-semibold text-white shadow-md outline-none transition duration-300 ease-in-out hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-700"
                  accept=".csv, .xlsx"
                  disabled={!currentClass}
                  onChange={(e) => {
                    const files = e.target.files;
                    if (!currentClass) {
                      toast.error("select class");
                    } else if (files && files.length > 0) {
                      onSelectFile(files[0]);
                    }
                  }}
                />
                {currentClass ? (
                  <BulkImport data={[]} columns={columns} onImport={handleBulkUpload} />
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button className="w-[100px] cursor-not-allowed bg-sky-600/50 hover:bg-sky-600/50">
                          Bulk Import
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-gray-700">
                        <p className="text-xs font-semibold text-red-400">
                          *Select class to upload attendance
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {fileData && selectedFile && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={clientMaxDuration}
                      onChange={handleClientMaxDuration}
                      placeholder="Max duration"
                      className="w-32 cursor-pointer rounded border-none bg-primary-600 px-2 py-1 font-semibold text-gray-900 shadow-md outline-none transition duration-300 ease-in-out placeholder:text-sm placeholder:text-gray-300 hover:bg-primary-700"
                    />
                    <div
                      onClick={handleClientUpload}
                      className="flex cursor-pointer items-center gap-2 rounded bg-primary-600 px-2 py-1 hover:scale-x-105 hover:duration-500"
                    >
                      upload <BiSolidCloudUpload className="text-xl duration-1000" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="flex h-10 items-center justify-center gap-1 rounded-lg border-2 border-red-500 px-3 font-bold text-red-500 duration-500 hover:scale-105">
                    <h1>Delete</h1>
                    <MdDeleteOutline className="text-lg" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl border-none">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear Attendance</AlertDialogTitle>
                    <div className="flex gap-2">
                      <h1 className="rounded-full border border-primary-700 p-0.5 px-2 text-xs text-primary-700">
                        {currentCourse?.title}
                      </h1>
                      <h1 className="rounded-full border border-primary-700 p-0.5 px-2 text-xs text-primary-700">
                        {currentClass?.title}
                      </h1>
                    </div>
                    <p className="flex items-center gap-1 pb-10 text-sm text-gray-500">
                      Are you sure?
                      <br />
                      Continuing will clear the attendance of all students for this class.
                    </p>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="mr-2 bg-gray-200 text-black hover:bg-gray-300">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(currentClass?.id)}
                      className="bg-red-500 text-white hover:bg-red-600"
                    >
                      Confirm
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </>
        )}
      </div>
    </>
  );
}
