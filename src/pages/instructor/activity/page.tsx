import Providers from "@/utils/providers";

import UserCards from "./_components/UserCards";

function Page({ users, totalCount, activeCount, limit }: any) {
  return (
    <Providers>
      <UserCards
        users={users}
        totalItems={totalCount}
        activeCount={activeCount}
        defaultPageSize={limit}
      />
    </Providers>
  );
}

export default Page;
