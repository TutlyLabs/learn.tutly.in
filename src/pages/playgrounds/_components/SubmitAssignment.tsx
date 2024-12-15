import { actions } from "astro:actions";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import Submit from "./Submit";

const SubmitAssignment = ({
  currentUser,
  assignmentId,
}: {
  currentUser: any;
  assignmentId: string;
}) => {
  const [assignmentDetails, setAssignmentDetails] = useState<any>(null);
  const [mentorDetails, setMentorDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!assignmentId) return;
    async function fetch() {
      setIsLoading(true);
      async function fetchData() {
        const { data: res, error } = await actions.assignments_submitAssignment({
          id: assignmentId,
        });

        setAssignmentDetails(res?.assignment);
        setMentorDetails(res?.mentorDetails);

        return res;
      }
      const data: any = await fetchData();
      if (!data.assignment || !currentUser) {
        toast.error("Error fetching assignment details");
      }
      setIsLoading(false);
    }
    fetch();
  }, [assignmentId]);

  return (
    assignmentId &&
    (assignmentDetails ? (
      <Submit
        user={currentUser}
        mentorDetails={mentorDetails}
        assignmentDetails={assignmentDetails}
        isLoading={isLoading}
      />
    ) : (
      <h1 className="text-2xl font-bold">Loading...</h1>
    ))
  );
};

export default SubmitAssignment;
