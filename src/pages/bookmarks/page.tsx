import { BookMarks } from "@prisma/client";

import Providers from "@/utils/providers";

import Bookmarks from "./_components/Bookmarks";

const page = ({ bookmarks }: { bookmarks: BookMarks[] }) => {
  return (
    <Providers>
      <Bookmarks bookmarks={bookmarks} />
    </Providers>
  );
};

export default page;
