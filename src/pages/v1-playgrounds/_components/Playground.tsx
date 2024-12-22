import { useState, useCallback, useEffect } from 'react';
import { Copy, Trash } from 'lucide-react';
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

function PlaygroundContent() {
  const { currentFile } = useFileSystem();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

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

  const breadcrumbs = currentFile ? currentFile.path.split('/') : [];

  return (
    <div className="h-full w-full flex flex-col bg-[#1e1e1e] text-white">
      {/* Header */}
      <header className="h-[30px] border-b border-[#333333] flex items-center px-2 bg-[#3c3c3c] text-[#cccccc]">
        <div className="flex items-center space-x-2 text-[13px]">
          <span>File</span>
          <span>Edit</span>
          <span>Selection</span>
          <span>View</span>
          <span>Go</span>
          <span>Run</span>
          <span>Terminal</span>
          <span>Help</span>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <ActivityBar />

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {currentFile && (
            <header className="flex h-16 shrink-0 items-center gap-2 border-b border-[#333333] px-4">
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((crumb: string, index: number) => (
                    <Fragment key={index}>
                      {index < breadcrumbs.length - 1 ? (
                        <BreadcrumbItem>
                          <BreadcrumbLink href="#">{crumb}</BreadcrumbLink>
                        </BreadcrumbItem>
                      ) : (
                        <BreadcrumbItem>
                          <BreadcrumbPage>{crumb}</BreadcrumbPage>
                        </BreadcrumbItem>
                      )}
                      {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                    </Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </header>
          )}
          <main className="flex-1 overflow-auto p-4">
            <WelcomeScreen />
          </main>
        </div>
      </div>

      {/* Context Menu */}
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
    </div>
  );
}

const Playground = () => {
  return (
    <div className="h-full w-full">
      <FileSystemProvider>
        <PlaygroundContent />
      </FileSystemProvider>
    </div>
  );
};

export default Playground;