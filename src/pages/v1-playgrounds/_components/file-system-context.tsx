import { createContext, useContext, useState, useEffect } from 'react'
import type { FileSystemContextType, FileSystemItem, FileType } from '../_components/types'
import type { VSCodeState } from "./state";

const FileSystemContext = createContext<FileSystemContextType | undefined>(undefined)

interface FileSystemProviderProps {
  children: React.ReactNode;
  initialState: VSCodeState;
}

export function FileSystemProvider({ children, initialState }: FileSystemProviderProps) {
  // Helper function to find a file by path - Move this before state initialization
  const findFileByPath = (items: FileSystemItem[], path: string): FileSystemItem | null => {
    for (const item of items) {
      if (item.path === path) return item;
      if (item.children) {
        const found = findFileByPath(item.children, path);
        if (found) return found;
      }
    }
    return null;
  };

  const convertInitialFiles = () => {
    const fileSystem: FileSystemItem[] = [];
    const folderMap = new Map<string, FileSystemItem>();

    const ensureFolder = (path: string): FileSystemItem => {
      if (folderMap.has(path)) {
        return folderMap.get(path)!;
      }

      const parts = path.split("/").filter(Boolean);
      const name = parts[parts.length - 1]!;
      const parentPath = "/" + parts.slice(0, -1).join("/");
      
      const folder: FileSystemItem = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        type: "folder",
        path,
        children: []
      };

      folderMap.set(path, folder);

      if (parts.length > 1) {
        const parent = ensureFolder(parentPath);
        parent.children?.push(folder);
      } else {
        fileSystem.push(folder);
      }

      return folder;
    };

    // Process each file
    Object.entries(initialState.files).forEach(([path, data]) => {
      const parts = path.split("/").filter(Boolean);
      const fileName = parts[parts.length - 1]!;
      const parentPath = parts.length > 1 ? "/" + parts.slice(0, -1).join("/") : "";

      const file: FileSystemItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: fileName,
        type: "file",
        path,
        content: data.content
      };

      if (parentPath) {
        const parent = ensureFolder(parentPath);
        parent.children?.push(file);
      } else {
        fileSystem.push(file);
      }
    });

    return fileSystem;
  };

  const initialFiles = convertInitialFiles();

  const [files, setFiles] = useState<FileSystemItem[]>(initialFiles);
  const [openFiles, setOpenFiles] = useState<FileSystemItem[]>(() => {
    // Open default files initially
    return initialState.config.defaultOpenFiles
      .map(path => {
        const file = findFileByPath(initialFiles, path);
        return file || null;
      })
      .filter((file): file is FileSystemItem => file !== null);
  });
  const [currentFile, setCurrentFile] = useState<FileSystemItem | undefined>(
    openFiles.length > 0 ? openFiles[0] : undefined
  );

  // Set first file as current if exists
  useEffect(() => {
    if (openFiles.length > 0 && !currentFile) {
      setCurrentFile(openFiles[0]);
    }
  }, [openFiles, currentFile]);

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

  const openFile = (file: FileSystemItem) => {
    if (!openFiles.find(f => f.path === file.path)) {
      setOpenFiles(prev => [...prev, file]);
    }
    setCurrentFile(file);
  };

  const closeFile = (path: string) => {
    setOpenFiles(prev => {
      const newFiles = prev.filter(f => f.path !== path);
      // If closing current file, switch to last open file
      if (currentFile?.path === path) {
        setCurrentFile(newFiles[newFiles.length - 1]);
      }
      return newFiles;
    });
  };

  const reorderFiles = (newOrder: FileSystemItem[]) => {
    setOpenFiles(newOrder)
  }

  const moveFile = (sourcePath: string, targetFolderPath: string) => {
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      
      let fileToMove: FileSystemItem | null = null;
      let fileParentChildren: FileSystemItem[] | undefined;
      
      const findFile = (items: FileSystemItem[], parent?: FileSystemItem) => {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (!item) continue;
          
          if (item.path === sourcePath) {
            fileToMove = item;
            fileParentChildren = parent ? parent.children : newFiles;
            return true;
          }
          if (item.children) {
            if (findFile(item.children, item)) return true;
          }
        }
        return false;
      };
      
      findFile(newFiles);
      
      if (!fileToMove || !fileParentChildren) return prevFiles;
      
      const fileIndex = fileParentChildren.findIndex(f => f.path === sourcePath);
      if (fileIndex === -1) return prevFiles;
      fileParentChildren.splice(fileIndex, 1);
      
      const updatePaths = (item: FileSystemItem, newParentPath: string) => {
        const newPath = newParentPath ? `${newParentPath}/${item.name}` : item.name;
        item.path = newPath;
        if (item.children) {
          item.children.forEach(child => updatePaths(child, newPath));
        }
        return item;
      };
      
      const updatedFile = updatePaths(fileToMove, targetFolderPath);
      
      // If target is empty string (root), add to root level
      if (targetFolderPath === "") {
        newFiles.push(updatedFile);
        return newFiles;
      }
      
      // Otherwise add to target folder
      const addToTarget = (items: FileSystemItem[]) => {
        for (const item of items) {
          if (item.path === targetFolderPath && item.type === "folder") {
            item.children = item.children || [];
            item.children.push(updatedFile);
            return true;
          }
          if (item.children && addToTarget(item.children)) {
            return true;
          }
        }
        return false;
      };
      
      addToTarget(newFiles);
      
      return newFiles;
    });
  };

  return (
    <FileSystemContext.Provider 
      value={{ 
        files, 
        setFiles,
        addFile, 
        addFolder, 
        deleteItem, 
        updateFileContent,
        renameItem,
        currentFile,
        setCurrentFile,
        openFiles,
        openFile,
        closeFile,
        reorderFiles,
        moveFile,
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

