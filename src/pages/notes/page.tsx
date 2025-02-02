'use client'
import NotesComponent from "./_components/Notes";
import type { Notes } from "@prisma/client";

const page = ({
    notes
    }: {
    notes: Notes[]
}) => {
  return (
    <div>
        <NotesComponent notes={notes}/>
    </div>
  )
}

export default page