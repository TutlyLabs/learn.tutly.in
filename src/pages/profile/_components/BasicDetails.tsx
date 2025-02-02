import { zodResolver } from "@hookform/resolvers/zod";
import { File, FileType, type Profile } from "@prisma/client";
import { type ChangeEvent, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import MobileInput from "@/components/MobileInput";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFileUpload } from "@/components/useFileUpload";
import { api } from "@/trpc/react";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  secondaryEmail: z.string().email("Please enter a valid email address").optional(),
  mobile: z
    .string()
    .min(12, "Must include country code")
    .max(14, "Invalid mobile number")
    .refine((value) => value.startsWith("+"), "Must start with +"),
  whatsapp: z
    .string()
    .min(12, "Must include country code")
    .max(14, "Invalid WhatsApp number")
    .refine((value) => value.startsWith("+"), "Must start with +"),
  gender: z.enum(["male", "female", "other"], {
    required_error: "Please select a gender",
  }),
  tshirtSize: z.enum(["XS", "S", "M", "L", "XL", "XXL"], {
    required_error: "Please select a size",
  }),
});

interface BasicDetailsProps {
  avatar: string;
  email: string;
  secondaryEmail: string;
  mobile: string;
  whatsapp: string;
  gender: string;
  tshirtSize: string;
  onUpdate: (profile: Partial<Profile>) => Promise<void>;
}

export default function BasicDetails({
  avatar,
  email,
  secondaryEmail,
  mobile,
  whatsapp,
  gender,
  tshirtSize,
  onUpdate,
}: BasicDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: email || "",
      secondaryEmail: secondaryEmail || "",
      mobile: mobile || "",
      whatsapp: whatsapp || "",
      gender: gender as "male" | "female" | "other",
      tshirtSize: tshirtSize as "XS" | "S" | "M" | "L" | "XL" | "XXL",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await onUpdate({
        mobile: values?.mobile,
        whatsapp: values?.whatsapp,
        gender: values?.gender,
        tshirtSize: values?.tshirtSize,
      });
      setIsEditing(false);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Basic Details</h2>
        <Button
          variant={isEditing ? "outline" : "default"}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? "Cancel" : "Edit"}
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-shrink-0">
          <Avatar avatar={avatar} />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex-grow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="email@example.com" {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="secondaryEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secondary Email</FormLabel>
                    <FormControl>
                      <Input placeholder="email@example.com" {...field} disabled={!isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                      <MobileInput
                        value={field.value}
                        onChange={field.onChange}
                        disabled={!isEditing}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp Number</FormLabel>
                    <FormControl>
                      <MobileInput
                        value={field.value}
                        onChange={field.onChange}
                        disabled={!isEditing}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!isEditing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tshirtSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>T-Shirt Size</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!isEditing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isEditing && (
              <Button type="submit" className="w-full md:w-auto">
                Save Changes
              </Button>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}

const Avatar = ({ avatar }: { avatar: string }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: user } = api.users.getCurrentUser.useQuery();
  const { mutateAsync: updateAvatar } = api.users.updateUserAvatar.useMutation();
  const { uploadFile } = useFileUpload({
    fileType: FileType.AVATAR,
    onUpload: async (file: File) => {
      if (!file || !file.publicUrl) return;
      try {
        await updateAvatar({
          avatar: file.publicUrl,
        });
        toast.success("Profile picture updated successfully");
        window.location.reload();
      } catch (error) {
        toast.error("Failed to update profile picture");
      }
    },
  });

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setIsUploading(true);

    try {
      const file = e.target.files[0];
      if (!file || !user?.id) return;
      await uploadFile(file, user.id);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload profile picture");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative group">
      <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-gray-200">
        <img
          src={avatar || "/placeholder.jpg"}
          alt="Profile Avatar"
          className="w-full h-full object-cover"
        />

        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="loading-spinner text-white" />
          </div>
        )}
      </div>

      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="secondary"
          size="sm"
          className="bg-black/50 text-white hover:bg-black/70"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          Change Photo
        </Button>
      </div>

      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
};
