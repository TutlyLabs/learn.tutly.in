import { useState } from 'react'
import { ChevronRight, Plus, FolderPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFileSystem } from './file-system-context'
import type { FileSystemItem } from './types'
import { Input } from '@/components/ui/input'

import { 
  VscFolder,
  VscFolderOpened,
  VscFile,
  VscFileCode,
  VscJson,
  VscMarkdown,
} from "react-icons/vsc"

interface FileTreeItemProps {
  item: FileSystemItem
  level?: number
}

function getFileIcon(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase()
  
  switch(extension) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return VscFileCode
    case 'json':
      return VscJson
    case 'md':
      return VscMarkdown
    default:
      return VscFile
  }
}

function FileTreeItem({ item, level = 0 }: FileTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isAddingFile, setIsAddingFile] = useState(false)
  const [isAddingFolder, setIsAddingFolder] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const { setCurrentFile, addFile, addFolder, renameItem } = useFileSystem()

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (item.type === 'folder') {
      setIsExpanded(!isExpanded)
    } else {
      setCurrentFile(item)
    }
  }

  const handleAddFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsAddingFile(true)
  }

  const handleAddFolder = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsAddingFolder(true)
  }

  const handleNewItemSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newItemName) {
      if (isAddingFile) {
        addFile(item.path, newItemName, "file")
      } else if (isAddingFolder) {
        addFolder(item.path, newItemName)
      }
      setNewItemName('')
      setIsAddingFile(false)
      setIsAddingFolder(false)
      setIsExpanded(true)
    }
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (item.type === "file") {
      setIsEditing(true)
      setNewItemName(item.name)
    }
  }

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault()
    if (newItemName && newItemName !== item.name) {
      renameItem(item.path, newItemName)
    }
    setIsEditing(false)
    setNewItemName('')
  }

  const FileIcon = item.type === "file" ? getFileIcon(item.name) : (isExpanded ? VscFolderOpened : VscFolder)

  return (
    <div>
      <div
        className={cn(
          "flex items-center py-[2px] hover:bg-[#2a2d2e] cursor-pointer text-[13px] group relative",
          item.type === "file" && "pl-7",
          "mx-0.5 rounded-[3px]"
        )}
        style={{ paddingLeft: `${level * 12}px` }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        {item.type === "folder" && (
          <ChevronRight
            className={cn(
              "w-[18px] h-[18px] p-0.5 text-[#6b6b6b] transition-transform duration-150",
              isExpanded && "rotate-90"
            )}
          />
        )}
        <FileIcon className={cn(
          "w-[16px] h-[16px] mr-1.5",
          item.type === "folder" ? "text-[#e3a53c]" : "text-[#519aba]"
        )} />
        
        {isEditing ? (
          <form onSubmit={handleRename} className="flex-1 mr-1" onClick={e => e.stopPropagation()}>
            <Input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="h-5 text-xs bg-[#3c3c3c] border-[#3c3c3c] rounded-sm px-1"
              autoFocus
              onBlur={() => setIsEditing(false)}
            />
          </form>
        ) : (
          <span className="text-[#cccccc] select-none leading-none flex-1">{item.name}</span>
        )}
        
        {item.type === "folder" && (
          <div className="ml-auto invisible group-hover:visible flex mr-1">
            <button 
              onClick={handleAddFile} 
              className="p-0.5 hover:bg-[#37373d] rounded-sm"
              title="New File"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={handleAddFolder} 
              className="p-0.5 hover:bg-[#37373d] rounded-sm ml-0.5"
              title="New Folder"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      {(isAddingFile || isAddingFolder) && (
        <form 
          onSubmit={handleNewItemSubmit} 
          className="pl-7" 
          style={{ paddingLeft: `${(level + 1) * 12}px` }}
        >
          <Input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder={isAddingFile ? "File name" : "Folder name"}
            className="h-5 text-xs bg-[#3c3c3c] border-[#3c3c3c] rounded-sm my-0.5 px-2"
            autoFocus
          />
        </form>
      )}
      {item.type === "folder" && isExpanded && item.children && (
        <div>
          {item.children.map((child: FileSystemItem) => (
            <FileTreeItem
              key={child.id}
              item={child}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FileTree() {
  const { files } = useFileSystem()
  
  return (
    <div className="pt-1 select-none">
      {files.map((file: FileSystemItem) => (
        <FileTreeItem key={file.id} item={file} />
      ))}
    </div>
  )
}

