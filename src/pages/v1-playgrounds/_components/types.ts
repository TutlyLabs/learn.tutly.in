export type FileType = "file" | "folder"

export interface FileSystemItem {
  id: string
  name: string
  type: FileType
  path: string
  content?: string | undefined
  children?: FileSystemItem[] | undefined
}

export interface FileSystemContextType {
  files: FileSystemItem[]
  addFile: (parentPath: string, name: string, type: FileType) => FileSystemItem
  addFolder: (parentPath: string, name: string) => FileSystemItem
  deleteItem: (path: string) => void
  updateFileContent: (path: string, content: string) => void
  renameItem: (path: string, newName: string) => void
  currentFile: FileSystemItem | undefined
  setCurrentFile: (file: FileSystemItem | undefined) => void
}

