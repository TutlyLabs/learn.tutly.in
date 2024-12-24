import { useState, useEffect } from 'react'
import { ChevronRight, Plus, FolderPlus, Pencil, Copy, Trash } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFileSystem } from '../file-system-context'
import type { FileSystemItem } from '../types'
import { Input } from '@/components/ui/input'
import {
  VscFolder,
  VscFolderOpened,
  VscFile,
  VscFileCode,
  VscJson,
  VscMarkdown,
} from "react-icons/vsc"
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  MouseSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { socket } from '@/lib/socket'

interface FileTreeItemProps {
  item: FileSystemItem
  level?: number
  onDragStart?: ((item: FileSystemItem) => void) | undefined
  onDragEnd?: ((item: FileSystemItem, overId: string | null) => void) | undefined
  onDragOver?: ((item: FileSystemItem, overId: string) => void) | undefined
  isDragging?: boolean
}

function getFileIcon(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase()

  switch (extension) {
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

function FileTreeItem({
  item,
  level = 0,
  isDragging
}: FileTreeItemProps) {
  const { currentFile, openFile } = useFileSystem();
  const [isExpanded, setIsExpanded] = useState(() => {
    if (currentFile) {
      return currentFile.path.startsWith(item.path);
    }
    return false;
  });
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const isActive = currentFile?.path === item.path;

  const { addFile, addFolder, renameItem, deleteItem } = useFileSystem();

  const { attributes, listeners, setNodeRef, isDragging: isItemDragging } = useDraggable({
    id: item.path,
    data: item,
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: item.path,
    data: item,
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (item.type === 'folder') {
      setIsExpanded(!isExpanded)
    } else {
      openFile(item)
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

  const handleDelete = () => {
    deleteItem(item.path);
  };

  const FileIcon = item.type === "file" ? getFileIcon(item.name) : (isExpanded ? VscFolderOpened : VscFolder)

  return (
    <div
      ref={setDroppableRef}
      className={cn(
        isOver && "bg-[#2a2d2e]",
        isItemDragging && "opacity-40"
      )}
    >
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            className={cn(
              "flex items-center py-[2px] hover:bg-[#2a2d2e] cursor-pointer text-[13px] group relative",
              "mx-0.5 rounded-[3px]",
              isActive && "bg-[#37373d]",
              isOver && "bg-[#37373d]"
            )}
            style={{
              paddingLeft: `${level * 8 +
                (item.type === "file" ? 20 : 4)
                }px`
            }}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
          >
            {item.type === "folder" && (
              <ChevronRight
                className={cn(
                  "w-[18px] h-[18px] p-0.5 text-[#6b6b6b] transition-transform duration-150 shrink-0",
                  isExpanded && "rotate-90"
                )}
              />
            )}
            <FileIcon className={cn(
              "w-[16px] h-[16px] mr-1.5 shrink-0",
              item.type === "folder" ? "text-[#e3a53c]" : "text-[#519aba]",
              isActive && "text-white"
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
        </ContextMenuTrigger>
        <ContextMenuContent className="bg-[#252526] border border-[#454545] rounded-md shadow-2xl py-0.5 min-w-[10rem] text-[13px]">
          {item.type === "folder" && (
            <>
              <ContextMenuItem className="px-2 py-1 hover:bg-[#2a2d2e] flex items-center gap-1.5 text-[#cccccc] outline-none" onClick={handleAddFile}>
                <Plus className="w-3.5 h-3.5 text-[#858585]" />
                <span>New File</span>
              </ContextMenuItem>
              <ContextMenuItem className="px-2 py-1 hover:bg-[#2a2d2e] flex items-center gap-1.5 text-[#cccccc] outline-none" onClick={handleAddFolder}>
                <FolderPlus className="w-3.5 h-3.5 text-[#858585]" />
                <span>New Folder</span>
              </ContextMenuItem>
              <div className="h-px bg-[#454545] my-0.5" />
            </>
          )}
          <ContextMenuItem className="px-2 py-1 hover:bg-[#2a2d2e] flex items-center gap-1.5 text-[#cccccc] outline-none" onClick={() => setIsEditing(true)}>
            <Pencil className="w-3.5 h-3.5 text-[#858585]" />
            <span>Rename</span>
            <span className="ml-auto text-[11px] text-[#858585]">F2</span>
          </ContextMenuItem>
          <ContextMenuItem 
            className="px-2 py-1 hover:bg-[#2a2d2e] flex items-center gap-1.5 text-[#cccccc] outline-none"
            onSelect={() => {
              if (item.type === "file" && item.content) {
                navigator.clipboard.writeText(item.content);
              } else if (item.type === "folder") {
                navigator.clipboard.writeText(item.path);
              }
            }}
          >
            <Copy className="w-3.5 h-3.5 text-[#858585]" />
            <span>Copy {item.type === "file" ? "Content" : "Path"}</span>
            <span className="ml-auto text-[11px] text-[#858585]">⌘C</span>
          </ContextMenuItem>
          <div className="h-px bg-[#454545] my-0.5" />
          <ContextMenuItem 
            className="px-2 py-1 hover:bg-[#2a2d2e] flex items-center gap-1.5 outline-none text-red-400 hover:text-red-300"
            onClick={() => setShowDeleteAlert(true)}
          >
            <Trash className="w-3.5 h-3.5" />
            <span>Delete</span>
            <span className="ml-auto text-[11px] text-[#858585]">⌫</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent className="bg-[#252526] border border-[#454545] text-[#cccccc]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#cccccc]">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#858585]">
              {item.type === "folder"
                ? "This will delete the folder and all its contents."
                : "This will delete the file permanently."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#2d2d2d] text-[#cccccc] border-[#454545] hover:bg-[#2a2a2a] hover:text-[#ffffff]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white border-none"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {(isAddingFile || isAddingFolder) && (
        <form
          onSubmit={handleNewItemSubmit}
          className="flex items-center"
          style={{
            paddingLeft: `${level * 8 +
              (item.type === "folder" ? 28 : 24)
              }px`
          }}
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
              onDragStart={() => { }}
              onDragEnd={() => { }}
              onDragOver={() => { }}
              isDragging={isDragging || false}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function DragOverlayItem({ item }: { item: FileSystemItem }) {
  const FileIcon = item.type === "file" ? getFileIcon(item.name) : VscFolder;

  return (
    <div className="flex items-center py-[2px] bg-[#37373d] text-[13px] rounded-[3px] px-2 opacity-80">
      <FileIcon className={cn(
        "w-[16px] h-[16px] mr-1.5 shrink-0",
        item.type === "folder" ? "text-[#e3a53c]" : "text-[#519aba]"
      )} />
      <span className="text-[#cccccc]">{item.name}</span>
    </div>
  );
}

export function FileTree() {
  const { files, moveFile, setFiles } = useFileSystem();
  const [draggedItem, setDraggedItem] = useState<FileSystemItem | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  useEffect(() => {
    socket.on("file-tree", (data: FileSystemItem[]) => {
      setFiles(data);
    });

    return () => {
      socket.off("file-tree");
    };
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    const item = event.active.data.current as FileSystemItem;
    setDraggedItem(item);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeItem = active.data.current as FileSystemItem;
    const overItem = over.data.current as FileSystemItem;

    // Prevent showing drop indicator for invalid targets
    if (
      activeItem.path === overItem.path ||
      overItem.path.startsWith(activeItem.path + "/") ||
      (activeItem.type === "folder" && overItem.type !== "folder") ||
      (activeItem.type === "file" && overItem.type !== "folder")
    ) {
      return;
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeItem = active.data.current as FileSystemItem;

    if (!over) {
      // If dropped in empty space, move to root
      moveFile(activeItem.path, "");
      setDraggedItem(null);
      return;
    }

    if (active.id !== over.id) {
      const overItem = over.data.current as FileSystemItem;

      // Prevent invalid moves:
      // 1. Can't drop into own subfolder
      // 2. Folders can only be dropped into other folders
      // 3. Files can only be dropped into folders
      if (
        overItem.path.startsWith(activeItem.path + "/") ||
        (activeItem.type === "folder" && overItem.type !== "folder") ||
        (activeItem.type === "file" && overItem.type !== "folder")
      ) {
        setDraggedItem(null);
        return;
      }

      moveFile(activeItem.path, overItem.path);
    }

    setDraggedItem(null);
  };

  return (
    <div className="pt-1 select-none">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {files.map((file: FileSystemItem) => (
          <FileTreeItem
            key={file.id}
            item={file}
            isDragging={draggedItem?.path === file.path}
            onDragStart={() => { }}
            onDragEnd={() => { }}
            onDragOver={() => { }}
          />
        ))}
        <DragOverlay>
          {draggedItem ? <DragOverlayItem item={draggedItem} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

