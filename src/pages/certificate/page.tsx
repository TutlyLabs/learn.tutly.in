import { SessionUser } from "@/lib/auth/session";
import { DashboardData } from "@/types/dashboard";
import Providers from "@/utils/providers";

import StudentCertificate from "./_components/StudentCertificate";

export default function Certificate({
  currentUser,
  dashboardData,
}: {
  currentUser: SessionUser;
  dashboardData: DashboardData;
}) {
  return (
    <Providers>
      <StudentCertificate user={currentUser} data={dashboardData} />
    </Providers>
  );
}
