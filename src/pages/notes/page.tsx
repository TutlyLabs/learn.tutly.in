"use client";

import type { Notes } from "@prisma/client";

import Providers from "@/utils/providers";

import NotesComponent from "./_components/Notes";

const page = ({ notes }: { notes: Notes[] }) => {
  return (
    <Providers>
      <NotesComponent notes={notes} />
    </Providers>
  );
};

export default page;
