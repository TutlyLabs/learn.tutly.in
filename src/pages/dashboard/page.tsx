import Providers from "@/utils/providers";

import Dashboard from "./_components/dashboard";

function Page({ dashboardData, name, currentUser }: any) {
  return (
    <Providers>
      <Dashboard data={dashboardData} name={name} currentUser={currentUser} />
    </Providers>
  );
}

export default Page;
