"use client";
import { useState } from "react";
import { FaUsersGear } from "react-icons/fa6";
import { IoMdBookmarks } from "react-icons/io";
import { MdOutlineEdit } from "react-icons/md";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { useRouter } from "next/navigation";
import CourseFormModal from "./CourseFormModal";
import type { User } from "next-auth";
import type { RouterOutputs } from "~/trpc/react";
import Image from "next/image";

type Course = RouterOutputs["courses"]["getAll"][number];

interface CourseCardProps {
  course: Course;
  currentUser: User;
}

export default function CourseCard({ course, currentUser }: CourseCardProps) {
  const router = useRouter();
  const [openModal, setOpenModal] = useState(false);

  if (!course) return null;

  const expired = () => {
    if (!course.endDate) return false;
    const endDate = new Date(course.endDate);
    const currentDate = new Date();
    return currentDate > endDate;
  };


  return (
    <Card className="m-auto mt-3 w-[280px] overflow-hidden md:mx-2">
      <div
        className="relative h-[150px] cursor-pointer bg-white text-secondary-700"
        onClick={
          expired() ? () => router.push("/courses") : () => router.push(`/courses/${course.id}`)
        }
      >
        <div className="relative h-full w-full">
          <Image
            src={course?.image || "/new-course-placeholder.jpg"}
            alt={course.title}
            className="h-full w-full object-cover"
            width={280}
            height={150}
          />
          {!course.isPublished && currentUser?.role === "INSTRUCTOR" && (
            <div className="absolute right-0 top-0 m-3 rounded-md border bg-red-500 px-2 py-1 text-xs text-white">
              Draft
            </div>
          )}
          <div className="absolute bottom-0 right-0 m-3 flex items-center rounded-md border bg-blue-500 px-2 py-1 text-xs text-white">
            <IoMdBookmarks className="mr-1" />
            <span>{course.classes.length} Classes</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t p-3">
        <div className="cursor-pointer">
          <h2 className="font-medium">{expired() ? `${course.title} [Expired]` : course.title}</h2>
        </div>

        {currentUser.role === "INSTRUCTOR" && (
          <div className="flex gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/instructor/course/${course.id}/manage`)}
            >
              <FaUsersGear className="h-5 w-5" />
            </Button>

            <Button variant="ghost" size="icon" onClick={() => setOpenModal(true)}>
              <MdOutlineEdit className="h-5 w-5" />
            </Button>

            <CourseFormModal
              open={openModal}
              onOpenChange={setOpenModal}
              mode="edit"
              defaultValues={{
                id: course.id,
                title: course.title,
                isPublished: course.isPublished,
                image: course.image ?? undefined,
              }}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
