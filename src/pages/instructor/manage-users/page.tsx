import Providers from "@/utils/providers";

import UserPage from "./_components/UserPage";

function Page({ allUsers, totalItems }: any) {
  return (
    <Providers>
      <UserPage data={allUsers} totalItems={totalItems} />
    </Providers>
  );
}

export default Page;
