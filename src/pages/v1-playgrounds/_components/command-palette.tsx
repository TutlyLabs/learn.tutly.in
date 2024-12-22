import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { useFileSystem } from "./file-system-context"
import { useEffect, useState } from "react"
import { 
  FileIcon, 
  FolderIcon, 
  SearchIcon, 
  Settings, 
  FileCode,
  FileJson,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"

const getFileIcon = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase()
  
  switch(extension) {
    case "js":
    case "jsx":
    case "ts":
    case "tsx":
      return <FileCode className="mr-2 h-4 w-4 text-[#519aba]" />
    case "json":
      return <FileJson className="mr-2 h-4 w-4 text-[#cbcb41]" />
    case "md":
      return <FileText className="mr-2 h-4 w-4 text-[#519aba]" />
    default:
      return <FileIcon className="mr-2 h-4 w-4 text-[#cccccc]" />
  }
}

interface CommandPaletteProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function CommandPalette({ isOpen, setIsOpen }: CommandPaletteProps) {
  const { files, setCurrentFile, currentFile } = useFileSystem()
  const [search, setSearch] = useState("")

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen(true)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [setIsOpen])

  const flattenFiles = (files: any[]): any[] => {
    return files.reduce((acc: any[], file: any) => {
      if (file.type === "file") {
        return [...acc, file]
      }
      if (file.children) {
        return [...acc, ...flattenFiles(file.children)]
      }
      return acc
    }, [])
  }

  const filteredFiles = flattenFiles(files).filter((file) =>
    file.path.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <CommandDialog 
      open={isOpen} 
      onOpenChange={setIsOpen}
    >
      <div className="flex items-center border-b border-[#333333] bg-[#3c3c3c] px-3">
        <CommandInput 
          placeholder="Search files... (⌘P)"
          value={search}
          onValueChange={setSearch}
          className="border-none bg-transparent text-[#cccccc] focus:ring-0 focus:ring-offset-0 h-11"
        />
      </div>
      <CommandList className="max-h-[400px] bg-[#252526] text-[#cccccc]">
        <CommandEmpty className="text-[#cccccc]">No files found.</CommandEmpty>
        
        {!search && (
          <>
            <CommandGroup heading="Commands" className="text-[#cccccc]">
              <CommandItem className="hover:bg-[#37373d]">
                <SearchIcon className="mr-2 h-4 w-4" />
                <span>Search in Files</span>
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-[#3c3c3c] bg-[#37373d] px-1.5 font-mono text-[10px] font-medium text-[#cccccc]">
                  ⌘⇧F
                </kbd>
              </CommandItem>
              <CommandItem className="hover:bg-[#37373d]">
                <Settings className="mr-2 h-4 w-4" />
                <span>Open Settings</span>
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-[#3c3c3c] bg-[#37373d] px-1.5 font-mono text-[10px] font-medium text-[#cccccc]">
                  ⌘,
                </kbd>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator className="bg-[#3c3c3c]" />
          </>
        )}

        <CommandGroup heading="Files" className="text-[#cccccc]">
          {filteredFiles.map((file) => (
            <CommandItem
              key={file.path}
              onSelect={() => {
                setCurrentFile(file)
                setIsOpen(false)
                setSearch("")
              }}
              className={cn(
                "flex items-center hover:bg-[#37373d]",
                file.path === currentFile?.path && "bg-[#37373d]"
              )}
            >
              {getFileIcon(file.path)}
              <span>{file.path}</span>
              {file.type === "folder" && (
                <FolderIcon className="ml-2 h-4 w-4 text-[#e3a53c]" />
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
} 
