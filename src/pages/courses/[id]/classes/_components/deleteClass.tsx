import { useState } from "react";
import toast from "react-hot-toast";
import { MdDelete } from "react-icons/md";

import { useRouter } from "@/hooks/use-router";
import { api } from "@/trpc/react";

const DeleteClass = ({ classId, courseId }: { classId: string; courseId: string }) => {
  const router = useRouter();
  const [clicked, setClicked] = useState(false);

  const { mutateAsync: deleteClass } = api.classes.deleteClass.useMutation();

  const handleDeleteClass = async () => {
    setClicked(true);
    try {
      await deleteClass({ classId });
      toast.success("Class deleted successfully");
      router.push(`/courses/${courseId}`);
      window.location.reload();
    } catch (error) {
      // console.error('Error deleting class:', error);
      setClicked(false);
      toast.error("Failed to delete class");
    } finally {
      setClicked(false);
      window.location.reload();
    }
  };

  return (
    <button disabled={clicked} title="Delete" onClick={handleDeleteClass}>
      <MdDelete
        className={`h-5 w-5 ${clicked ? "cursor-not-allowed text-gray-600" : "cursor-pointer text-red-500"} `}
      />
    </button>
  );
};

export default DeleteClass;
