import { useState, useEffect } from 'react';
import { Search, Settings, MonitorX, Terminal as TerminalIcon } from 'lucide-react';
import { WelcomeScreen } from './welcome-screen';
import { FileSystemProvider, useFileSystem } from './file-system-context';
import { ActivityBar } from './sidebar/activity-bar';
import type { VSCodeState } from "./state";
import { Editor } from "@monaco-editor/react";
import { CommandPalette } from "./command-palette"
import { Button } from "@/components/ui/button"
import { ResizablePanel, ResizableHandle, ResizablePanelGroup } from "@/components/ui/resizable"
import { Terminal } from "./terminal"
import { Preview } from "./preview"
import { cn } from "@/lib/utils"
import { EditorTabs } from "./editor-tabs"
import { socket } from "@/lib/socket";

interface PlaygroundProps {
  initialState: VSCodeState;
}

function PlaygroundContent({ config }: { config: VSCodeState["config"] }) {
  const { currentFile, updateFileContent } = useFileSystem();
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(config.showPreview);
  const [showTerminal, setShowTerminal] = useState(config.showTerminal);

  const handleEditorChange = (value: string | undefined) => {
    if (currentFile && value) {
      updateFileContent(currentFile.path, value);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="h-full w-full flex flex-col bg-[#1e1e1e] text-white">
      <header className="h-[30px] border-b border-[#333333] flex items-center justify-between px-2 bg-[#3c3c3c] text-[#cccccc]">
        <span className="text-[10px] uppercase tracking-wider">Playground</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            className="h-6 px-3 hover:bg-[#4c4c4c] flex items-center gap-2 rounded-sm"
            onClick={() => setIsCommandOpen(true)}
            title="Search (⌘K)"
          >
            <Search className="h-4 w-4" />
            <span className="text-xs text-[#8c8c8c]">⌘K</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-[#4c4c4c]"
            onClick={() => setShowPreview(!showPreview)}
            disabled={!showPreview}
            title={showPreview ? "Hide Preview" : "Show Preview"}
          >
            <MonitorX className={cn("h-4 w-4", !showPreview && "text-[#4c4c4c]")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-[#4c4c4c]"
            onClick={() => setShowTerminal(!showTerminal)}
            title={showTerminal ? "Hide Terminal" : "Show Terminal"}
            disabled={!showPreview}
          >
            <TerminalIcon className={cn("h-4 w-4", !showTerminal && "text-[#4c4c4c]")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-[#4c4c4c]"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={21} minSize={15} maxSize={50}>
            <ActivityBar config={config} />
          </ResizablePanel>

          <ResizableHandle
            className="hover:bg-blue-500"
            style={{ cursor: 'ew-resize' }}
          />

          <ResizablePanel defaultSize={showPreview ? 50 : 85}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={showTerminal ? 70 : 100}>
                <div className="flex-1 overflow-hidden flex flex-col h-full">
                  <EditorTabs />
                  {currentFile && (
                    <div
                      className="flex-1 overflow-hidden relative"
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      <Editor
                        key={currentFile.path}
                        defaultPath={currentFile.path}
                        defaultLanguage={currentFile.path.split('.').pop() || 'plaintext'}
                        value={currentFile.content || ''}
                        onChange={handleEditorChange}
                        onMount={(editor, monaco) => {
                          editor.addAction({
                            id: "quick-command",
                            label: "Quick Command",
                            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK],
                            run: () => setIsCommandOpen(true)
                          });
                          
                          socket.on("file-content", (data: { content: string; language: string }) => {
                            editor.setValue(data.content);
                            monaco.editor.setModelLanguage(editor.getModel()!, data.language);
                          });

                          return () => {
                            socket.off("file-content");
                          };
                        }}
                        theme="vs-dark"
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          lineNumbers: "on",
                          scrollBeyondLastLine: false,
                          wordWrap: "on",
                          automaticLayout: true,
                          padding: { top: 10 },
                          fixedOverflowWidgets: true,
                          contextmenu: false
                        }}
                        beforeMount={(monaco) => {
                          monaco.editor.addKeybindingRule({
                            keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,
                            command: null
                          });
                        }}
                        className="h-full w-full absolute inset-0"
                        loading={<div className="text-white">Loading...</div>}
                      />
                    </div>
                  )}
                  {!currentFile && (
                    <main className="flex-1 overflow-auto p-4">
                      <WelcomeScreen />
                    </main>
                  )}
                </div>
              </ResizablePanel>

              {showTerminal && (
                <>
                  <ResizableHandle
                    className="hover:bg-blue-500"
                    style={{ cursor: 'ew-resize' }}
                  />
                  <ResizablePanel defaultSize={30}>
                    <Terminal isVisible={showTerminal} />
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </ResizablePanel>

          {showPreview && (
            <>
              <ResizableHandle
                className="hover:bg-blue-500"
                style={{ cursor: 'ew-resize' }}
              />
              <ResizablePanel defaultSize={35}>
                <Preview isVisible={showPreview} />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      <CommandPalette isOpen={isCommandOpen} setIsOpen={setIsCommandOpen} />
    </div>
  );
}

const Playground = ({ initialState }: PlaygroundProps) => {
  return (
    <div className="h-full w-full">
      <FileSystemProvider initialState={initialState}>
        <PlaygroundContent config={initialState.config} />
      </FileSystemProvider>
    </div>
  );
};

export default Playground;