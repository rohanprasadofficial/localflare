import { useState, useEffect, useRef, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  FolderIcon,
  FileIcon,
  ImageIcon,
  VideoIcon,
  FilePdfIcon,
  CodeIcon,
  UploadSimpleIcon,
  FolderPlusIcon,
  ArrowsClockwiseIcon,
  DownloadSimpleIcon,
  TrashIcon,
} from "@phosphor-icons/react"
import { useDataSource, useMode } from "@/datasources"
import { queryKeys } from "@/hooks"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"
import { Button, Dialog, cn } from "@cloudflare/kumo"
import { formatBytes, formatDate } from "@/lib/utils"
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
    case 'image': return ImageIcon
    case 'video': return VideoIcon
    case 'json':
    case 'code': return CodeIcon
    case 'pdf': return FilePdfIcon
    default: return FileIcon
  }
}

// Preview component
function FilePreview({ bucket, objectKey, contentType, size }: { bucket: string; objectKey: string; contentType?: string; size: number }) {
  const ds = useDataSource()
  const [textContent, setTextContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileType = getFileType(contentType, objectKey)
  const directUrl = ds.r2.getObjectUrl(bucket, objectKey)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)

  useEffect(() => {
    if ((fileType === 'text' || fileType === 'json' || fileType === 'code') && size < 1024 * 1024) {
      setLoading(true)
      setError(null)
      ds.r2.getObjectContent(bucket, objectKey)
        .then(async (response) => {
          const text = await response.text()
          setTextContent(text)
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false))
    }
  }, [bucket, objectKey, fileType, size])

  // For media types (image/video/audio), fetch via proxy and create blob URL when no direct URL
  useEffect(() => {
    // Revoke previous blob URL
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl)
      setBlobUrl(null)
    }
    if (directUrl || !['image', 'video', 'audio'].includes(fileType)) return
    let cancelled = false
    ds.r2.getObjectContent(bucket, objectKey)
      .then(async (response) => {
        const blob = await response.blob()
        if (!cancelled) setBlobUrl(URL.createObjectURL(blob))
      })
      .catch(() => {})
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucket, objectKey, fileType, directUrl])

  const objectUrl = directUrl ?? blobUrl

  if (fileType === 'image') {
    return (
      <div className="flex items-center justify-center bg-kumo-tint/30 rounded-lg p-4">
        <img
          src={objectUrl ?? ''}
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
      <div className="bg-kumo-tint/30 rounded-lg p-4">
        <video src={objectUrl ?? ''} controls className="max-w-full max-h-[300px] rounded mx-auto">
          Your browser does not support video playback.
        </video>
      </div>
    )
  }

  if (fileType === 'audio') {
    return (
      <div className="bg-kumo-tint/30 rounded-lg p-4">
        <audio src={objectUrl ?? ''} controls className="w-full">
          Your browser does not support audio playback.
        </audio>
      </div>
    )
  }

  if (fileType === 'pdf') {
    return (
      <div className="bg-kumo-tint/30 rounded-lg overflow-hidden">
        <iframe src={objectUrl ?? ''} className="w-full h-[400px] border-0" title={objectKey} />
      </div>
    )
  }

  if (fileType === 'text' || fileType === 'json' || fileType === 'code') {
    if (loading) {
      return (
        <div className="flex items-center justify-center bg-kumo-tint/30 rounded-lg p-8">
          <span className="text-kumo-strong text-sm">Loading...</span>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex items-center justify-center bg-kumo-tint/30 rounded-lg p-8">
          <span className="text-kumo-danger text-sm">Failed to load</span>
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
        <div className="bg-kumo-tint/30 rounded-lg overflow-hidden">
          <pre className="p-3 text-xs font-mono overflow-auto max-h-[300px] whitespace-pre-wrap break-all">
            {displayContent}
          </pre>
        </div>
      )
    }
  }

  return (
    <div className="flex flex-col items-center justify-center bg-kumo-tint/30 rounded-lg p-8 gap-2">
      <FileIcon size={40} className="text-kumo-subtle" />
      <p className="text-xs text-kumo-strong">Preview not available</p>
    </div>
  )
}

export function R2Explorer() {
  const ds = useDataSource()
  const { mode } = useMode()
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
    queryKey: queryKeys.r2.buckets(mode),
    queryFn: () => ds.r2.listBuckets().then(buckets => ({ buckets })),
    staleTime: 5 * 60 * 1000,
  })

  const { data: objects, isLoading: loadingObjects, refetch: refetchObjects } = useQuery({
    queryKey: queryKeys.r2.objects(mode, selectedBucket ?? ''),
    queryFn: () => selectedBucket ? ds.r2.listObjects(selectedBucket) : null,
    enabled: !!selectedBucket,
    staleTime: 2 * 60 * 1000,
  })

  const { data: objectMeta } = useQuery({
    queryKey: queryKeys.r2.objectMeta(mode, selectedBucket ?? '', selectedObject ?? ''),
    queryFn: () =>
      selectedBucket && selectedObject && selectedType === "file"
        ? ds.r2.getObjectMeta(selectedBucket, selectedObject)
        : null,
    enabled: !!selectedBucket && !!selectedObject && selectedType === "file",
    staleTime: 2 * 60 * 1000,
  })

  const deleteObjectMutation = useMutation({
    mutationFn: (key: string) => {
      if (!selectedBucket) throw new Error("No bucket selected")
      return ds.r2.deleteObject(selectedBucket, key)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.r2.objects(mode, selectedBucket ?? '') })
      setSelectedObject(null)
      setSelectedType(null)
    },
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!selectedBucket) throw new Error("No bucket selected")
      const uploadPath = currentFolderPath ? `${currentFolderPath}/${file.name}` : file.name
      return ds.r2.uploadObject(selectedBucket, uploadPath, file)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.r2.objects(mode, selectedBucket ?? '') })
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
    ds.r2.uploadObject(selectedBucket, folderPath, emptyFile).then(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.r2.objects(mode, selectedBucket ?? '') })
      setCreateFolderOpen(false)
      setNewFolderName("")
    })
  }

  const handleDownload = () => {
    if (selectedBucket && selectedObject) {
      const url = ds.r2.getObjectUrl(selectedBucket, selectedObject)
      if (!url) return
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
        <div className="animate-pulse text-kumo-strong text-sm">Loading buckets...</div>
      </div>
    )
  }

  if (!buckets?.buckets.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-kumo-strong">
        <FolderIcon size={48} className="opacity-50" />
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
        <div className="absolute inset-0 z-50 bg-kumo-brand/5 border-2 border-dashed border-kumo-brand m-2 rounded-lg flex items-center justify-center backdrop-blur-sm">
          <div className="text-center">
            <UploadSimpleIcon size={48} className="text-kumo-brand mx-auto mb-3" />
            <p className="text-lg font-medium text-kumo-brand">Drop files to upload</p>
            <p className="text-sm text-kumo-strong mt-1">
              {currentFolderPath ? `Upload to /${currentFolderPath}` : `Upload to root`}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-kumo-line bg-kumo-tint/30">
        <div className="flex items-center gap-3">
          <FolderIcon size={20} className="text-r2" />
          <div>
            <h2 className="text-sm font-semibold">R2 Storage</h2>
            <p className="text-[11px] text-kumo-strong">
              {objects?.objects?.length ?? 0} objects · {formatBytes(totalSize)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetchObjects()}
            aria-label="Refresh"
          >
            <ArrowsClockwiseIcon size={16} />
          </Button>
          {selectedBucket && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCreateFolderOpen(true)}
              >
                <FolderPlusIcon size={16} className="mr-1.5" />
                New Folder
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
              >
                <UploadSimpleIcon size={16} className="mr-1.5" />
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
      <div className="flex items-center gap-1 px-4 py-2 border-b border-kumo-line bg-kumo-base">
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
                ? "bg-kumo-brand text-white"
                : "text-kumo-strong hover:bg-kumo-tint hover:text-kumo-default"
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
          <div className="h-full flex flex-col bg-kumo-tint/20">
          {currentFolderPath && (
            <div className="px-3 py-2 border-b border-kumo-line bg-kumo-tint/30 overflow-hidden">
              <div className="flex items-center text-xs text-kumo-strong overflow-x-auto scrollbar-none">
                <button
                  onClick={() => {
                    setCurrentFolderPath("")
                    setSelectedObject(null)
                    setSelectedType(null)
                  }}
                  className="hover:text-kumo-default shrink-0"
                >
                  {selectedBucket}
                </button>
                {currentFolderPath.split("/").map((part, i, arr) => (
                  <span key={i} className="flex items-center shrink-0">
                    <span className="mx-1 text-kumo-subtle">/</span>
                    <button
                      onClick={() => {
                        const newPath = arr.slice(0, i + 1).join("/")
                        setCurrentFolderPath(newPath)
                        setSelectedObject(newPath)
                        setSelectedType("folder")
                      }}
                      className="hover:text-kumo-default max-w-[100px] truncate"
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
              <div className="flex items-center justify-center py-8 text-kumo-strong text-sm">
                Loading...
              </div>
            ) : objects?.objects?.length ? (
              <FileTree
                objects={objects.objects.map((obj) => ({ key: obj.key, size: obj.size }))}
                selectedPath={selectedObject}
                onSelect={handleTreeSelect}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-kumo-strong">
                <FolderIcon size={40} className="opacity-30 mb-2" />
                <p className="text-xs">Empty bucket</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-xs"
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
          <div className="h-full flex flex-col bg-kumo-base">
          {selectedType === "file" && selectedObject && objectMeta ? (
            <div className="flex flex-col h-full">
              {/* File header */}
              <div className="px-4 py-3 border-b border-kumo-line flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  {(() => {
                    const IconComponent = getFileIcon(objectMeta.httpMetadata?.contentType, selectedObject)
                    return <IconComponent size={20} className="text-kumo-strong shrink-0" />
                  })()}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{selectedObject.split('/').pop()}</p>
                    <p className="text-[11px] text-kumo-strong">
                      {formatBytes(objectMeta.size)} · {objectMeta.httpMetadata?.contentType || 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="secondary" size="sm" onClick={handleDownload}>
                    <DownloadSimpleIcon size={16} className="mr-1.5" />
                    Download
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteObjectMutation.mutate(selectedObject)}
                    disabled={deleteObjectMutation.isPending}
                  >
                    <TrashIcon size={16} className="mr-1.5" />
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
                      <p className="text-[10px] uppercase text-kumo-strong font-medium">Path</p>
                      <p className="text-xs font-mono break-all">{selectedObject}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase text-kumo-strong font-medium">Uploaded</p>
                      <p className="text-xs">{formatDate(objectMeta.uploaded)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase text-kumo-strong font-medium">ETag</p>
                      <p className="text-xs font-mono truncate">{objectMeta.etag}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase text-kumo-strong font-medium">Size</p>
                      <p className="text-xs">{formatBytes(objectMeta.size)}</p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          ) : selectedType === "folder" && selectedObject ? (
            <div className="flex flex-col h-full">
              {/* Folder header */}
              <div className="px-4 py-3 border-b border-kumo-line flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <FolderIcon size={20} className="text-amber-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{selectedObject.split('/').pop()}</p>
                    <p className="text-[11px] text-kumo-strong">Folder</p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadMutation.isPending}
                >
                  <UploadSimpleIcon size={16} className="mr-1.5" />
                  Upload here
                </Button>
              </div>

              {/* Folder content */}
              <div className="flex-1 flex flex-col items-center justify-center text-kumo-strong">
                <FolderIcon size={64} className="text-amber-500/30 mb-3" />
                <p className="text-sm font-medium text-kumo-default">{selectedObject.split('/').pop()}</p>
                <p className="text-xs mt-1">/{selectedObject}</p>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCreateFolderOpen(true)}
                  >
                    <FolderPlusIcon size={16} className="mr-1.5" />
                    New subfolder
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadSimpleIcon size={16} className="mr-1.5" />
                    Upload files
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-kumo-strong">
              <FileIcon size={48} className="opacity-30 mb-3" />
              <p className="text-sm">Select a file to view details</p>
              <p className="text-xs mt-1">or drag & drop files to upload</p>
            </div>
          )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Create Folder Dialog */}
      <Dialog.Root open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
        <Dialog size="base" className="p-6">
          <Dialog.Title className="text-lg font-semibold text-kumo-default">Create New Folder</Dialog.Title>
          <Dialog.Description className="text-sm text-kumo-strong mt-1">
            {currentFolderPath
              ? `Create folder in /${currentFolderPath}`
              : `Create folder in ${selectedBucket}`}
          </Dialog.Description>
          <div className="py-4 mt-4">
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
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-kumo-line">
            <Dialog.Close render={(props) => <Button variant="secondary" {...props}>Cancel</Button>} />
            <Button variant="primary" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Create
            </Button>
          </div>
        </Dialog>
      </Dialog.Root>
    </div>
  )
}
