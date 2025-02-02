'use  client';
import Playground from "../_components/Playground";
import type {SandpackFiles} from "@codesandbox/sandpack-react";


const page = ({
  currentUser,
  assignmentId,
  initialFiles
}:{
  currentUser: any,
  assignmentId: string,
  initialFiles: SandpackFiles
}) => {
  return (
    <div>
      <Playground
        currentUser={currentUser}
        assignmentId={assignmentId || ""}
        initialFiles={initialFiles}
        template="static"
      />
    </div>
  )
}

export default page