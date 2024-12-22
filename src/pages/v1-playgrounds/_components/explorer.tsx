import { FileTree } from "./file-tree";
import { ChevronDown, Plus, FolderPlus } from "lucide-react";
import { useFileSystem } from "./file-system-context";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export function Explorer() {
  const { addFile, addFolder, currentFile } = useFileSystem();
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newItemName, setNewItemName] = useState("");

  const handleAddFile = () => {
    setIsAddingFile(true);
  };

  const handleAddFolder = () => {
    setIsAddingFolder(true);
  };

  const handleNewItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemName) {
      const path = currentFile?.type === "folder" ? currentFile.path : "";
      if (isAddingFile) {
        addFile(path, newItemName, "file");
      } else if (isAddingFolder) {
        addFolder(path, newItemName);
      }
      setNewItemName("");
      setIsAddingFile(false);
      setIsAddingFolder(false);
    }
  };

  return (
    <div className="w-64 h-full flex-shrink-0 border-r border-[#333333] bg-[#252526]">
      <div className="flex flex-col h-full">
        <div className="py-1.5 select-none">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-[#bbbbbb] font-semibold px-4 group">
            <span>Explorer</span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleAddFile}
                className="p-1 rounded-sm invisible group-hover:visible hover:bg-[#37373d]"
                title="New File"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleAddFolder}
                className="p-1 rounded-sm invisible group-hover:visible hover:bg-[#37373d]"
                title="New Folder"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>
          {(isAddingFile || isAddingFolder) && (
            <form onSubmit={handleNewItemSubmit} className="px-4 mt-1">
              <Input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder={isAddingFile ? "File name" : "Folder name"}
                className="h-5 text-xs bg-[#3c3c3c] border-[#3c3c3c] rounded-sm px-2"
                autoFocus
                onBlur={() => {
                  setIsAddingFile(false);
                  setIsAddingFolder(false);
                  setNewItemName("");
                }}
              />
            </form>
          )}
        </div>
        <div className="flex-1 overflow-auto">
          <FileTree />
        </div>
      </div>
    </div>
  );
} 