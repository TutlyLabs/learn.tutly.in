import { redirect } from "next/navigation"
import { auth } from "~/server/auth"
import { api } from "~/trpc/server"
import ClassSidebar from "../_components/classSidebar"
import Class from "../_components/Class"

export default async function ClassPage({
  params
}: {
  params: { id: string; classId: string }
}) {
  const session = await auth()
  if (!session) {
    redirect("/login")
  }

  const [classesWithFolders, classDetails, initialNote, bookmark] = await Promise.all([
    api.classes.getWithFolders({ courseId: params.id }),
    api.classes.getById({ id: params.classId }),
    api.notes.getByObjectId({ objectId: params.classId }),
    api.bookmarks.getByObjectId({ objectId: params.classId })
  ])

  const isBookmarked = !!bookmark

  return (
    <div className="flex w-full items-start">
      <ClassSidebar
        courseId={params.id}
        classes={classesWithFolders || []}
        title="Assignments"
        currentUser={session.user}
        isCourseAdmin={session.user.role === "INSTRUCTOR"}
      />
      <div className="m-3 w-full">
        <Class
          classes={classesWithFolders || []}
          classId={params.classId}
          courseId={params.id}
          currentUser={session.user}
          details={classDetails}
          isBookmarked={isBookmarked}
          initialNote={initialNote}
        />
      </div>
    </div>
  )
} 