import { SandpackFiles, SandpackProps, SandpackProvider } from "@codesandbox/sandpack-react";
import { submissionMode } from "@prisma/client";
import { useMemo } from "react";

import NoDataFound from "@/components/NoDataFound";
import { SandboxEmbed } from "@/pages/playgrounds/sandbox/_components/SandboxEmbed";
// Import required styles for the sandbox
import "@/pages/playgrounds/sandbox/_components/styles.css";
import { glassyTheme } from "@/pages/playgrounds/sandbox/_components/theme";

import EvaluateSubmission from "./evaluateSubmission";

// Simple sandbox component for viewing submissions
function SubmissionSandbox({
  files,
  template,
  readOnly = true,
  assignment,
}: {
  files: SandpackFiles;
  template?: string;
  readOnly?: boolean;
  assignment?: any;
}) {
  const config = {
    fileExplorer: true,
    closableTabs: true,
  };

  const sandpackProps: SandpackProps = useMemo(
    () => ({
      files,
      template: template as any,
      options: {
        closableTabs: false,
        readOnly,
        showTabs: true,
        showLineNumbers: true,
        showInlineErrors: true,
        wrapContent: true,
        showRefreshButton: true,
        showConsoleButton: true,
        showConsole: false,
      },
      theme: glassyTheme,
    }),
    [files, template, readOnly]
  );

  if (!files || Object.keys(files).length === 0) {
    return <NoDataFound message="No files found in submission" />;
  }

  return (
    <SandpackProvider {...sandpackProps}>
      <div className="h-full w-full">
        <SandboxEmbed assignment={assignment} isEditTemplate={false} config={config} />
      </div>
    </SandpackProvider>
  );
}

const PlaygroundPage = ({
  submission,
  submissionMode,
  showActions = false,
  showAssignment = false,
}: {
  submission: any;
  submissionMode: submissionMode;
  showActions?: boolean;
  showAssignment?: boolean;
}) => {
  let template = null;
  // todo : add more templates
  if (submissionMode === "HTML_CSS_JS") {
    template = "static";
  } else if (submissionMode === "REACT") {
    template = "react";
  } else {
    template = submissionMode;
  }

  if (!submission) return <NoDataFound message="No submission found" />;

  return (
    <div className="h-screen flex flex-col">
      <EvaluateSubmission submission={submission} showActions={showActions} />
      <div className="flex-1 overflow-hidden">
        {submission.assignment.submissionMode === "EXTERNAL_LINK" ? (
          <iframe
            src={submission.submissionLink ?? ""}
            allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
            sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
            className="h-full w-full"
          />
        ) : (
          <SubmissionSandbox
            assignment={showAssignment ? submission.assignment : null}
            files={submission.data as SandpackFiles}
            template={template ?? "static"}
          />
        )}
      </div>
    </div>
  );
};

export default PlaygroundPage;
