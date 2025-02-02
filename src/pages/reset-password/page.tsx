"use client";

import ManagePassword from "@/pages/profile/_components/ManagePassword";
import Providers from "@/utils/providers";

const page = ({ email }: { email: string }) => {
  return (
    <Providers>
      <ManagePassword initialEmail={email} />
    </Providers>
  );
};

export default page;
