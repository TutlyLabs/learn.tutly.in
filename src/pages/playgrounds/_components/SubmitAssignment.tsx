import { useState } from "react";
import toast from "react-hot-toast";

import { api } from "@/trpc/react";

import Submit from "./Submit";

type AssignmentResponse = {
  assignment: any;
  mentorDetails: any;
};

const SubmitAssignment = ({
  currentUser,
  assignmentId,
}: {
  currentUser: any;
  assignmentId: string;
}) => {
  const [assignmentDetails, setAssignmentDetails] = useState<any>(null);
  const [mentorDetails, setMentorDetails] = useState<any>(null);

  const { isLoading } = api.assignments.submitAssignment.useMutation({
    onSuccess: (data: AssignmentResponse) => {
      setAssignmentDetails(data.assignment);
      setMentorDetails(data.mentorDetails);
    },
    onError: () => {
      toast.error("Error fetching assignment details");
    },
  });

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
