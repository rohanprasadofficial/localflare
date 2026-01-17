import { useState, useMemo } from "react"
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
  ChevronsUpDown,
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

  // Images
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "ico", "bmp", "tiff"].includes(ext)) {
    return <FileImage className="size-4 text-green-500" />
  }

  // Videos
  if (["mp4", "webm", "mov", "avi", "mkv", "flv", "wmv"].includes(ext)) {
    return <FileVideo className="size-4 text-purple-500" />
  }

  // Audio
  if (["mp3", "wav", "ogg", "flac", "aac", "wma", "m4a"].includes(ext)) {
    return <FileAudio className="size-4 text-pink-500" />
  }

  // Code files
  if (["js", "ts", "jsx", "tsx", "py", "rb", "go", "rs", "java", "c", "cpp", "h", "hpp", "cs", "php", "swift", "kt"].includes(ext)) {
    return <FileCode className="size-4 text-blue-500" />
  }

  // JSON
  if (ext === "json") {
    return <FileJson className="size-4 text-yellow-500" />
  }

  // Text/Markdown
  if (["txt", "md", "mdx", "rst", "log"].includes(ext)) {
    return <FileText className="size-4 text-gray-500" />
  }

  // Archives
  if (["zip", "tar", "gz", "rar", "7z", "bz2"].includes(ext)) {
    return <FileArchive className="size-4 text-amber-600" />
  }

  // Spreadsheets
  if (["csv", "xlsx", "xls", "ods"].includes(ext)) {
    return <FileSpreadsheet className="size-4 text-emerald-600" />
  }

  // PDF
  if (ext === "pdf") {
    return <FileType className="size-4 text-red-500" />
  }

  // HTML/CSS
  if (["html", "htm", "css", "scss", "sass", "less"].includes(ext)) {
    return <FileCode className="size-4 text-orange-500" />
  }

  // Config files
  if (["yaml", "yml", "toml", "ini", "env", "config"].includes(ext)) {
    return <FileText className="size-4 text-slate-500" />
  }

  // Default file icon
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

  if (isFolder) {
    return (
      <div className="select-none">
        <div
          className={cn(
            "flex items-center gap-1 py-1.5 px-2 rounded-md text-sm cursor-pointer transition-all duration-150 group",
            isSelected
              ? "bg-primary/10 text-primary"
              : "hover:bg-muted/80 text-foreground"
          )}
          style={{ paddingLeft: `${level * 16 + 4}px` }}
          onClick={() => onSelect(node.path, node.type)}
        >
          {/* Expand/Collapse button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleFolder(node.path)
            }}
            className={cn(
              "shrink-0 p-0.5 rounded hover:bg-muted-foreground/20 transition-colors",
              "text-muted-foreground hover:text-foreground"
            )}
          >
            <ChevronRight
              className={cn(
                "size-3.5 transition-transform duration-200",
                isExpanded && "rotate-90"
              )}
            />
          </button>

          {/* Folder icon */}
          <span className="shrink-0">
            {isExpanded ? (
              <FolderOpen className="size-4 text-amber-500" />
            ) : (
              <Folder className="size-4 text-amber-500" />
            )}
          </span>

          {/* Folder name */}
          <span className="truncate font-medium">{node.name}</span>

          {/* Item count badge */}
          <span className={cn(
            "ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground",
            "opacity-60 group-hover:opacity-100 transition-opacity"
          )}>
            {childCount}
          </span>
        </div>

        {/* Children with animation */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-200 ease-in-out",
            isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          {node.children?.map((child) => (
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
      </div>
    )
  }

  // File node
  return (
    <div
      onClick={() => onSelect(node.path, node.type)}
      className={cn(
        "flex items-center gap-1.5 py-1.5 px-2 rounded-md text-sm cursor-pointer transition-all duration-150",
        isSelected
          ? "bg-primary/10 text-primary"
          : "hover:bg-muted/80 text-muted-foreground hover:text-foreground"
      )}
      style={{ paddingLeft: `${level * 16 + 28}px` }}
    >
      <span className="shrink-0">{getFileIcon(node.name)}</span>
      <span className="truncate">{node.name}</span>
      {node.size !== undefined && (
        <span className="ml-auto text-[10px] text-muted-foreground shrink-0 tabular-nums">
          {formatBytes(node.size)}
        </span>
      )}
    </div>
  )
}

// Breadcrumb component
interface BreadcrumbProps {
  path: string | null
  onNavigate: (path: string | null) => void
}

function Breadcrumb({ path, onNavigate }: BreadcrumbProps) {
  if (!path) return null

  const parts = path.split("/")
  const breadcrumbs = parts.slice(0, -1)

  if (breadcrumbs.length === 0) return null

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2 px-2 flex-wrap">
      <button
        onClick={() => onNavigate(null)}
        className="hover:text-foreground transition-colors hover:underline"
      >
        Root
      </button>
      {breadcrumbs.map((part, index) => {
        const partPath = parts.slice(0, index + 1).join("/")
        return (
          <span key={partPath} className="flex items-center gap-1">
            <ChevronRight className="size-3 text-muted-foreground/50" />
            <button
              onClick={() => onNavigate(partPath)}
              className="hover:text-foreground transition-colors hover:underline"
            >
              {part}
            </button>
          </span>
        )
      })}
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

  const handleToggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  const expandToPath = (path: string) => {
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
  }

  const handleSelect = (path: string, type: "file" | "folder") => {
    if (type === "file") {
      expandToPath(path)
    }
    onSelect(path, type)
  }

  const handleBreadcrumbNavigate = (path: string | null) => {
    if (path) {
      expandToPath(path + "/x")
      onSelect(path, "folder")
    }
  }

  // Expand all folders
  const expandAll = () => {
    const allFolders = new Set<string>()
    const collectFolders = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        if (node.type === "folder") {
          allFolders.add(node.path)
          if (node.children) {
            collectFolders(node.children)
          }
        }
      }
    }
    collectFolders(tree)
    setExpandedFolders(allFolders)
  }

  // Collapse all folders
  const collapseAll = () => {
    setExpandedFolders(new Set())
  }

  const hasAnyFolders = tree.some((node) => node.type === "folder")
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

  const totalFiles = objects.length

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Header with controls */}
      {hasAnyFolders && (
        <div className="flex items-center justify-between px-2 pb-2 border-b border-border mb-2">
          <div className="text-[10px] text-muted-foreground">
            {totalFolders} {totalFolders === 1 ? "folder" : "folders"}, {totalFiles} {totalFiles === 1 ? "file" : "files"}
          </div>
          <button
            onClick={expandedFolders.size > 0 ? collapseAll : expandAll}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronsUpDown className="size-3" />
            {expandedFolders.size > 0 ? "Collapse" : "Expand"}
          </button>
        </div>
      )}

      {/* Breadcrumb */}
      <Breadcrumb path={selectedPath} onNavigate={handleBreadcrumbNavigate} />

      {/* Tree */}
      <div className="space-y-0.5">
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
