'use client'
import type { User, Profile } from "@prisma/client";
import ProfilePage from "./_components/ProfilePage";

const page = ({
    userProfile
    }: {
    userProfile: User & { profile: Profile }
}) => {
  return (
    <div>
        <ProfilePage userProfile={userProfile as User & { profile: Profile }} />
    </div>
  )
}

export default page