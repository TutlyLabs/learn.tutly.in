import { SessionUser } from "@/lib/auth/session";
import { RouterOutputs } from "@/server";
import Providers from "@/utils/providers";

import Community from "./_components/mainpage";

const page = ({
  allDoubts,
  currentUser,
}: {
  allDoubts: RouterOutputs["courses"]["getAllDoubts"];
  currentUser: SessionUser;
}) => {
  return (
    <Providers>
      <main className="m-2 mx-5 flex flex-col items-center justify-center">
        <Community allDoubts={allDoubts} currentUser={currentUser} />
      </main>
    </Providers>
  );
};

export default page;
