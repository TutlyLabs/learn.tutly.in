import { useState, useCallback, useEffect } from 'react';
import { Copy, Trash, Search, Settings, Maximize2, Minimize2, MonitorX, Terminal as TerminalIcon } from 'lucide-react';
import { WelcomeScreen } from './welcome-screen';
import { FileSystemProvider, useFileSystem } from './file-system-context';
import { ActivityBar } from './activity-bar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment } from 'react';
import type { VSCodeState } from "./state";
import { Editor } from "@monaco-editor/react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { CommandPalette } from "./command-palette"
import { Button } from "@/components/ui/button"
import { ResizablePrimitive, ResizablePanel, ResizableHandle } from "./resizable"
import { Terminal } from "./terminal"
import { Preview } from "./preview"
import { cn } from "@/lib/utils"

interface PlaygroundProps {
  initialState: VSCodeState;
}

function PlaygroundContent({ config }: { config: VSCodeState["config"] }) {
  const { currentFile, updateFileContent } = useFileSystem();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(true)
  const [showTerminal, setShowTerminal] = useState(true)

  const handleContextMenu = useCallback((event: MouseEvent) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY });
  }, []);

  const handleClick = useCallback(() => setContextMenu(null), []);

  useEffect(() => {
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('click', handleClick);
    };
  }, [handleContextMenu, handleClick]);

  const handleEditorChange = (value: string | undefined) => {
    if (currentFile && value) {
      updateFileContent(currentFile.path, value);
    }
  };

  const breadcrumbs = currentFile ? currentFile.path.split('/') : [];

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
            title={showPreview ? "Hide Preview" : "Show Preview"}
          >
            <MonitorX className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-[#4c4c4c]"
            onClick={() => setShowTerminal(!showTerminal)}
            title={showTerminal ? "Hide Terminal" : "Show Terminal"}
          >
            <TerminalIcon className={cn("h-4 w-4", showTerminal && "text-blue-500")} />
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
        <ResizablePrimitive.PanelGroup direction="horizontal">
          <ResizablePanel defaultSize={21} minSize={15} maxSize={21}>
            <ActivityBar config={config} />
          </ResizablePanel>

          <ResizableHandle
            className="hover:bg-blue-500"
            style={{ cursor: 'ew-resize' }}
          />

          <ResizablePanel defaultSize={showPreview ? 50 : 85}>
            <ResizablePrimitive.PanelGroup direction="vertical">
              <ResizablePanel defaultSize={showTerminal ? 70 : 100}>
                <div className="flex-1 overflow-hidden flex flex-col h-full">
                  {currentFile && (
                    <>
                      <header className="h-[35px] shrink-0 flex items-center border-b border-[#333333] bg-[#252526] px-2">
                        <Breadcrumb>
                          <BreadcrumbList className="text-xs">
                            {breadcrumbs.map((crumb: string, index: number) => (
                              <Fragment key={index}>
                                {index < breadcrumbs.length - 1 ? (
                                  <BreadcrumbItem>
                                    <BreadcrumbLink
                                      href="#"
                                      className="text-[#cccccc] hover:text-white"
                                    >
                                      {crumb}
                                    </BreadcrumbLink>
                                  </BreadcrumbItem>
                                ) : (
                                  <BreadcrumbItem>
                                    <BreadcrumbPage className="text-[#cccccc]">
                                      {crumb}
                                    </BreadcrumbPage>
                                  </BreadcrumbItem>
                                )}
                                {index < breadcrumbs.length - 1 && (
                                  <BreadcrumbSeparator className="text-[#666666] mx-1" />
                                )}
                              </Fragment>
                            ))}
                          </BreadcrumbList>
                        </Breadcrumb>
                      </header>

                      {/* Editor - Fixed styling issues */}
                      <div className="flex-1 overflow-hidden relative">
                        <ContextMenu>
                          <ContextMenuTrigger className="absolute inset-0">
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
                                  keybindings: [monaco.KeyMod.CtrlCmd, monaco.KeyCode.KeyK],
                                  run: () => {
                                    setIsCommandOpen(true)
                                  }
                                })
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
                                fixedOverflowWidgets: true
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
                          </ContextMenuTrigger>
                          <ContextMenuContent>
                            <ContextMenuItem onSelect={() => {
                              if (currentFile.content) {
                                navigator.clipboard.writeText(currentFile.content)
                              }
                            }}>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy
                            </ContextMenuItem>
                            <ContextMenuItem>
                              <Trash className="w-4 h-4 mr-2" />
                              Delete
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      </div>
                    </>
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
                    <Terminal />
                  </ResizablePanel>
                </>
              )}
            </ResizablePrimitive.PanelGroup>
          </ResizablePanel>

          {showPreview && (
            <>
              <ResizableHandle
                className="hover:bg-blue-500"
                style={{ cursor: 'ew-resize' }}
              />
              <ResizablePanel defaultSize={35}>
                <Preview />
              </ResizablePanel>
            </>
          )}
        </ResizablePrimitive.PanelGroup>
      </div>

      {contextMenu && (
        <div
          className="fixed bg-[#2d2d2d] border border-[#333333] rounded shadow-lg py-2 z-50"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button className="w-full text-left px-4 py-2 hover:bg-[#3a3d3e] flex items-center gap-2">
            <Copy className="w-4 h-4" />
            <span>Copy</span>
          </button>
          <button className="w-full text-left px-4 py-2 hover:bg-[#3a3d3e] flex items-center gap-2">
            <Trash className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      )}
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