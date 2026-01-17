import { useState, useMemo, useCallback } from "react"
import {
  Folder,
  FolderOpen,
  File,
  FileText,
  FileCode,
  FileJson,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileSpreadsheet,
  FileType,
  ChevronRight,
} from "lucide-react"
import { cn, formatBytes } from "@/lib/utils"

// Tree node structure
export interface TreeNode {
  name: string
  path: string
  type: "file" | "folder"
  size?: number
  children?: TreeNode[]
}

// R2 Object from API
export interface R2ObjectItem {
  key: string
  size: number
}

// Get icon based on file extension
function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() || ""

  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "ico", "bmp", "tiff"].includes(ext)) {
    return <FileImage className="size-4 text-green-500" />
  }
  if (["mp4", "webm", "mov", "avi", "mkv", "flv", "wmv"].includes(ext)) {
    return <FileVideo className="size-4 text-purple-500" />
  }
  if (["mp3", "wav", "ogg", "flac", "aac", "wma", "m4a"].includes(ext)) {
    return <FileAudio className="size-4 text-pink-500" />
  }
  if (["js", "ts", "jsx", "tsx", "py", "rb", "go", "rs", "java", "c", "cpp", "h", "hpp", "cs", "php", "swift", "kt"].includes(ext)) {
    return <FileCode className="size-4 text-blue-500" />
  }
  if (ext === "json") {
    return <FileJson className="size-4 text-yellow-500" />
  }
  if (["txt", "md", "mdx", "rst", "log"].includes(ext)) {
    return <FileText className="size-4 text-gray-500" />
  }
  if (["zip", "tar", "gz", "rar", "7z", "bz2"].includes(ext)) {
    return <FileArchive className="size-4 text-amber-600" />
  }
  if (["csv", "xlsx", "xls", "ods"].includes(ext)) {
    return <FileSpreadsheet className="size-4 text-emerald-600" />
  }
  if (ext === "pdf") {
    return <FileType className="size-4 text-red-500" />
  }
  if (["html", "htm", "css", "scss", "sass", "less"].includes(ext)) {
    return <FileCode className="size-4 text-orange-500" />
  }
  if (["yaml", "yml", "toml", "ini", "env", "config"].includes(ext)) {
    return <FileText className="size-4 text-slate-500" />
  }
  if (ext === "sql") {
    return <FileCode className="size-4 text-cyan-500" />
  }
  return <File className="size-4 text-muted-foreground" />
}

// Convert flat R2 objects to tree structure
export function buildFileTree(objects: R2ObjectItem[], hideKeepFiles = true): TreeNode[] {
  const root: TreeNode[] = []

  // Filter out .keep files if needed
  const filteredObjects = hideKeepFiles
    ? objects.filter(obj => !obj.key.endsWith('/.keep') && obj.key !== '.keep')
    : objects

  for (const obj of filteredObjects) {
    const parts = obj.key.split("/")
    let currentLevel = root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (!part) continue // Skip empty parts

      const isFile = i === parts.length - 1
      const currentPath = parts.slice(0, i + 1).join("/")

      let existing = currentLevel.find((node) => node.name === part)

      if (!existing) {
        const newNode: TreeNode = {
          name: part,
          path: currentPath,
          type: isFile ? "file" : "folder",
          ...(isFile && { size: obj.size }),
          ...(!isFile && { children: [] }),
        }
        currentLevel.push(newNode)
        existing = newNode
      }

      if (!isFile && existing.children) {
        currentLevel = existing.children
      }
    }
  }

  // Also add empty folders from .keep files
  if (hideKeepFiles) {
    for (const obj of objects) {
      if (obj.key.endsWith('/.keep')) {
        const folderPath = obj.key.replace('/.keep', '')
        const parts = folderPath.split("/")
        let currentLevel = root

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i]
          if (!part) continue

          const currentPath = parts.slice(0, i + 1).join("/")
          let existing = currentLevel.find((node) => node.name === part)

          if (!existing) {
            const newNode: TreeNode = {
              name: part,
              path: currentPath,
              type: "folder",
              children: [],
            }
            currentLevel.push(newNode)
            existing = newNode
          }

          if (existing.children) {
            currentLevel = existing.children
          }
        }
      }
    }
  }

  // Sort: folders first, then files, both alphabetically
  const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
    return nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    }).map((node) => {
      if (node.children) {
        node.children = sortNodes(node.children)
      }
      return node
    })
  }

  return sortNodes(root)
}

// Tree node component
interface TreeNodeComponentProps {
  node: TreeNode
  level: number
  selectedPath: string | null
  onSelect: (path: string, type: "file" | "folder") => void
  expandedFolders: Set<string>
  onToggleFolder: (path: string) => void
}

function TreeNodeComponent({
  node,
  level,
  selectedPath,
  onSelect,
  expandedFolders,
  onToggleFolder,
}: TreeNodeComponentProps) {
  const isExpanded = expandedFolders.has(node.path)
  const isSelected = selectedPath === node.path
  const isFolder = node.type === "folder"
  const childCount = node.children?.length || 0
  const indent = level * 10

  if (isFolder) {
    return (
      <div>
        <div
          className={cn(
            "flex items-center h-7 pr-2 cursor-pointer text-[13px] select-none",
            "hover:bg-muted/60",
            isSelected && "bg-accent text-accent-foreground"
          )}
          style={{ paddingLeft: `${indent + 4}px` }}
          onClick={() => {
            onToggleFolder(node.path)
            onSelect(node.path, "folder")
          }}
        >
          <ChevronRight
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform duration-150",
              isExpanded && "rotate-90"
            )}
          />
          <span className="shrink-0 ml-0.5">
            {isExpanded ? (
              <FolderOpen className="size-4 text-amber-500" />
            ) : (
              <Folder className="size-4 text-amber-500" />
            )}
          </span>
          <span className="ml-1.5 truncate flex-1 min-w-0" title={node.name}>{node.name}</span>
          {childCount > 0 && (
            <span className="ml-1 shrink-0 text-[10px] text-muted-foreground/70 tabular-nums">
              {childCount}
            </span>
          )}
        </div>
        {isExpanded && node.children && (
          <div>
            {node.children.map((child) => (
              <TreeNodeComponent
                key={child.path}
                node={child}
                level={level + 1}
                selectedPath={selectedPath}
                onSelect={onSelect}
                expandedFolders={expandedFolders}
                onToggleFolder={onToggleFolder}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex items-center h-7 pr-2 cursor-pointer text-[13px] select-none",
        "hover:bg-muted/60",
        isSelected && "bg-accent text-accent-foreground"
      )}
      style={{ paddingLeft: `${indent + 18}px` }}
      onClick={() => onSelect(node.path, "file")}
    >
      <span className="shrink-0">{getFileIcon(node.name)}</span>
      <span className="ml-1.5 truncate flex-1 min-w-0 text-muted-foreground" title={node.name}>{node.name}</span>
      {node.size !== undefined && node.size > 0 && (
        <span className="ml-1 shrink-0 text-[10px] text-muted-foreground/60 tabular-nums">
          {formatBytes(node.size)}
        </span>
      )}
    </div>
  )
}

// Main FileTree component
interface FileTreeProps {
  objects: R2ObjectItem[]
  selectedPath: string | null
  onSelect: (path: string, type: "file" | "folder") => void
  className?: string
}

export function FileTree({ objects, selectedPath, onSelect, className }: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  const tree = useMemo(() => buildFileTree(objects, true), [objects])

  const handleToggleFolder = useCallback((path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }, [])

  const expandToPath = useCallback((path: string) => {
    const parts = path.split("/")
    const foldersToExpand: string[] = []
    for (let i = 0; i < parts.length - 1; i++) {
      foldersToExpand.push(parts.slice(0, i + 1).join("/"))
    }
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      foldersToExpand.forEach((f) => next.add(f))
      return next
    })
  }, [])

  const handleSelect = useCallback((path: string, type: "file" | "folder") => {
    if (type === "file") {
      expandToPath(path)
    }
    onSelect(path, type)
  }, [expandToPath, onSelect])

  const totalFolders = useMemo(() => {
    let count = 0
    const countFolders = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        if (node.type === "folder") {
          count++
          if (node.children) countFolders(node.children)
        }
      }
    }
    countFolders(tree)
    return count
  }, [tree])

  const totalFiles = useMemo(() => {
    let count = 0
    const countFiles = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        if (node.type === "file") {
          count++
        } else if (node.children) {
          countFiles(node.children)
        }
      }
    }
    countFiles(tree)
    return count
  }, [tree])

  if (tree.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-8 text-muted-foreground", className)}>
        <Folder className="size-8 mb-2 opacity-50" />
        <p className="text-sm">No files yet</p>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col text-sm", className)}>
      {(totalFolders > 0 || totalFiles > 0) && (
        <div className="px-3 py-1.5 text-[10px] text-muted-foreground border-b border-border">
          {totalFolders > 0 && <span>{totalFolders} {totalFolders === 1 ? "folder" : "folders"}</span>}
          {totalFolders > 0 && totalFiles > 0 && <span> · </span>}
          {totalFiles > 0 && <span>{totalFiles} {totalFiles === 1 ? "file" : "files"}</span>}
        </div>
      )}
      <div className="py-1">
        {tree.map((node) => (
          <TreeNodeComponent
            key={node.path}
            node={node}
            level={0}
            selectedPath={selectedPath}
            onSelect={handleSelect}
            expandedFolders={expandedFolders}
            onToggleFolder={handleToggleFolder}
          />
        ))}
      </div>
    </div>
  )
}
