import UserTable from "./_components/UsersTable";

function Page({ allUsers, params, currentUser }: any) {
  return (
    <div>
      {!currentUser || currentUser.role !== "INSTRUCTOR" ? (
        <div className="mt-8 text-center text-3xl font-semibold">Unauthorized</div>
      ) : (
        <div className="flex items-center justify-center">
          <UserTable users={allUsers || []} params={params} />
        </div>
      )}
    </div>
  );
}

export default Page;
