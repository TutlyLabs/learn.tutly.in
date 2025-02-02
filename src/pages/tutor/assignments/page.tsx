import Providers from '@/utils/providers'
import AssignmentDashboard from "./_components/AssignmentDashboard";

const Assignment = ({students,courses,currentUser}:any) => {
  return (
    <Providers>
        <AssignmentDashboard
        students={students}
        courses={courses}
        currentUser={currentUser}
    />
    </Providers>
  )
}

export default Assignment