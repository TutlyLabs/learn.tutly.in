import { actions } from "astro:actions";
import { useEffect, useState } from "react";
import { Cell, Pie, Tooltip } from "recharts";
import { PieChart as RechartsPieChart, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ProfessionalProfiles from "@/pages/profile/_components/ProfessionalProfiles";

import Component from "./charts";

interface Assignment {
  id: string;
  title: string;
  submissions: {
    id: string;
    points: {
      score: number;
    }[];
  }[];
  points?: number;
}

interface Course {
  courseId: string | undefined;
  totalPoints: number;
  assignmentsSubmitted: number;
  totalAssignments: number;
  assignments: Assignment[];
}

interface StudentDashboardData {
  courses: Course[];
}

interface Props {
  data: StudentDashboardData;
  selectedCourse: string;
}

const StatCard = ({
  imgSrc,
  alt,
  value,
  label,
}: {
  imgSrc: string;
  alt: string;
  value: number | string;
  label: string;
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center w-full sm:w-80 rounded-md bg-white p-4 text-gray-900 shadow-xl">
      <div className="h-20 w-20 flex items-center justify-center">
        <img src={imgSrc} alt={alt} className="w-20 h-20 object-contain" />
      </div>
      <div className="sm:ml-4 text-center">
        <p className="pt-3 text-2xl font-bold text-blue-600">{value}</p>
        <h1 className="p-1 text-sm font-bold text-gray-700">{label}</h1>
      </div>
    </div>
  );
};

const AssignmentTable = ({
  searchFilteredAssignments,
}: {
  searchFilteredAssignments: (Assignment & { status: string })[];
}) => {
  return (
    <ScrollArea className="h-[310px] overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Submissions</TableHead>
            <TableHead>Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {searchFilteredAssignments.map((assignment: any) => (
            <TableRow key={assignment.id} className="cursor-pointer text-left">
              <TableCell>
                <Badge variant={assignment.status === "Submitted" ? "default" : "destructive"}>
                  {assignment.status}
                </Badge>
              </TableCell>
              <TableCell>{assignment.title}</TableCell>
              <TableCell>{assignment.submissions?.length || 0}</TableCell>
              <TableCell>
                {assignment.submissions?.reduce(
                  (total: number, submission: any) => total + (submission.points?.[0]?.score || 0),
                  0
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};

const ProgressBars = ({
  submittedCount,
  notSubmittedCount,
  totalAssignments,
}: {
  submittedCount: number;
  notSubmittedCount: number;
  totalAssignments: number;
}) => {
  return (
    <Card className="flex-1 px-10 py-6">
      <h2 className="text-lg font-semibold text-center dark:text-white">Submission Summary</h2>
      <div className="flex flex-col justify-center h-full space-y-6">
        {[
          {
            label: "Successfully Submitted",
            count: submittedCount,
            color: "bg-green-600",
          },
          {
            label: "Not Submitted",
            count: notSubmittedCount,
            color: "bg-red-600",
          },
        ].map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex justify-between items-center text-base font-medium dark:text-white">
              <span>{item.label}</span>
              <span>
                {item.count}/{totalAssignments} (
                {((item.count / totalAssignments) * 100).toFixed(2)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3.5 dark:bg-gray-700">
              <div
                className={`${item.color} h-3.5 rounded-full`}
                style={{
                  width: `${((item.count / totalAssignments) * 100).toFixed(2)}%`,
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
const PlatformScores = () => {
  interface PlatformScore {
    problemCount: number;
    currentRating?: number;
  }

  interface PlatformScores {
    totalScore: number;
    percentages: Record<string, number>;
    codechef: PlatformScore | null;
    codeforces: PlatformScore | null;
    hackerrank: PlatformScore | null;
    interviewbit: PlatformScore | null;
    leetcode: PlatformScore | null;
  }

  interface ProfessionalProfile {
    professionalProfiles: {
      github: string;
      leetcode: string;
      codechef: string;
      codeforces: string;
      hackerrank: string;
      interviewbit: string;
    };
  }

  const [platformScores, setPlatformScores] = useState<PlatformScores | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const { data } = await actions.codingPlatforms_getPlatformScoresAction();
        if (data) {
          const validatedData: PlatformScores = {
            totalScore: data.totalScore || 0,
            percentages: data.percentages || {},
            codechef: (data.codechef && typeof data.codechef === "object"
              ? data.codechef
              : null) as PlatformScore | null,
            codeforces: (data.codeforces && typeof data.codeforces === "object"
              ? data.codeforces
              : null) as PlatformScore | null,
            hackerrank: (data.hackerrank && typeof data.hackerrank === "object"
              ? data.hackerrank
              : null) as PlatformScore | null,
            interviewbit: (data.interviewbit && typeof data.interviewbit === "object"
              ? data.interviewbit
              : null) as PlatformScore | null,
            leetcode: (data.leetcode && typeof data.leetcode === "object"
              ? data.leetcode
              : null) as PlatformScore | null,
          };
          setPlatformScores(validatedData);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchScores();
  }, []);

  const handleUpdateProfile = async (profile: Partial<ProfessionalProfile>) => {
    try {
      const handles = {
        codechef: profile.professionalProfiles?.codechef || "",
        codeforces: profile.professionalProfiles?.codeforces || "",
        hackerrank: profile.professionalProfiles?.hackerrank || "",
        leetcode: profile.professionalProfiles?.leetcode || "",
        interviewbit: profile.professionalProfiles?.interviewbit || "",
        github: profile.professionalProfiles?.github || "",
      };

      // const res = await actions.codingPlatforms_validatePlatformHandlesAction({
      //   handles
      // });
      // console.log(res);
      // if (!res.data?.valid) {
      //   toast.error(`Invalid handles: ${res.data?.invalidFields.join(", ")}`);
      //   return;
      // }

      const { data, error } = await actions.users_updateUserProfile({
        profile: {
          professionalProfiles: handles,
        },
      });

      if (error) {
        toast.error("Failed to update profile");
        return;
      }

      if (data) {
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    }
  };

  const platforms = ["codechef", "codeforces", "hackerrank", "interviewbit", "leetcode"];
  const colors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  const dummyData = platforms.map((platform) => ({
    name: platform,
    value: 20,
  }));

  const shouldShowUpdateProfile =
    !platformScores ||
    platforms.some((platform) => !platformScores[platform as keyof PlatformScores]);

  const data =
    platformScores && Object.keys(platformScores.percentages).length > 0
      ? platforms.map((platform) => ({
          name: platform,
          value: platformScores.percentages[platform] || 0,
        }))
      : dummyData;

  const renderChart = () => (
    <div
      className={`flex flex-col items-center gap-8 w-full ${shouldShowUpdateProfile ? "opacity-30" : ""}`}
    >
      <div className="w-full h-[180px] relative">
        {shouldShowUpdateProfile && (
          <Dialog>
            <DialogTrigger asChild>
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="bg-gray-800/80 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-700/80 transition-colors">
                  Update Profile
                </div>
              </div>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
              </DialogHeader>
              <ProfessionalProfiles
                professionalProfiles={{
                  github: "",
                  leetcode: "",
                  codechef: "",
                  codeforces: "",
                  hackerrank: "",
                  interviewbit: "",
                }}
                // @ts-ignore
                onUpdate={handleUpdateProfile}
              />
            </DialogContent>
          </Dialog>
        )}
        <ChartContainer
          config={Object.fromEntries(
            platforms.map((platform, index) => [
              platform,
              { label: platform, color: colors[index] || "" },
            ])
          )}
          className="w-full h-[180px] relative"
        >
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltipContent />} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
      <div className="w-full space-y-2">
        {platforms.map((platform, index) => {
          const score = platformScores?.[platform as keyof PlatformScores] as PlatformScore | null;
          const percentage = platformScores?.percentages[platform] || 0;

          return (
            <div key={platform} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[index] }} />
              <div className="flex-1">
                <div className="flex flex-col">
                  <div className="flex justify-between items-center">
                    <span className="capitalize text-xs font-medium text-gray-800 dark:text-gray-200">
                      {platform}
                    </span>
                    <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                      {platformScores && Object.keys(platformScores.percentages).length > 0
                        ? `${percentage.toFixed(1)}%`
                        : "20%"}
                    </span>
                  </div>
                  {score && (
                    <div className="flex justify-between text-[10px] text-gray-600 dark:text-gray-400">
                      <span>Problems: {score.problemCount || 0}</span>
                      {score.currentRating && (
                        <span>Rating: {Math.round(score.currentRating)}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-48 w-48 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-4 flex-1 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return renderChart();
};

export function StudentCards({ data, selectedCourse }: Props, { holidays }: any) {
  const course = data.courses.find((c) => c.courseId === selectedCourse);

  const groupedAssignments = course?.assignments?.reduce(
    (acc, assignment) => {
      const submissionsCount = assignment.submissions?.length || 0;
      let status = "Not Submitted";
      if (submissionsCount > 0) {
        status = "Submitted";
      }

      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status]?.push({ ...assignment, status });
      return acc;
    },
    {} as Record<string, (Assignment & { status: string })[]>
  );

  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredAssignments =
    selectedStatus === "All"
      ? Object.values(groupedAssignments || {}).flat()
      : groupedAssignments?.[selectedStatus] || [];

  const searchFilteredAssignments = filteredAssignments.filter((assignment) =>
    assignment.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalAssignments = course?.assignments.length || 0;
  const submittedCount = groupedAssignments?.["Submitted"]?.length || 0;
  const notSubmittedCount = groupedAssignments?.["Not Submitted"]?.length || 0;

  const completionPercentage = Math.round((submittedCount / totalAssignments) * 100) || 0;

  return (
    <>
      <div className="flex flex-wrap justify-center gap-4 mb-6 md:mb-10 md:gap-10">
        {[
          {
            imgSrc: "/score.png",
            alt: "score",
            value: course?.totalPoints || 0,
            label: "Total Points Earned",
          },
          {
            imgSrc: "/leaderboard.png",
            alt: "completion",
            value: `${completionPercentage}%`,
            label: "Course Completion",
          },
          {
            imgSrc: "/assignment.png",
            alt: "assignment",
            value: course?.assignmentsSubmitted || 0,
            label: "Assignments Submitted",
          },
        ].map((item, index) => (
          <StatCard key={index} {...item} />
        ))}
      </div>
      <div className="flex flex-col lg:flex-row gap-4">
        <Card className="w-full lg:w-2/3 mb-3 ">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Assignments</CardTitle>
            <div className="flex flex-col md:flex-row gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="py-1.5 px-2 w-full text-sm font-medium border text-gray-400 border-gray-300 rounded-md"
                  >
                    {selectedStatus}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSelectedStatus("All")}>All</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedStatus("Submitted")}>
                    Submitted
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedStatus("Not Submitted")}>
                    Not Submitted
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Input
                type="text"
                placeholder="Search by assignment name"
                className="p-2 w-full border border-gray-300 rounded-md"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <AssignmentTable searchFilteredAssignments={searchFilteredAssignments} />
          </CardContent>
        </Card>

        <div className="w-full lg:w-1/3 pb-3">
          <Card>
            <CardHeader className="relative">
              <div className="flex items-center justify-center gap-4">
                <CardTitle>Platform Scores</CardTitle>
                <a
                  href="/coding-platforms/leaderboard"
                  className="absolute right-2 text-xs font-medium text-primary hover:text-primary/80 dark:text-primary dark:hover:text-primary/80 underline-offset-4 hover:underline"
                >
                  Leaderboard
                </a>
              </div>
              <CardDescription>Your scores on various coding platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <PlatformScores />
            </CardContent>
          </Card>
        </div>
      </div>

      {Number(totalAssignments) > 0 && (
        <div className="flex flex-col md:flex-row justify-around mb-3 gap-3">
          <div className="flex-1">
            <Component notSubmitted={notSubmittedCount} submitted={submittedCount} />
          </div>
          <ProgressBars
            submittedCount={submittedCount}
            notSubmittedCount={notSubmittedCount}
            totalAssignments={totalAssignments}
          />
        </div>
      )}
    </>
  );
}
