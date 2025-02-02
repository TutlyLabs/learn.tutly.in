import NoDataFound from "@/components/NoDataFound"

function Page({firstCourseId}:any) {
  return (
    <div>{!firstCourseId && <NoDataFound message="Oops! No enrolled courses found" />}</div>
  )
}

export default Page