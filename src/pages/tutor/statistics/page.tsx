import { Barchart } from "@/components/charts/barchart";
import { Linechart } from "@/components/charts/linechart";
import { Piechart } from "@/components/charts/piechart";
import StudentStats from "@/components/studentStats";
import { Card } from "@/components/ui/card";
import Providers from "@/utils/providers";

import Header from "./_components/header";

const TutorStats = ({
  mentors,
  mentees,
  data,
  currentUser,
  courseId,
  studentUsername,
  studentData,
  attendanceData,
  piechart,
  linechart,
  barchart,
  loaderValue,
}: any) => {
  return (
    <Providers>
      <Header
        mentors={mentors.data}
        mentees={mentees.data}
        currentUser={currentUser}
        data={data}
        courseId={courseId}
      />
      {studentUsername ? (
        <StudentStats studentData={studentData} attendanceData={attendanceData} />
      ) : (
        <div className="m-4 flex flex-col gap-4 md:mx-8 md:gap-6 mt-6">
          <div className="flex flex-col gap-4 md:gap-6 lg:flex-row">
            <div className="w-full rounded-xl shadow-xl shadow-blue-500/5 lg:w-1/4">
              <Piechart data={piechart.data} />
            </div>
            <div className="flex w-full flex-col gap-2 rounded-xl shadow-xl shadow-blue-500/5 md:flex-row lg:w-3/4">
              <div className="flex w-full flex-col gap-4 p-4 text-gray-500 md:w-1/3 md:gap-6 md:p-14">
                <div className="relative rounded-xl border-4 p-4">
                  <h1 className="absolute -top-3 bg-background px-1 text-sm md:text-base">
                    Total Students
                  </h1>
                  <h1 className="flex items-baseline justify-between text-2xl font-bold text-primary-500 md:text-4xl">
                    {mentees.data?.length}
                  </h1>
                </div>
                <div className="relative rounded-xl border-4 p-4">
                  <h1 className="absolute -top-3 bg-background px-1 text-sm md:text-base">
                    Total Sessions
                  </h1>
                  <h1 className="text-2xl font-bold text-primary-500 md:text-4xl">
                    {linechart.data?.length}
                  </h1>
                </div>
              </div>
              <div className="w-full md:w-2/3">
                <Linechart data={linechart.data} />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 md:gap-6 lg:flex-row">
            <div className="max-h-[300px] w-full rounded-xl shadow-xl shadow-blue-500/5 lg:w-3/4">
              <Barchart data={barchart.data} />
            </div>
            <Card className="w-full rounded-xl p-4 shadow-xl shadow-blue-500/5 md:p-8 lg:w-1/4">
              <h1 className="pb-4 text-white font-semibold md:py-8 text-center">Evaluation</h1>
              <div className="px-4 text-center font-semibold text-blue-500 md:px-16">
                <span className="text-2xl font-bold md:text-3xl">
                  {piechart.data ? piechart.data[0] : 0}
                </span>
                <span>/{piechart.data ? piechart.data[0] + piechart.data[1] : 0}</span>
              </div>
              <div className="m-auto my-4 w-4/5 rounded-full border border-gray-700">
                <div
                  className={`h-[10px] rounded-full bg-blue-500`}
                  style={{ width: loaderValue }}
                />
              </div>
              <h1 className="p-2 text-center text-sm text-gray-500 md:text-base">
                Assignments evaluated by the mentors
              </h1>
            </Card>
          </div>
        </div>
      )}
    </Providers>
  );
};

export default TutorStats;
