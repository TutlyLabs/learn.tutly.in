import Providers from "@/utils/providers";

import AttendanceClient from "./_components/Attendancefilters";

function Page({ attendance, courses, currentUser }: any) {
  return (
    <Providers>
      <AttendanceClient attendance={attendance} courses={courses} role={currentUser} />
    </Providers>
  );
}

export default Page;
