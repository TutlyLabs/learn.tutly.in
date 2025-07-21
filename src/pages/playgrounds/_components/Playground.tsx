import {
  type SandpackFiles,
  type SandpackPredefinedTemplate,
  SandpackPreview,
  SandpackProvider,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { useEffect, useState, useCallback } from "react";
import { TfiFullscreen } from "react-icons/tfi";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

import FileExplorer from "./FileExplorer";
import MonacoEditor from "./MonacoEditor";
import SandboxConsole from "./SandboxConsole";
import StaticPreview from "./StaticPreview";
import SubmitAssignment from "./SubmitAssignment";
import StaticConsole from "./StaticConsole";

const defaultFiles: SandpackFiles = {
  "/index.html": `<!DOCTYPE html>
<html>

<head>
  <title>Document</title>
  <link rel="stylesheet" href="/styles.css">
</head>

<body>
  <h1>Hello world!</h1>
  <script src="/index.js"></script>
</body>

</html>
`,
  "/styles.css": "",
  "/index.js": "",
};

const AutoSave = ({ assignmentId }: { assignmentId: string }) => {
  const { sandpack } = useSandpack();

  useEffect(() => {
    if (!assignmentId) return;

    localStorage.setItem(`playground-${assignmentId}`, JSON.stringify(sandpack.files));
  }, [assignmentId, sandpack.files]);

  return null;
};

const Playground = ({
  currentUser,
  assignmentId,
  initialFiles,
  template = "static",
}: {
  currentUser?: any;
  assignmentId?: string;
  initialFiles?: SandpackFiles;
  template?: SandpackPredefinedTemplate;
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [staticLogs, setStaticLogs] = useState<string[]>([]);

  const handleStaticLog = useCallback((log: string) => {
    setStaticLogs((prev) => [...prev, log]);
  }, []);

  const handleClearStaticLogs = useCallback(() => {
    setStaticLogs([]);
  }, []);

  const startingFiles = (() => {
    if (!assignmentId) return initialFiles || defaultFiles;

    const savedFiles = localStorage.getItem(`playground-${assignmentId}`);
    if (savedFiles) {
      try {
        return JSON.parse(savedFiles) as SandpackFiles;
      } catch (e) {
        console.error("Failed to parse saved files:", e);
      }
    }
    return initialFiles || defaultFiles;
  })();

  return (
    <div className="relative h-[95vh]">
      <SandpackProvider files={startingFiles} template={template} theme="light">
        {assignmentId && <AutoSave assignmentId={assignmentId} />}
        {isFullScreen && (
          <div className="fixed inset-0 z-50 bg-white">
            <button
              className="absolute right-1 top-1 z-50 rounded bg-gray-800 p-2 text-white"
              onClick={() => setIsFullScreen(false)}
            >
              Exit Fullscreen
            </button>
            {template === "static" ? (
              <StaticPreview onConsoleLog={handleStaticLog} />
            ) : (
              <SandpackPreview
                showNavigator
                showOpenInCodeSandbox={false}
                className="h-[95vh] overflow-y-scroll"
              />
            )}
          </div>
        )}

        <ResizablePanelGroup
          direction="horizontal"
          className="h-[95vh] overflow-y-scroll rounded-lg border"
        >
          <ResizablePanel defaultSize={14}>
            <FileExplorer />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={43}>
            <MonacoEditor />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={43}>
            <ResizablePanelGroup direction="vertical" className="h-[95vh] overflow-y-scroll">
              <ResizablePanel defaultSize={70}>
                <div className="relative h-[95vh] overflow-y-scroll">
                  <div className="border-b bg-white text-black">
                    <h1 className="text-center text-xl font-bold">Preview</h1>
                    <TfiFullscreen
                      className="absolute right-2 top-2 cursor-pointer"
                      onClick={() => setIsFullScreen(true)}
                    />
                  </div>
                  {template === "static" ? (
                    <StaticPreview onConsoleLog={handleStaticLog} />
                  ) : (
                    <SandpackPreview
                      showOpenNewtab
                      showOpenInCodeSandbox={false}
                      className="h-[95vh] overflow-y-scroll"
                    />
                  )}
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={30}>
                {template === "static" ? <StaticConsole logs={staticLogs} onClear={handleClearStaticLogs} /> : <SandboxConsole />}
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
        {assignmentId && (
          <div className="absolute -top-6 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
            <SubmitAssignment currentUser={currentUser} assignmentId={assignmentId} />
          </div>
        )}
      </SandpackProvider>
    </div>
  );
};

export default Playground;
