import Providers from "@/utils/providers";

import UserTable from "./_components/UsersTable";

function Page({ allUsers, params, currentUser }: any) {
  return (
    <Providers>
      {!currentUser || currentUser.role !== "INSTRUCTOR" ? (
        <div className="mt-8 text-center text-3xl font-semibold">Unauthorized</div>
      ) : (
        <div className="flex items-center justify-center">
          <UserTable users={allUsers || []} params={params} />
        </div>
      )}
    </Providers>
  );
}

export default Page;
