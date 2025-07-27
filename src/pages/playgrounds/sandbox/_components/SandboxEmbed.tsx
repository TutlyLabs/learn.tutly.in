"use client";

import { SandpackCodeEditor, SandpackPreview } from "@codesandbox/sandpack-react";
import { Attachment } from "@prisma/client";
// @ts-ignore
import { SandpackFileExplorer } from "sandpack-file-explorer";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

import { AssignmentPreview } from "./AssignmentPreview";
import { BottomTabs } from "./BottomTabs";
import "./styles.css";

interface SandboxEmbedProps {
  assignment?: Attachment | null;
  isEditTemplate: boolean;
  config: {
    fileExplorer: boolean;
    showInitialFiles: boolean;
  };
}
export function SandboxEmbed({ assignment, isEditTemplate, config }: SandboxEmbedProps) {
  return (
    <div className="h-full w-full relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-black"></div>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(30, 30, 30, 0.3) 0%, transparent 70%)",
        }}
      ></div>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at bottom right, rgba(37, 208, 171, 0.02) 0%, transparent 60%)",
        }}
      ></div>

      <ResizablePanelGroup
        direction="horizontal"
        className="h-full w-full min-h-[calc(100vh-3rem)] relative z-10"
      >
        {/* Assignment Panel - Only show if assignment exists */}
        {assignment && (
          <>
            <ResizablePanel defaultSize={isEditTemplate ? 20 : 35} minSize={0} maxSize={40}>
              <AssignmentPreview assignment={assignment} />
            </ResizablePanel>

            <ResizableHandle
              style={{ backgroundColor: "rgba(100, 100, 100, 0.2)" }}
              className="hover:opacity-80 transition-opacity"
            />
          </>
        )}

        {/* Sandbox Panel */}
        <ResizablePanel defaultSize={assignment ? 65 : 100}>
          <ResizablePanelGroup direction="horizontal" className="h-full w-full">
            {/* File Explorer  */}
            {config.fileExplorer && (
              <>
                <ResizablePanel defaultSize={18} minSize={15} maxSize={25}>
                  <div
                    className="w-full backdrop-blur-xl border-r flex flex-col h-full shadow-2xl"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(35, 35, 35, 1) 0%, rgba(25, 25, 25, 1) 50%, rgba(20, 20, 20, 1) 100%)",
                      borderColor: "rgba(100, 100, 100, 0.2)",
                    }}
                  >
                    <div
                      className="flex-1 overflow-y-auto file-explorer"
                      style={
                        {
                          "--sp-layout-height": "95vh",
                          maxHeight: "100vh",
                        } as React.CSSProperties
                      }
                    >
                      <SandpackFileExplorer />
                    </div>
                  </div>
                </ResizablePanel>

                <ResizableHandle
                  style={{ backgroundColor: "rgba(100, 100, 100, 0.2)" }}
                  className="hover:opacity-80 transition-opacity"
                />
              </>
            )}

            {/* Editor and Preview */}
            <ResizablePanel defaultSize={config.fileExplorer ? 82 : 100}>
              <ResizablePanelGroup direction="horizontal" className="h-full">
                {/* Editor */}
                <ResizablePanel defaultSize={50} minSize={30}>
                  <div
                    className="flex flex-col h-full backdrop-blur-xl shadow-2xl"
                    style={{
                      backgroundColor: "rgba(0, 0, 0, 1)",
                    }}
                  >
                    <SandpackCodeEditor
                      showTabs
                      showLineNumbers
                      showInlineErrors
                      wrapContent
                      style={{
                        height: "100%",
                        maxHeight: "calc(100vh - 2rem)",
                        flex: 1,
                      }}
                    />
                  </div>
                </ResizablePanel>

                <ResizableHandle
                  style={{ backgroundColor: "rgba(100, 100, 100, 0.2)" }}
                  className="hover:opacity-80 transition-opacity"
                />

                {/* Preview and Bottom Tabs */}
                <ResizablePanel defaultSize={50} minSize={30}>
                  <ResizablePanelGroup direction="vertical" className="h-full">
                    {/* Preview */}
                    <ResizablePanel defaultSize={70} minSize={40}>
                      <div
                        className="border-l flex flex-col h-full backdrop-blur-xl shadow-2xl"
                        style={{
                          borderColor: "rgba(100, 100, 100, 0.2)",
                          backgroundColor: "rgba(0, 0, 0, 0.95)",
                        }}
                      >
                        <div
                          className="h-[42px] backdrop-blur-xl border-b flex items-center px-4 flex-shrink-0"
                          style={{
                            borderColor: "rgba(100, 100, 100, 0.2)",
                            background:
                              "linear-gradient(90deg, rgba(20, 20, 20, 0.9) 0%, rgba(40, 40, 40, 0.8) 100%)",
                          }}
                        >
                          <div
                            className="text-sm font-semibold flex items-center"
                            style={{ color: "#ffffff" }}
                          >
                            <span
                              className="w-2 h-2 rounded-full mr-2 animate-pulse shadow-sm"
                              style={{
                                backgroundColor: "#f59e0b",
                                boxShadow: "0 0 4px rgba(245, 158, 11, 0.5)",
                              }}
                            ></span>
                            Preview
                          </div>
                        </div>
                        <div className="flex-1">
                          <SandpackPreview
                            showOpenInCodeSandbox={false}
                            showRefreshButton
                            showSandpackErrorOverlay={false}
                            showOpenNewtab
                            style={{
                              height: "100%",
                              width: "100%",
                            }}
                          />
                        </div>
                      </div>
                    </ResizablePanel>

                    <ResizableHandle
                      style={{ backgroundColor: "rgba(100, 100, 100, 0.2)" }}
                      className="hover:opacity-80 transition-opacity"
                    />

                    {/* Bottom Tabs (Console and Tests) */}
                    <ResizablePanel defaultSize={30} minSize={20}>
                      <div
                        className="border-l flex flex-col h-full backdrop-blur-xl shadow-2xl rounded-br-xl"
                        style={{
                          borderColor: "rgba(100, 100, 100, 0.2)",
                          background:
                            "linear-gradient(180deg, rgba(35, 35, 35, 1) 0%, rgba(25, 25, 25, 1) 50%, rgba(20, 20, 20, 1) 100%)",
                        }}
                      >
                        <BottomTabs />
                      </div>
                    </ResizablePanel>
                  </ResizablePanelGroup>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
