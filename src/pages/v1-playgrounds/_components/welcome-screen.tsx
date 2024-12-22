import { FileIcon, FolderIcon, GitBranchIcon, BookOpenIcon } from 'lucide-react'
import { useFileSystem } from "./file-system-context"

export function WelcomeScreen() {
  const { addFile, addFolder } = useFileSystem()

  const handleNewFile = () => {
    addFile("", "untitled.txt", "file")
  }

  const handleNewFolder = () => {
    addFolder("", "New Folder")
  }

  return (
    <div className="h-full w-full bg-[#1e1e1e] overflow-auto">
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-12">
          <h1 className="text-[32px] font-light mb-4 text-[#cccccc]">Visual Studio Code</h1>
          <p className="text-[#cccccc] opacity-60">Editing evolved</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-[11px] uppercase tracking-wider text-[#cccccc] opacity-60 mb-4">Start</h2>
            <div className="space-y-1">
              <button 
                onClick={handleNewFile}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#2a2d2e] text-left text-[#cccccc]"
              >
                <FileIcon className="w-5 h-5" />
                <span>New File...</span>
              </button>
              <button 
                onClick={handleNewFolder}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#2a2d2e] text-left text-[#cccccc]"
              >
                <FolderIcon className="w-5 h-5" />
                <span>Open Folder...</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#2a2d2e] text-left text-[#cccccc]">
                <GitBranchIcon className="w-5 h-5" />
                <span>Clone Repository...</span>
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-4">Walkthroughs</h2>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#2a2d2e] text-left group">
                <BookOpenIcon className="w-5 h-5" />
                <div>
                  <div className="font-medium">Get Started with VS Code for the Web</div>
                  <div className="text-sm text-gray-400">Customize your editor, learn the basics, and start coding</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

