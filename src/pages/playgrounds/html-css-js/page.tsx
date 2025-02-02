"use  client";

import type { SandpackFiles } from "@codesandbox/sandpack-react";

import Providers from "@/utils/providers";

import Playground from "../_components/Playground";

const page = ({
  currentUser,
  assignmentId,
  initialFiles,
}: {
  currentUser: any;
  assignmentId: string;
  initialFiles: SandpackFiles;
}) => {
  return (
    <Providers>
      <Playground
        currentUser={currentUser}
        assignmentId={assignmentId || ""}
        initialFiles={initialFiles}
        template="static"
      />
    </Providers>
  );
};

export default page;
