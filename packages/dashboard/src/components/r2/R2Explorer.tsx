import { useState, useEffect, useRef, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Folder01Icon,
  File01Icon,
  Image01Icon,
  Video01Icon,
  FileAttachmentIcon,
  CodeIcon,
} from "@hugeicons/core-free-icons"
import { Upload, FolderPlus, RefreshCw, Download, Trash2 } from "lucide-react"
import { r2Api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"
import { cn, formatBytes, formatDate } from "@/lib/utils"
import { FileTree } from "./FileTree"

// Get file type from content type or filename
function getFileType(contentType?: string, filename?: string): 'image' | 'video' | 'audio' | 'pdf' | 'json' | 'text' | 'code' | 'other' {
  const ct = contentType?.toLowerCase() || ''
  const ext = filename?.split('.').pop()?.toLowerCase() || ''

  if (ct.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico'].includes(ext)) return 'image'
  if (ct.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi'].includes(ext)) return 'video'
  if (ct.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac'].includes(ext)) return 'audio'
  if (ct === 'application/pdf' || ext === 'pdf') return 'pdf'
  if (ct === 'application/json' || ext === 'json') return 'json'
  if (ct.startsWith('text/') || ['txt', 'md', 'csv', 'xml', 'html', 'css'].includes(ext)) return 'text'
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'sql'].includes(ext)) return 'code'
  return 'other'
}

// Get icon for file type
function getFileIcon(contentType?: string, filename?: string) {
  const type = getFileType(contentType, filename)
  switch (type) {
    case 'image': return Image01Icon
    case 'video': return Video01Icon
    case 'json':
    case 'code': return CodeIcon
    case 'pdf': return FileAttachmentIcon
    default: return File01Icon
  }
}

// Preview component
function FilePreview({ bucket, objectKey, contentType, size }: { bucket: string; objectKey: string; contentType?: string; size: number }) {
  const [textContent, setTextContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileType = getFileType(contentType, objectKey)
  const objectUrl = r2Api.getObjectUrl(bucket, objectKey)

  useEffect(() => {
    if ((fileType === 'text' || fileType === 'json' || fileType === 'code') && size < 1024 * 1024) {
      setLoading(true)
      setError(null)
      r2Api.getObjectContent(bucket, objectKey)
        .then(async (response) => {
          const text = await response.text()
          setTextContent(text)
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false))
    }
  }, [bucket, objectKey, fileType, size])

  if (fileType === 'image') {
    return (
      <div className="flex items-center justify-center bg-muted/30 rounded-lg p-4">
        <img
          src={objectUrl}
          alt={objectKey}
          className="max-w-full max-h-[300px] object-contain rounded"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      </div>
    )
  }

  if (fileType === 'video') {
    return (
      <div className="bg-muted/30 rounded-lg p-4">
        <video src={objectUrl} controls className="max-w-full max-h-[300px] rounded mx-auto">
          Your browser does not support video playback.
        </video>
      </div>
    )
  }

  if (fileType === 'audio') {
    return (
      <div className="bg-muted/30 rounded-lg p-4">
        <audio src={objectUrl} controls className="w-full">
          Your browser does not support audio playback.
        </audio>
      </div>
    )
  }

  if (fileType === 'pdf') {
    return (
      <div className="bg-muted/30 rounded-lg overflow-hidden">
        <iframe src={objectUrl} className="w-full h-[400px] border-0" title={objectKey} />
      </div>
    )
  }

  if (fileType === 'text' || fileType === 'json' || fileType === 'code') {
    if (loading) {
      return (
        <div className="flex items-center justify-center bg-muted/30 rounded-lg p-8">
          <span className="text-muted-foreground text-sm">Loading...</span>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex items-center justify-center bg-muted/30 rounded-lg p-8">
          <span className="text-destructive text-sm">Failed to load</span>
        </div>
      )
    }

    if (textContent !== null) {
      let displayContent = textContent
      if (fileType === 'json') {
        try {
          displayContent = JSON.stringify(JSON.parse(textContent), null, 2)
        } catch {
          // Keep original
        }
      }

      return (
        <div className="bg-muted/30 rounded-lg overflow-hidden">
          <pre className="p-3 text-xs font-mono overflow-auto max-h-[300px] whitespace-pre-wrap break-all">
            {displayContent}
          </pre>
        </div>
      )
    }
  }

  return (
    <div className="flex flex-col items-center justify-center bg-muted/30 rounded-lg p-8 gap-2">
      <HugeiconsIcon icon={File01Icon} className="size-10 text-muted-foreground/50" strokeWidth={1.5} />
      <p className="text-xs text-muted-foreground">Preview not available</p>
    </div>
  )
}

export function R2Explorer() {
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null)
  const [selectedObject, setSelectedObject] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<"file" | "folder" | null>(null)
  const [currentFolderPath, setCurrentFolderPath] = useState<string>("")
  const [isDragging, setIsDragging] = useState(false)
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const queryClient = useQueryClient()

  const { data: buckets, isLoading: loadingBuckets } = useQuery({
    queryKey: ["r2-buckets"],
    queryFn: r2Api.list,
  })

  const { data: objects, isLoading: loadingObjects, refetch: refetchObjects } = useQuery({
    queryKey: ["r2-objects", selectedBucket],
    queryFn: () => selectedBucket ? r2Api.getObjects(selectedBucket) : null,
    enabled: !!selectedBucket,
  })

  const { data: objectMeta } = useQuery({
    queryKey: ["r2-object-meta", selectedBucket, selectedObject],
    queryFn: () =>
      selectedBucket && selectedObject && selectedType === "file"
        ? r2Api.getObjectMeta(selectedBucket, selectedObject)
        : null,
    enabled: !!selectedBucket && !!selectedObject && selectedType === "file",
  })

  const deleteObjectMutation = useMutation({
    mutationFn: (key: string) => {
      if (!selectedBucket) throw new Error("No bucket selected")
      return r2Api.deleteObject(selectedBucket, key)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["r2-objects", selectedBucket] })
      setSelectedObject(null)
      setSelectedType(null)
    },
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!selectedBucket) throw new Error("No bucket selected")
      const uploadPath = currentFolderPath ? `${currentFolderPath}/${file.name}` : file.name
      return r2Api.uploadObject(selectedBucket, uploadPath, file)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["r2-objects", selectedBucket] })
    },
  })

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    for (const file of Array.from(files)) {
      uploadMutation.mutate(file)
    }
    e.target.value = ''
  }

  const handleFileDrop = useCallback((files: FileList) => {
    if (!selectedBucket) return
    for (const file of Array.from(files)) {
      uploadMutation.mutate(file)
    }
  }, [selectedBucket, uploadMutation])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (selectedBucket) setIsDragging(true)
  }, [selectedBucket])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileDrop(e.dataTransfer.files)
    }
  }, [handleFileDrop])

  const handleCreateFolder = () => {
    if (!newFolderName.trim() || !selectedBucket) return
    const folderPath = currentFolderPath
      ? `${currentFolderPath}/${newFolderName.trim()}/.keep`
      : `${newFolderName.trim()}/.keep`
    const emptyFile = new File([''], '.keep', { type: 'text/plain' })
    r2Api.uploadObject(selectedBucket, folderPath, emptyFile).then(() => {
      queryClient.invalidateQueries({ queryKey: ["r2-objects", selectedBucket] })
      setCreateFolderOpen(false)
      setNewFolderName("")
    })
  }

  const handleDownload = () => {
    if (selectedBucket && selectedObject) {
      const url = r2Api.getObjectUrl(selectedBucket, selectedObject)
      const link = document.createElement('a')
      link.href = url
      link.download = selectedObject.split('/').pop() || selectedObject
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleTreeSelect = (path: string, type: "file" | "folder") => {
    setSelectedObject(path)
    setSelectedType(type)
    if (type === "folder") {
      setCurrentFolderPath(path)
    } else {
      const parts = path.split("/")
      setCurrentFolderPath(parts.length > 1 ? parts.slice(0, -1).join("/") : "")
    }
  }

  // Auto-select first bucket
  useEffect(() => {
    if (buckets?.buckets?.length && !selectedBucket) {
      setSelectedBucket(buckets.buckets[0].binding)
    }
  }, [buckets, selectedBucket])

  if (loadingBuckets) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Loading buckets...</div>
      </div>
    )
  }

  if (!buckets?.buckets.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <HugeiconsIcon icon={Folder01Icon} className="size-12 opacity-50" strokeWidth={1.5} />
        <p className="text-sm">No R2 buckets configured</p>
        <p className="text-xs">Add an R2 bucket binding to your wrangler.toml</p>
      </div>
    )
  }

  const totalSize = objects?.objects?.reduce((acc, obj) => acc + obj.size, 0) ?? 0

  return (
    <div
      className="h-full flex flex-col"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && selectedBucket && (
        <div className="absolute inset-0 z-50 bg-primary/5 border-2 border-dashed border-primary m-2 rounded-lg flex items-center justify-center backdrop-blur-sm">
          <div className="text-center">
            <Upload className="size-12 text-primary mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-lg font-medium text-primary">Drop files to upload</p>
            <p className="text-sm text-muted-foreground mt-1">
              {currentFolderPath ? `Upload to /${currentFolderPath}` : `Upload to root`}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <HugeiconsIcon icon={Folder01Icon} className="size-5 text-r2" strokeWidth={2} />
          <div>
            <h2 className="text-sm font-semibold">R2 Storage</h2>
            <p className="text-[11px] text-muted-foreground">
              {objects?.objects?.length ?? 0} objects · {formatBytes(totalSize)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => refetchObjects()}
          >
            <RefreshCw className="size-4" />
          </Button>
          {selectedBucket && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setCreateFolderOpen(true)}
              >
                <FolderPlus className="size-4 mr-1.5" />
                New Folder
              </Button>
              <Button
                size="sm"
                className="h-8"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
              >
                <Upload className="size-4 mr-1.5" />
                {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
              </Button>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {/* Bucket tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-background">
        {buckets.buckets.map((bucket) => (
          <button
            key={bucket.binding}
            onClick={() => {
              setSelectedBucket(bucket.binding)
              setSelectedObject(null)
              setSelectedType(null)
              setCurrentFolderPath("")
            }}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
              selectedBucket === bucket.binding
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {bucket.binding}
          </button>
        ))}
      </div>

      {/* Main content */}
      <ResizablePanelGroup orientation="horizontal" className="flex-1 min-h-0">
        {/* File tree */}
        <ResizablePanel id="file-tree" defaultSize={30} minSize={10}>
          <div className="h-full flex flex-col bg-muted/20">
          {currentFolderPath && (
            <div className="px-3 py-2 border-b border-border bg-muted/30 overflow-hidden">
              <div className="flex items-center text-xs text-muted-foreground overflow-x-auto scrollbar-none">
                <button
                  onClick={() => {
                    setCurrentFolderPath("")
                    setSelectedObject(null)
                    setSelectedType(null)
                  }}
                  className="hover:text-foreground shrink-0"
                >
                  {selectedBucket}
                </button>
                {currentFolderPath.split("/").map((part, i, arr) => (
                  <span key={i} className="flex items-center shrink-0">
                    <span className="mx-1 text-muted-foreground/50">/</span>
                    <button
                      onClick={() => {
                        const newPath = arr.slice(0, i + 1).join("/")
                        setCurrentFolderPath(newPath)
                        setSelectedObject(newPath)
                        setSelectedType("folder")
                      }}
                      className="hover:text-foreground max-w-[100px] truncate"
                      title={part}
                    >
                      {part}
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
          <ScrollArea className="flex-1">
            {loadingObjects ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                Loading...
              </div>
            ) : objects?.objects?.length ? (
              <FileTree
                objects={objects.objects.map((obj) => ({ key: obj.key, size: obj.size }))}
                selectedPath={selectedObject}
                onSelect={handleTreeSelect}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <HugeiconsIcon icon={Folder01Icon} className="size-10 opacity-30 mb-2" strokeWidth={1.5} />
                <p className="text-xs">Empty bucket</p>
                <Button
                  variant="link"
                  size="sm"
                  className="mt-2 h-auto p-0 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload files
                </Button>
              </div>
            )}
          </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Details panel */}
        <ResizablePanel id="details" defaultSize={70} minSize={10}>
          <div className="h-full flex flex-col bg-background">
          {selectedType === "file" && selectedObject && objectMeta ? (
            <div className="flex flex-col h-full">
              {/* File header */}
              <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <HugeiconsIcon
                    icon={getFileIcon(objectMeta.httpMetadata?.contentType, selectedObject)}
                    className="size-5 text-muted-foreground shrink-0"
                    strokeWidth={2}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{selectedObject.split('/').pop()}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatBytes(objectMeta.size)} · {objectMeta.httpMetadata?.contentType || 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" className="h-8" onClick={handleDownload}>
                    <Download className="size-4 mr-1.5" />
                    Download
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8"
                    onClick={() => deleteObjectMutation.mutate(selectedObject)}
                    disabled={deleteObjectMutation.isPending}
                  >
                    <Trash2 className="size-4 mr-1.5" />
                    Delete
                  </Button>
                </div>
              </div>

              {/* File content */}
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {/* Preview */}
                  <FilePreview
                    bucket={selectedBucket!}
                    objectKey={selectedObject}
                    contentType={objectMeta.httpMetadata?.contentType}
                    size={objectMeta.size}
                  />

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase text-muted-foreground font-medium">Path</p>
                      <p className="text-xs font-mono break-all">{selectedObject}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase text-muted-foreground font-medium">Uploaded</p>
                      <p className="text-xs">{formatDate(objectMeta.uploaded)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase text-muted-foreground font-medium">ETag</p>
                      <p className="text-xs font-mono truncate">{objectMeta.etag}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase text-muted-foreground font-medium">Size</p>
                      <p className="text-xs">{formatBytes(objectMeta.size)}</p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          ) : selectedType === "folder" && selectedObject ? (
            <div className="flex flex-col h-full">
              {/* Folder header */}
              <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <HugeiconsIcon icon={Folder01Icon} className="size-5 text-amber-500 shrink-0" strokeWidth={2} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{selectedObject.split('/').pop()}</p>
                    <p className="text-[11px] text-muted-foreground">Folder</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="h-8"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadMutation.isPending}
                >
                  <Upload className="size-4 mr-1.5" />
                  Upload here
                </Button>
              </div>

              {/* Folder content */}
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <HugeiconsIcon icon={Folder01Icon} className="size-16 text-amber-500/30 mb-3" strokeWidth={1} />
                <p className="text-sm font-medium text-foreground">{selectedObject.split('/').pop()}</p>
                <p className="text-xs mt-1">/{selectedObject}</p>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => setCreateFolderOpen(true)}
                  >
                    <FolderPlus className="size-4 mr-1.5" />
                    New subfolder
                  </Button>
                  <Button
                    size="sm"
                    className="h-8"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="size-4 mr-1.5" />
                    Upload files
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <HugeiconsIcon icon={File01Icon} className="size-12 opacity-30 mb-3" strokeWidth={1.5} />
              <p className="text-sm">Select a file to view details</p>
              <p className="text-xs mt-1">or drag & drop files to upload</p>
            </div>
          )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Create Folder Dialog */}
      <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              {currentFolderPath
                ? `Create folder in /${currentFolderPath}`
                : `Create folder in ${selectedBucket}`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="folder-name" className="text-sm font-medium">
              Folder Name
            </Label>
            <Input
              id="folder-name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="my-folder"
              className="mt-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder()
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateFolderOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
