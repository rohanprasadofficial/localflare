import { useState, useRef, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Folder01Icon,
  Delete02Icon,
  File01Icon,
  Download01Icon,
  Upload01Icon,
  FolderAddIcon,
} from "@hugeicons/core-free-icons"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PageHeader } from "@/components/ui/page-header"
import { StatsCard, StatsCardGroup } from "@/components/ui/stats-card"
import { SearchInput } from "@/components/ui/search-input"
import { EmptyState } from "@/components/ui/empty-state"
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
import { r2Api, R2_BUCKETS, type R2Object, type R2BucketName } from "@/lib/api"
import { formatBytes, formatDate } from "@/lib/utils"
import { FileTree } from "./FileTree"

export default function R2Explorer() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const [selectedBucket, setSelectedBucket] = useState<R2BucketName>('files')
  const [prefix, setPrefix] = useState("")
  const [selectedFile, setSelectedFile] = useState<R2Object | null>(null)
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<"file" | "folder" | null>(null)
  const [currentFolderPath, setCurrentFolderPath] = useState<string>("")
  const [isDragging, setIsDragging] = useState(false)
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")

  const currentBucket = R2_BUCKETS.find(b => b.id === selectedBucket)!

  const { data: files, isLoading } = useQuery({
    queryKey: ["files", selectedBucket, prefix],
    queryFn: () => r2Api.listFiles(selectedBucket, prefix || undefined),
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const uploadPath = currentFolderPath
        ? `${currentFolderPath}/${file.name}`
        : file.name
      return r2Api.uploadFile(selectedBucket, uploadPath, file)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", selectedBucket] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (key: string) => r2Api.deleteFile(selectedBucket, key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", selectedBucket] })
      setSelectedFile(null)
      setSelectedPath(null)
      setSelectedType(null)
    },
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles) {
      for (const file of Array.from(selectedFiles)) {
        uploadMutation.mutate(file)
      }
    }
    e.target.value = ''
  }

  const handleFileDrop = useCallback((droppedFiles: FileList) => {
    for (const file of Array.from(droppedFiles)) {
      uploadMutation.mutate(file)
    }
  }, [uploadMutation])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

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
    if (!newFolderName.trim()) return

    const folderPath = currentFolderPath
      ? `${currentFolderPath}/${newFolderName.trim()}/.keep`
      : `${newFolderName.trim()}/.keep`

    const emptyFile = new File([''], '.keep', { type: 'text/plain' })
    r2Api.uploadFile(selectedBucket, folderPath, emptyFile).then(() => {
      queryClient.invalidateQueries({ queryKey: ["files", selectedBucket] })
      setCreateFolderOpen(false)
      setNewFolderName("")
    })
  }

  const handleDownload = (key: string) => {
    window.open(r2Api.downloadFile(selectedBucket, key), "_blank")
  }

  const handleBucketChange = (bucket: R2BucketName) => {
    setSelectedBucket(bucket)
    setSelectedFile(null)
    setSelectedPath(null)
    setSelectedType(null)
    setCurrentFolderPath("")
    setPrefix("")
  }

  const handleTreeSelect = (path: string, type: "file" | "folder") => {
    setSelectedPath(path)
    setSelectedType(type)
    if (type === "folder") {
      setCurrentFolderPath(path)
      setSelectedFile(null)
    } else {
      // Find the file object
      const file = files?.objects?.find(f => f.key === path)
      setSelectedFile(file || null)
      // Set current folder to parent
      const parts = path.split("/")
      if (parts.length > 1) {
        setCurrentFolderPath(parts.slice(0, -1).join("/"))
      } else {
        setCurrentFolderPath("")
      }
    }
  }

  const totalSize = files?.objects?.reduce((acc, f) => acc + f.size, 0) ?? 0

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <PageHeader
          icon={Folder01Icon}
          iconColor="text-r2"
          title="R2 Storage"
          description="Object storage for files and assets"
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateFolderOpen(true)}
              >
                <HugeiconsIcon icon={FolderAddIcon} className="size-4 mr-1.5" strokeWidth={2} />
                New Folder
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                multiple
              />
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
              >
                <HugeiconsIcon icon={Upload01Icon} className="size-4 mr-1.5" strokeWidth={2} />
                {uploadMutation.isPending
                  ? "Uploading..."
                  : currentFolderPath
                    ? `Upload to /${currentFolderPath}`
                    : "Upload File"}
              </Button>
            </div>
          }
        />

        {/* Bucket Selector */}
        <div className="mt-4">
          <label className="text-xs font-medium text-muted-foreground uppercase mb-2 block">
            Select Bucket
          </label>
          <div className="flex gap-2">
            {R2_BUCKETS.map((bucket) => (
              <button
                key={bucket.id}
                onClick={() => handleBucketChange(bucket.id)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  selectedBucket === bucket.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:bg-muted text-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={Folder01Icon} className="size-4" strokeWidth={2} />
                  {bucket.name}
                </div>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {currentBucket.description}
          </p>
        </div>

        {/* Stats */}
        <StatsCardGroup className="mt-6">
          <StatsCard
            icon={File01Icon}
            iconColor="text-r2"
            label="Objects"
            value={files?.objects?.length ?? 0}
            description={`in ${currentBucket.name}`}
          />
          <StatsCard
            icon={Folder01Icon}
            iconColor="text-muted-foreground"
            label="Total Size"
            value={formatBytes(totalSize)}
          />
        </StatsCardGroup>
      </div>

      <div
        ref={dropZoneRef}
        className="flex-1 flex min-h-0 relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-50 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center backdrop-blur-sm">
            <div className="text-center">
              <Upload className="size-12 text-primary mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-lg font-medium text-primary">Drop files to upload</p>
              <p className="text-sm text-muted-foreground mt-1">
                {currentFolderPath ? `to /${currentFolderPath}` : `to ${currentBucket.name}`}
              </p>
            </div>
          </div>
        )}

        {/* File Tree */}
        <div className="w-80 border-r border-border flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-border">
            <SearchInput
              value={prefix}
              onChange={setPrefix}
              placeholder="Filter by prefix..."
            />
          </div>

          {/* Tree View */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground text-sm">Loading...</div>
            ) : files?.objects?.length ? (
              <div className="p-2">
                <FileTree
                  objects={files.objects.map(obj => ({
                    key: obj.key,
                    size: obj.size,
                  }))}
                  selectedPath={selectedPath}
                  onSelect={handleTreeSelect}
                />
              </div>
            ) : (
              <EmptyState
                icon={File01Icon}
                title="No files found"
                description={prefix ? "No files match your filter" : `Upload a file to ${currentBucket.name}`}
                action={{
                  label: "Upload File",
                  onClick: () => fileInputRef.current?.click(),
                }}
              />
            )}
          </ScrollArea>
        </div>

        {/* File Details / Folder Details */}
        <div className="flex-1 flex flex-col bg-muted/30">
          {selectedType === "file" && selectedFile ? (
            <>
              <div className="p-4 border-b border-border">
                <h3 className="text-sm font-semibold">File Details</h3>
                <p className="text-xs text-muted-foreground mt-0.5">in {currentBucket.name}</p>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Key</p>
                    <p className="text-sm font-mono break-all">{selectedFile.key}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Size</p>
                    <p className="text-sm">{formatBytes(selectedFile.size)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Uploaded</p>
                    <p className="text-sm">{formatDate(selectedFile.uploaded)}</p>
                  </div>
                  <div className="pt-4 flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(selectedFile.key)}
                    >
                      <HugeiconsIcon icon={Download01Icon} className="size-4 mr-1.5" strokeWidth={2} />
                      Download
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteMutation.mutate(selectedFile.key)}
                      disabled={deleteMutation.isPending}
                    >
                      <HugeiconsIcon icon={Delete02Icon} className="size-4 mr-1.5" strokeWidth={2} />
                      Delete
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : selectedType === "folder" && selectedPath ? (
            <>
              <div className="p-4 border-b border-border">
                <h3 className="text-sm font-semibold">Folder Details</h3>
                <p className="text-xs text-muted-foreground mt-0.5">in {currentBucket.name}</p>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <HugeiconsIcon icon={Folder01Icon} className="size-16 text-r2/50 mb-4" strokeWidth={1.5} />
                <p className="text-sm font-medium">{selectedPath.split("/").pop()}</p>
                <p className="text-xs text-muted-foreground mt-1">/{selectedPath}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadMutation.isPending}
                >
                  <HugeiconsIcon icon={Upload01Icon} className="size-4 mr-1.5" strokeWidth={2} />
                  Upload to this folder
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <HugeiconsIcon icon={File01Icon} className="size-12 mx-auto mb-2 opacity-50" strokeWidth={1.5} />
                <p className="text-sm">Select a file to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Folder Dialog */}
      <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              {currentFolderPath
                ? `Create a new folder inside /${currentFolderPath}`
                : `Create a new folder in ${currentBucket.name}`}
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
                if (e.key === 'Enter') {
                  handleCreateFolder()
                }
              }}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Folder names should not contain special characters like / or \
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateFolderOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              <HugeiconsIcon icon={FolderAddIcon} className="size-4 mr-2" strokeWidth={2} />
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
