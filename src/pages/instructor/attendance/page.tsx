import AttendanceClient from "./_components/Attendancefilters";

function Page({ attendance, courses, currentUser }: any) {
  return (
    <div>
      <AttendanceClient
        attendance={attendance}
        courses={courses}
        role={currentUser}
      />
    </div>
  );
}

export default Page;
