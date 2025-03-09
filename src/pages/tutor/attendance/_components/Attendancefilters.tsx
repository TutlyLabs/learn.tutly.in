import { actions } from "astro:actions";
import { LayoutGrid, List, Search } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

import AttendanceHeader from "./AttendanceHeader";
import OverallAttendanceTable from "./OverallAttendanceTable";

interface Student {
  Name: string;
  username: string;
  JoinTime: string;
  LeaveTime: string;
  Duration: string;
  UserEmail: string;
  RecordingDisclaimerResponse: string;
  InWaitingRoom: string;
}

interface PastPresentStudent {
  username: string;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  data: any[];
  classId: string;
  attendedDuration: number | null;
  attended: boolean;
}

const AttendanceClient = ({ courses, role, attendance }: any) => {
  const [fileData, setFileData] = useState<any>([]);
  const [selectedFile, setSelectedFile] = useState<any>();
  const [currentCourse, setCurrentCourse] = useState<any>(null);
  const [currentClass, setCurrentClass] = useState<any>(null);
  const [users, setUsers] = useState<any>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showOverallAttendance, setShowOverallAttendance] = useState(false);

  useEffect(() => {
    if (!currentCourse) {
      return;
    }
    const fetch = async () => {
      try {
        if (role === "MENTOR") {
          const { data: res } = await actions.courses_getMentorStudents({
            courseId: currentCourse.id,
          });
          const mentorStudents = Array.isArray(res) ? res : [];
          setUsers(
            mentorStudents.map((student) => ({
              ...student,
              username: student.username || "",
              name: student.name || "",
            }))
          );
        }

        if (role === "INSTRUCTOR") {
          const { data: res } = await actions.users_getAllEnrolledUsers({
            courseId: currentCourse.id,
          });
          setUsers(Array.isArray(res) ? res : []);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        setUsers([]);
      }
    };
    fetch();
  }, [currentCourse, role]);

  const handleStudentClick = (student: any) => {
    setSelectedStudent(student);
  };

  const onSelectFile = (file: Blob) => {
    setSelectedFile(file);
    try {
      const reader = new FileReader();

      reader.onload = (e) => {
        const result = e.target!.result;
        const workbook = XLSX.read(result, {
          type: "binary",
          cellDates: true,
        });
        const worksheetName = workbook.SheetNames[0];
        const worksheet = worksheetName ? workbook.Sheets[worksheetName] : undefined;
        if (!worksheet) {
          throw new Error("Worksheet not found");
        }
        const data = XLSX.utils.sheet_to_json(worksheet, {
          defval: "",
          range: { s: { c: 0, r: 3 }, e: { c: 6, r: 10000 } },
        });

        const modifiedData = data.map((row: any) => ({
          Name: row["Name (Original Name)"],
          username: String(row["Name (Original Name)"]).substring(0, 10).toUpperCase(),
          JoinTime: row["Join Time"],
          LeaveTime: row["Leave Time"],
          Duration: row["Duration (Minutes)"],
          UserEmail: row["User Email"],
          RecordingDisclaimerResponse: row["Recording Disclaimer Response"],
          InWaitingRoom: row["In Waiting Room"],
        }));
        setFileData(modifiedData);
      };
      reader.onerror = () => {
        throw new Error("Error in reading file");
      };

      reader.readAsBinaryString(file);
    } catch (e: any) {
      toast.error(e.message);
      setFileData([]);
      setSelectedFile(null);
    }
  };

  const handleBulkUpload = (data: any) => {
    try {
      setSelectedFile("input.file");
      const modifiedData = data.map((row: any) => ({
        Name: row["Name"],
        username: String(row["Name"]).substring(0, 10).toUpperCase(),
        JoinTime: row["JoinTime"],
        LeaveTime: row["LeaveTime"],
        Duration: row["Duration"],
        UserEmail: row["UserEmail"],
        RecordingDisclaimerResponse: row["RecordingDisclaimerResponse"],
        InWaitingRoom: row["InWaitingRoom"],
      }));
      setFileData(modifiedData);
    } catch (error) {
      console.error("Error in bulk upload:", error);
      toast.error("Failed to process bulk upload data");
      setFileData([]);
      setSelectedFile(null);
    }
  };

  const [pastpresentStudents, setPastPresentStudents] = useState<PastPresentStudent[]>([]);
  const [present, setPresent] = useState(0);

  useEffect(() => {
    const viewAttendance = async () => {
      if (currentClass) {
        try {
          const { data: res } = await actions.attendances_viewAttendanceByClassId({
            classId: currentClass.id,
          });

          if (!res?.data?.attendance) {
            setPastPresentStudents([]);
            setPresent(0);
            setFileData([]);
            return;
          }

          const { attendance, present: presentCount = 0 } = res.data;
          setPastPresentStudents(attendance);
          setPresent(presentCount);

          // Transform attendance data safely
          const Totaldata = attendance.reduce((acc: any[], student: any) => {
            if (!student?.data || !Array.isArray(student.data)) return acc;

            const studentData = student.data.map((join: any) => ({
              Name: join?.ActualName || student?.name || "",
              username: student?.username || "",
              JoinTime: join?.JoinTime || "",
              LeaveTime: join?.LeaveTime || "",
              Duration: join?.Duration || 0,
              UserEmail: student?.UserEmail || "",
              RecordingDisclaimerResponse: student?.RecordingDisclaimerResponse || "",
              InWaitingRoom: student?.InWaitingRoom || "",
            }));

            return [...acc, ...studentData];
          }, []);

          setFileData(Totaldata);
        } catch (error) {
          console.error("Error viewing attendance:", error);
          setPastPresentStudents([]);
          setPresent(0);
          setFileData([]);
        }
      } else {
        // Reset states when no class is selected
        setPastPresentStudents([]);
        setPresent(0);
        setFileData([]);
      }
    };
    viewAttendance();
  }, [currentClass]);

  // combine the duplicate users duration
  const aggregatedStudents = (Array.isArray(fileData) ? fileData : []).reduce(
    (acc: any, student: Student) => {
      if (!student?.username) return acc;

      const username = student.username;
      const duration = parseInt(String(student.Duration)) || 0;
      const name = student.Name || "";

      if (!acc[username]) {
        acc[username] = {
          Name: name,
          Joins: [
            {
              JoinTime: student.JoinTime || "",
              LeaveTime: student.LeaveTime || "",
              ActualName: name,
              Duration: duration,
            },
          ],
          Duration: duration,
          username: username,
          attended: true,
        };
      } else {
        acc[username].Joins.push({
          JoinTime: student.JoinTime || "",
          LeaveTime: student.LeaveTime || "",
          ActualName: name,
          Duration: duration,
        });
        acc[username].Duration += duration;
      }
      return acc;
    },
    {}
  );

  const sortedAggregatedStudents = Object.values(aggregatedStudents).sort((a: any, b: any) => {
    const usernameA = String(a.username || "").toUpperCase();
    const usernameB = String(b.username || "").toUpperCase();
    return usernameA.localeCompare(usernameB);
  });

  // only enrolled students are marked present if present
  const modifiedAggregatedStudents = sortedAggregatedStudents.map((student: any) => {
    if (role === "MENTOR") {
      const matchedUser = Array.isArray(users)
        ? users.find((user: any) => user.username === student.username)
        : null;
      return {
        ...student,
        Present: student.attended,
        username: student.username || "",
        ActualName: matchedUser?.name || student.Name || "",
      };
    }

    const matchedUser = Array.isArray(users)
      ? users.find((user: any) => user.username === student.username)
      : null;
    if (matchedUser) {
      return {
        ...student,
        Present: true,
        username: matchedUser.username || student.username,
        ActualName: matchedUser.name || student.Name,
      };
    } else {
      return {
        ...student,
        Present: false,
        username: student.username || "",
        ActualName: student.Name || "",
      };
    }
  });

  // Separate present and absent students
  const combinedStudents = modifiedAggregatedStudents.map((student: any) => ({
    ...student,
    Name: student.ActualName,
    username: student.username,
  }));
  // Enrolled students
  const presentStudents = combinedStudents.filter((student: any) => student.Present === true);
  // Unenrolled students
  const absentStudents = combinedStudents.filter((student: any) => !student.Present);

  // For the attendance table counts
  const allStudents = [...presentStudents];
  if (role === "MENTOR") {
    const absentAssignedStudents = users
      .filter((user: any) => !presentStudents.find((p: any) => p.username === user.username))
      .map((user: any) => ({
        ...user,
        Present: false,
        Duration: 0,
        Joins: [],
      }));
    allStudents.push(...absentAssignedStudents);
  } else {
    allStudents.push(...absentStudents);
  }

  // edit student join name
  const [username, setUsername] = useState<string>("");
  const [openEditName, setOpenEditName] = useState<number>(0);
  const handleEditUsername = (from: any, to: any) => {
    const newFileData = fileData.map((student: any) => ({
      ...student,
      username: student.username.replace(from, to),
    }));
    setFileData(newFileData);
  };

  const [maxInstructionDuration, setMaxInstructionDuration] = useState(0);

  const handleUpload = async () => {
    if (!currentClass?.id) {
      toast.error("Please select a class first");
      return;
    }

    toast.loading("uploading attendance...");

    try {
      await actions.attendances_postAttendance({
        classId: currentClass.id,
        data: presentStudents,
        maxInstructionDuration: Number(maxInstructionDuration),
      });
      toast.dismiss();
      toast.success("Attendance uploaded successfully");
    } catch (e) {
      toast.dismiss();
      toast.error("Failed to upload attendance");
    }
  };

  return (
    <div className="p-4 text-center">
      <div>
        <h1 className="mx-auto mb-2 mt-4 w-60 bg-gradient-to-r text-4xl uppercase font-black text-primary">
          Attendance
        </h1>
      </div>
      <h1 className="text-md text-center tracking-widest font-semibold text-secondary-400">
        {" "}
        ~ Mark and Monitor Students Attendance
      </h1>
      <div className="mb-4 flex items-center justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowOverallAttendance(!showOverallAttendance)}
          className="gap-2"
        >
          {showOverallAttendance ? (
            <>
              <List className="h-4 w-4" />
              Show Class Attendance
            </>
          ) : (
            <>
              <LayoutGrid className="h-4 w-4" />
              Show Overall Attendance
            </>
          )}
        </Button>
      </div>

      {!showOverallAttendance ? (
        <>
          <AttendanceHeader
            role={role}
            pastpresentStudents={pastpresentStudents}
            courses={courses}
            currentCourse={currentCourse}
            setCurrentCourse={setCurrentCourse}
            currentClass={currentClass}
            setCurrentClass={setCurrentClass}
            onSelectFile={onSelectFile}
            fileData={fileData}
            selectedFile={selectedFile}
            handleBulkUpload={handleBulkUpload}
            handleUpload={handleUpload}
            count={[present, users?.length - present, pastpresentStudents?.length - present]}
            maxInstructionDuration={maxInstructionDuration}
            setMaxInstructionDuration={setMaxInstructionDuration}
          />

          {/* Table */}
          {fileData && selectedFile && pastpresentStudents.length == 0 && (
            <AttendanceTable
              presentStudents={presentStudents}
              users={users}
              absentStudents={absentStudents}
              handleStudentClick={handleStudentClick}
              openEditName={openEditName}
              setOpenEditName={setOpenEditName}
              username={username}
              setUsername={setUsername}
              handleEditUsername={handleEditUsername}
              maxInstructionDuration={maxInstructionDuration}
              flag={false}
            />
          )}

          {pastpresentStudents.length > 0 && (
            <AttendanceTable
              presentStudents={pastpresentStudents}
              users={users}
              absentStudents={absentStudents}
              handleStudentClick={handleStudentClick}
              openEditName={openEditName}
              setOpenEditName={setOpenEditName}
              username={username}
              setUsername={setUsername}
              handleEditUsername={handleEditUsername}
              flag={true}
            />
          )}
        </>
      ) : (
        <OverallAttendanceTable studentsAttendance={attendance} />
      )}

      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium">
              Attendance Details for {selectedStudent?.Name||selectedStudent?.user?.name!}
            </DialogTitle>
          </DialogHeader>

          <div className="w-full text-sm">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="border bg-muted/30 px-3 py-1.5">Actual Name</th>
                  <th className="border bg-muted/30 px-3 py-1.5">Join Time</th>
                  <th className="border bg-muted/30 px-3 py-1.5">Leave Time</th>
                  <th className="border bg-muted/30 px-3 py-1.5">Duration</th>
                </tr>
              </thead>
              <tbody>
                {(selectedStudent?.Joins||selectedStudent?.data)?.map((join: any, index: number) => (
                  <tr key={index}>
                    <td className="border px-3 py-1.5">{join.ActualName}</td>
                    <td className="border px-3 py-1.5">{join.JoinTime}</td>
                    <td className="border px-3 py-1.5">{join.LeaveTime}</td>
                    <td className="border px-3 py-1.5">{join.Duration}</td>
                  </tr>
                ))}
                <tr className="bg-muted/30">
                  <td className="border px-3 py-1.5">Total Duration</td>
                  <td className="border px-3 py-1.5"></td>
                  <td className="border px-3 py-1.5"></td>
                  <td className="border px-3 py-1.5">{selectedStudent?.Duration||selectedStudent?.attendedDuration}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttendanceClient;

const AttendanceTable = ({
  presentStudents,
  users,
  absentStudents,
  handleStudentClick,
  openEditName,
  setOpenEditName,
  username,
  setUsername,
  handleEditUsername,
  maxInstructionDuration,
  flag
}: any) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Combine all attended and not attended enrolled students
  const allStudents = [
    ...presentStudents,
    ...users
      .filter((user: any) => !presentStudents.find((p: any) => p.username === user.username))
      .map((user: any) => ({
        ...user,
        ActualName: user.name,
        Duration: 0,
        Joins: [],
        isAbsent: true,
      })),
  ];

  const filteredStudents = allStudents.filter((student: any) => {
    const matchesSearch = Object.values(student).some((value) =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!matchesSearch) return false;

    switch (activeTab) {
      case "present":
        return flag?(student.attended):(!student.isAbsent&&student.Duration>=maxInstructionDuration);
      case "absent":
        return flag?(!student.attended):(student.isAbsent||student.Duration<maxInstructionDuration);
      case "short":
        return (student.Duration||student.attendedDuration) > 0 && (student.Duration||student.attendedDuration) < 60;
      default:
        return true;
    }
  });
  return (
    <div className="mx-auto mt-8 w-[95%] space-y-4">
      <div className="flex items-center justify-between">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              All
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                {allStudents.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="present" className="gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              Present
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                {presentStudents.filter((p: any) => (flag?p.attended:p.Duration>=maxInstructionDuration)).length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="absent" className="gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              Absent
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                {flag?
                users.filter(
                  (u: any) => !presentStudents.find((p: any) => p.username === u.username&&p.attended)
                ).length
                  : users.filter(
                    (u: any) => !presentStudents.find((p: any) => p.username === u.username&&p.Duration>=maxInstructionDuration)
                  ).length
                }
              </span>
            </TabsTrigger>
            <TabsTrigger value="short" className="gap-2">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              {"<"}60min
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                {
                  presentStudents.filter(
                    (s: any) => (s.Duration||s.attendedDuration) > 0 && (s.Duration||s.attendedDuration) < 60
                  ).length
                }
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-16">S.No</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Times Joined</TableHead>
            <TableHead className="w-16">View</TableHead>
            {absentStudents.length > 0 && <TableHead className="w-16">Edit</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredStudents.map((student: any, index: number) => (
            <TableRow
              key={index}
              className={`hover:bg-muted/50 ${student.isAbsent ? "bg-muted/30" : ""}`}
            >
              <TableCell>{index + 1}</TableCell>
              <TableCell className="font-medium">{student.ActualName||student.user?.name}</TableCell>
              <TableCell>
                {openEditName === index + 1 ? (
                  <Input
                    type="text"
                    onChange={(e) => setUsername(e.target.value)}
                    defaultValue={student.username}
                  />
                ) : (
                  student.username
                )}
              </TableCell>
              <TableCell>
                {student.Duration>0||student.attendedDuration>0 ? (
                  <Badge
                    variant="outline"
                    className={`${
                      (flag?!student.attended:student.Duration < Number(maxInstructionDuration))
                        ? ("bg-red-500/10 text-red-400 hover:bg-red-500/10")
                        : ((!flag?student.Duration < 60:student.attendedDuration < 60)
                          ? "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/10"
                          : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10")
                    }`}
                  >
                    {flag?student.attendedDuration:student.Duration}
                  </Badge>
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell>
                {flag?(student.data?.[0]?.JoinTime ? student.data[0].JoinTime.split("T")[0] : "-"):(student.Joins?.[0]?.JoinTime ? student.Joins[0].JoinTime.split(" ")[0] : "-")}
              </TableCell>
              <TableCell>{flag?student.data?.length||"-":student.Joins?.length || "-"}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" onClick={() => handleStudentClick(student)}>
                  View
                </Button>
              </TableCell>
              {absentStudents.length > 0 && (
                <TableCell>
                  {student.isUnknown && (
                    <>
                      {openEditName !== index + 1 ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setOpenEditName(index + 1)}
                        >
                          Edit
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setOpenEditName(0);
                            handleEditUsername(student.username, username);
                          }}
                        >
                          Save
                        </Button>
                      )}
                    </>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
