import { createContext, useContext, useState } from 'react'
import type { FileSystemContextType, FileSystemItem, FileType } from '../_components/types'

const FileSystemContext = createContext<FileSystemContextType | undefined>(undefined)

export function FileSystemProvider({ children }: { children: React.ReactNode }) {
  const [files, setFiles] = useState<FileSystemItem[]>([])
  const [currentFile, setCurrentFile] = useState<FileSystemItem | undefined>()

  const addItem = (parentPath: string, name: string, type: FileType): FileSystemItem => {
    const newItem: FileSystemItem = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      type,
      path: parentPath ? `${parentPath}/${name}` : name,
      content: type === "file" ? "" : undefined,
      children: type === "folder" ? [] : undefined
    }

    setFiles(prevFiles => {
      if (!parentPath) {
        return [...prevFiles, newItem]
      }

      const updateChildren = (items: FileSystemItem[]): FileSystemItem[] => {
        return items.map(item => {
          if (item.path === parentPath && item.type === "folder") {
            return {
              ...item,
              children: [...(item.children || []), newItem]
            }
          } else if (item.children) {
            return {
              ...item,
              children: updateChildren(item.children)
            }
          }
          return item
        })
      }

      return updateChildren(prevFiles)
    })

    return newItem
  }

  const addFile = (parentPath: string, name: string, type: FileType = "file") => {
    return addItem(parentPath, name, type)
  }

  const addFolder = (parentPath: string, name: string) => {
    return addItem(parentPath, name, "folder")
  }

  const deleteItem = (path: string) => {
    setFiles(prevFiles => {
      const deleteFromChildren = (items: FileSystemItem[]): FileSystemItem[] => {
        return items.filter(item => {
          if (item.path === path) {
            return false
          }
          if (item.children) {
            item.children = deleteFromChildren(item.children)
          }
          return true
        })
      }
      return deleteFromChildren(prevFiles)
    })
  }

  const updateFileContent = (path: string, content: string) => {
    setFiles(prevFiles => {
      const updateContent = (items: FileSystemItem[]): FileSystemItem[] => {
        return items.map(item => {
          if (item.path === path) {
            return { ...item, content }
          }
          if (item.children) {
            return {
              ...item,
              children: updateContent(item.children)
            }
          }
          return item
        })
      }
      return updateContent(prevFiles)
    })
  }

  const renameItem = (path: string, newName: string) => {
    setFiles(prevFiles => {
      const renameInChildren = (items: FileSystemItem[]): FileSystemItem[] => {
        return items.map(item => {
          if (item.path === path) {
            const newPath = item.path.split('/').slice(0, -1).concat(newName).join('/')
            return {
              ...item,
              name: newName,
              path: newPath,
              children: item.children?.map(child => ({
                ...child,
                path: child.path.replace(item.path, newPath)
              }))
            }
          }
          if (item.children) {
            return {
              ...item,
              children: renameInChildren(item.children)
            }
          }
          return item
        })
      }
      return renameInChildren(prevFiles)
    })
  }

  return (
    <FileSystemContext.Provider 
      value={{ 
        files, 
        addFile, 
        addFolder, 
        deleteItem, 
        updateFileContent,
        renameItem,
        currentFile,
        setCurrentFile
      }}
    >
      {children}
    </FileSystemContext.Provider>
  )
}

export const useFileSystem = () => {
  const context = useContext(FileSystemContext)
  if (context === undefined) {
    throw new Error('useFileSystem must be used within a FileSystemProvider')
  }
  return context
}

