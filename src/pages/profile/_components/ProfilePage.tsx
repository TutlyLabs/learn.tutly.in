import type { Profile, User } from "@prisma/client";
import { actions } from "astro:actions";
import { useState } from "react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import AcademicDetails from "./AcademicDetails";
import Address from "./Address";
import BasicDetails from "./BasicDetails";
import Documents from "./Documents";
import Experience from "./Experience";
import PersonalDetails from "./PersonalDetails";
import ProfessionalProfiles from "./ProfessionalProfiles";
import SocialLinks from "./SocialLinks";

export default function ProfilePage({ userProfile }: { userProfile: User & { profile: Profile } }) {
  const [profile, setProfile] = useState(userProfile.profile);

  const handleUpdateProfile = async (updatedFields: any) => {
    try {
      const { data, error } = await actions.users_updateUserProfile({
        profile: updatedFields,
      });

      if (error) {
        toast.error("Failed to update profile");
        return;
      }

      if (data) {
        setProfile(data as Profile);
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="basic">Basic Details</TabsTrigger>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="professional">Professional</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="address">Address</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card className="p-6">
            <BasicDetails
              avatar={userProfile?.image || ""}
              email={userProfile?.email || ""}
              secondaryEmail={profile?.secondaryEmail || ""}
              mobile={profile?.mobile || ""}
              whatsapp={profile?.whatsapp || ""}
              gender={profile?.gender || ""}
              tshirtSize={profile?.tshirtSize || ""}
              onUpdate={handleUpdateProfile}
            />
          </Card>
        </TabsContent>

        <TabsContent value="personal">
          <Card className="p-6">
            <PersonalDetails
              dateOfBirth={profile?.dateOfBirth as Date}
              hobbies={profile?.hobbies || []}
              aboutMe={profile?.aboutMe || ""}
              onUpdate={handleUpdateProfile}
            />
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card className="p-6">
            <SocialLinks
              socialLinks={profile?.socialLinks as Record<string, string>}
              onUpdate={handleUpdateProfile}
            />
          </Card>
        </TabsContent>

        <TabsContent value="professional">
          <Card className="p-6">
            <ProfessionalProfiles
              professionalProfiles={profile?.professionalProfiles as Record<string, string>}
              onUpdate={handleUpdateProfile}
            />
          </Card>
        </TabsContent>

        <TabsContent value="academic">
          <Card className="p-6">
            <AcademicDetails
              academicDetails={profile?.academicDetails as Record<string, string>}
              onUpdate={handleUpdateProfile}
            />
          </Card>
        </TabsContent>

        <TabsContent value="experience">
          <Card className="p-6">
            <Experience
              experiences={profile?.experiences as Array<Record<string, any>>}
              onUpdate={handleUpdateProfile}
            />
          </Card>
        </TabsContent>

        <TabsContent value="address">
          <Card className="p-6">
            <Address
              address={profile?.address as Record<string, string>}
              onUpdate={handleUpdateProfile}
            />
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card className="p-6">
            <Documents
              documents={profile?.documents as Record<string, string>}
              onUpdate={handleUpdateProfile}
            />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
