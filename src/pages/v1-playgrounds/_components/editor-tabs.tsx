import { X } from "lucide-react"
import { useFileSystem } from "./file-system-context"
import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { 
  FileCode,
  FileJson,
  FileText,
} from "lucide-react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { createPortal } from "react-dom"
import { useState } from "react"
import { FileSystemItem } from "./types"

function getFileIcon(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase()
  
  switch(extension) {
    case "js":
    case "jsx":
    case "ts":
    case "tsx":
      return <FileCode className="h-4 w-4 text-[#519aba]" />
    case "json":
      return <FileJson className="h-4 w-4 text-[#cbcb41]" />
    case "md":
      return <FileText className="h-4 w-4 text-[#519aba]" />
    default:
      return <FileText className="h-4 w-4 text-[#cccccc]" />
  }
}

interface TabProps {
  file: FileSystemItem
  isActive: boolean
  onClose: () => void
  onClick: () => void
}

function Tab({ file, isActive, onClose, onClick }: TabProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: file.path,
    data: file,
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "group relative h-full flex items-center min-w-[150px] max-w-[200px]",
        isActive && "bg-[#1e1e1e] after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[1px] after:bg-[#1e1e1e]",
        !isActive && "hover:bg-[#2d2d2d]",
        isDragging && "opacity-50"
      )}
    >
      <button
        onClick={onClick}
        className={cn(
          "h-full px-3 flex items-center gap-2 flex-1",
          isActive && "border-t border-[#007acc]"
        )}
      >
        {getFileIcon(file.name)}
        <span className="text-[#cccccc] text-sm truncate">
          {file.name}
        </span>
      </button>
      <div
        className={cn(
          "flex items-center pr-2",
          !isActive && "opacity-0 group-hover:opacity-100"
        )}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className={cn(
            "p-0.5 rounded-sm hover:bg-[#404040]",
            "text-[#cccccc] hover:text-white "
          )}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {!isActive && (
        <div className="absolute inset-y-0 right-0 w-[1px] bg-[#333333]" />
      )}
    </div>
  )
}

function DroppableArea({ children }: { children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({
    id: "tabs-droppable",
  })

  return (
    <div ref={setNodeRef} className="flex h-9">
      {children}
    </div>
  )
}

export function EditorTabs() {
  const { openFiles, currentFile, setCurrentFile, closeFile, reorderFiles } = useFileSystem()
  const [draggedFile, setDraggedFile] = useState<FileSystemItem | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )

  if (openFiles.length === 0) return null

  const handleDragStart = (event: DragStartEvent) => {
    setDraggedFile(event.active.data.current as FileSystemItem)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggedFile(null)
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = openFiles.findIndex((file) => file.path === active.id)
      const newIndex = openFiles.findIndex((file) => file.path === over.id)

      reorderFiles(arrayMove(openFiles, oldIndex, newIndex))
    }
  }

  return (
    <ScrollArea className="border-b border-[#333333]">
      <div className="bg-[#252526]">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <DroppableArea>
            {openFiles.map((file) => (
              <Tab
                key={file.path}
                file={file}
                isActive={currentFile?.path === file.path}
                onClose={() => closeFile(file.path)}
                onClick={() => setCurrentFile(file)}
              />
            ))}
            <div className="flex-1 bg-[#1e1e1e]" />
          </DroppableArea>

          {draggedFile && createPortal(
            <DragOverlay>
              <Tab
                file={draggedFile}
                isActive={currentFile?.path === draggedFile.path}
                onClose={() => {}}
                onClick={() => {}}
              />
            </DragOverlay>,
            document.body
          )}
        </DndContext>
      </div>
      <ScrollBar orientation="horizontal" className="bg-[#333333]" />
    </ScrollArea>
  )
} 