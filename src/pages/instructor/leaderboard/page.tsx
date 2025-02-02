import LeaderBoard from '@/components/leaderBoard'

function Page({sortedSubmissions,enrolledCourses,currentUser,mentors,selectedCourse,selectedMentor}:any) {
  return (
    <div>
        <LeaderBoard
            submissions={sortedSubmissions}
            courses={enrolledCourses}
            currentUser={currentUser}
            mentors={mentors}
            selectedCourse={selectedCourse}
            selectedMentor={selectedMentor}
        />
    </div>
  )
}

export default Page