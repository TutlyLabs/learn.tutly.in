"use client";

import type { Profile, User } from "@prisma/client";

import Providers from "@/utils/providers";

import ProfilePage from "./_components/ProfilePage";

const page = ({ userProfile }: { userProfile: User & { profile: Profile } }) => {
  return (
    <Providers>
      <ProfilePage userProfile={userProfile as User & { profile: Profile }} />
    </Providers>
  );
};

export default page;
