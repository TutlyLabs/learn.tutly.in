import { redirect } from "next/navigation"

export default async function ClassesPage({
  params
}: {
  params: { id: string }
}) {
  redirect(`/courses/${params.id}/`)
} 