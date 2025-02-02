import Providers from "@/utils/providers";

import ResizablePanelLayout from "../../_components/ResizablePanelLayout";

const page = ({
  assignmentId,
  assignment,
  filteredSubmissions,
  submissionId,
  username,
  submission,
}: {
  assignmentId: string;
  assignment: any;
  filteredSubmissions: any[];
  submissionId: string;
  username: string;
  submission: any;
}) => {
  return (
    <Providers>
      <ResizablePanelLayout
        assignmentId={assignmentId}
        assignment={assignment}
        submissions={filteredSubmissions}
        submissionId={submissionId}
        username={username}
        submission={submission}
      />
    </Providers>
  );
};

export default page;
