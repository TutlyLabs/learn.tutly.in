"use client";

import { useState } from "react";
import { FaPlus } from "react-icons/fa";

import { Card } from "~/components/ui/card";

import CourseFormModal from "./CourseFormModal";

function AddCourse() {
  const [openModal, setOpenModal] = useState(false);

  return (
    <>
      <Card
        className="m-auto my-3 flex h-[200px] w-[280px] cursor-pointer flex-col items-center justify-center bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 text-white md:mx-2"
        onClick={() => setOpenModal(true)}
      >
        <div className="cursor-pointer text-center">
          <FaPlus className="text-5xl" />
          <h1 className="mt-3 text-xl">Add</h1>
        </div>
      </Card>

      <CourseFormModal open={openModal} onOpenChange={setOpenModal} mode="add" />
    </>
  );
}

export default AddCourse;
