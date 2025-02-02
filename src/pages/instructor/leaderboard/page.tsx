import LeaderBoard from "@/components/leaderBoard";
import Providers from "@/utils/providers";

function Page({
  sortedSubmissions,
  enrolledCourses,
  currentUser,
  mentors,
  selectedCourse,
  selectedMentor,
}: any) {
  return (
    <Providers>
      <LeaderBoard
        submissions={sortedSubmissions}
        courses={enrolledCourses}
        currentUser={currentUser}
        mentors={mentors}
        selectedCourse={selectedCourse}
        selectedMentor={selectedMentor}
      />
    </Providers>
  );
}

export default Page;
