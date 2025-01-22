import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { MdDelete } from "react-icons/md";

import { useRouter } from "next/navigation";

const DeleteClass = ({ classId, courseId }: { classId: string; courseId: string }) => {
  const router = useRouter();
  const [clicked, setClicked] = useState(false);

  const handleDeleteClass = async () => {
    setClicked(true);
    try {
      await axios.delete(`/api/classes/deleteClass/${classId}`, {
        params: {
          courseId: courseId,
        },
      });
      toast({
        title: "Success",
        description: "Class deleted successfully"
      });
      router.push(`/courses/${courseId}`);
      window.location.reload();
    } catch (error) {
      // console.error('Error deleting class:', error);
      setClicked(false);
      toast({
        title: "Error",
        description: "Failed to delete class",
        variant: "destructive"
      });
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
