import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Folder01Icon,
  File01Icon,
  Delete02Icon,
  Download01Icon,
  Image01Icon,
  Video01Icon,
  FileAttachmentIcon,
  CodeIcon,
} from "@hugeicons/core-free-icons"
import { r2Api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PageHeader } from "@/components/ui/page-header"
import { StatsCard, StatsCardGroup } from "@/components/ui/stats-card"
import { SearchInput } from "@/components/ui/search-input"
import { EmptyState } from "@/components/ui/empty-state"
import { cn, formatBytes, formatDate } from "@/lib/utils"

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
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h'].includes(ext)) return 'code'
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

  // Load text/json content
  useEffect(() => {
    if ((fileType === 'text' || fileType === 'json' || fileType === 'code') && size < 1024 * 1024) { // < 1MB
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

  // Image preview
  if (fileType === 'image') {
    return (
      <div className="flex items-center justify-center bg-muted/30 rounded-lg p-4 min-h-[200px]">
        <img
          src={objectUrl}
          alt={objectKey}
          className="max-w-full max-h-[400px] object-contain rounded"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      </div>
    )
  }

  // Video preview
  if (fileType === 'video') {
    return (
      <div className="flex items-center justify-center bg-muted/30 rounded-lg p-4">
        <video
          src={objectUrl}
          controls
          className="max-w-full max-h-[400px] rounded"
        >
          Your browser does not support video playback.
        </video>
      </div>
    )
  }

  // Audio preview
  if (fileType === 'audio') {
    return (
      <div className="flex items-center justify-center bg-muted/30 rounded-lg p-4">
        <audio src={objectUrl} controls className="w-full max-w-md">
          Your browser does not support audio playback.
        </audio>
      </div>
    )
  }

  // PDF preview (iframe)
  if (fileType === 'pdf') {
    return (
      <div className="bg-muted/30 rounded-lg overflow-hidden">
        <iframe
          src={objectUrl}
          className="w-full h-[500px] border-0"
          title={objectKey}
        />
      </div>
    )
  }

  // Text/JSON/Code preview
  if (fileType === 'text' || fileType === 'json' || fileType === 'code') {
    if (loading) {
      return (
        <div className="flex items-center justify-center bg-muted/30 rounded-lg p-8 min-h-[200px]">
          <span className="text-muted-foreground">Loading content...</span>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex items-center justify-center bg-muted/30 rounded-lg p-8 min-h-[200px]">
          <span className="text-destructive">Failed to load: {error}</span>
        </div>
      )
    }

    if (textContent !== null) {
      const isJson = fileType === 'json'
      let displayContent = textContent

      // Pretty print JSON
      if (isJson) {
        try {
          displayContent = JSON.stringify(JSON.parse(textContent), null, 2)
        } catch {
          // Keep original if not valid JSON
        }
      }

      return (
        <div className="bg-muted/30 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50">
            <span className="text-xs font-medium text-muted-foreground">
              {fileType === 'json' ? 'JSON' : fileType === 'code' ? 'Code' : 'Text'} Preview
            </span>
            <span className="text-xs text-muted-foreground">{formatBytes(size)}</span>
          </div>
          <pre className="p-4 text-xs font-mono overflow-auto max-h-[400px] whitespace-pre-wrap break-all">
            {isJson ? <JsonHighlight json={displayContent} /> : displayContent}
          </pre>
        </div>
      )
    }
  }

  // No preview available
  return (
    <div className="flex flex-col items-center justify-center bg-muted/30 rounded-lg p-8 min-h-[200px] gap-3">
      <HugeiconsIcon icon={File01Icon} className="size-12 text-muted-foreground/50" strokeWidth={1.5} />
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Preview not available</p>
        <p className="text-xs text-muted-foreground mt-1">{contentType || 'Unknown type'}</p>
      </div>
    </div>
  )
}

// Simple JSON syntax highlighting
function JsonHighlight({ json }: { json: string }) {
  const highlighted = json
    .replace(/"([^"]+)":/g, '<span class="text-purple-400">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span class="text-green-400">"$1"</span>')
    .replace(/: (\d+)/g, ': <span class="text-orange-400">$1</span>')
    .replace(/: (true|false)/g, ': <span class="text-blue-400">$1</span>')
    .replace(/: (null)/g, ': <span class="text-gray-400">$1</span>')

  return <span dangerouslySetInnerHTML={{ __html: highlighted }} />
}

export function R2Explorer() {
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null)
  const [selectedObject, setSelectedObject] = useState<string | null>(null)
  const [searchPrefix, setSearchPrefix] = useState("")

  const queryClient = useQueryClient()

  const { data: buckets, isLoading: loadingBuckets } = useQuery({
    queryKey: ["r2-buckets"],
    queryFn: r2Api.list,
  })

  const { data: objects, isLoading: loadingObjects } = useQuery({
    queryKey: ["r2-objects", selectedBucket, searchPrefix],
    queryFn: () =>
      selectedBucket
        ? r2Api.getObjects(selectedBucket, searchPrefix || undefined)
        : null,
    enabled: !!selectedBucket,
  })

  const { data: objectMeta } = useQuery({
    queryKey: ["r2-object-meta", selectedBucket, selectedObject],
    queryFn: () =>
      selectedBucket && selectedObject
        ? r2Api.getObjectMeta(selectedBucket, selectedObject)
        : null,
    enabled: !!selectedBucket && !!selectedObject,
  })

  const deleteObjectMutation = useMutation({
    mutationFn: (key: string) => {
      if (!selectedBucket) throw new Error("No bucket selected")
      return r2Api.deleteObject(selectedBucket, key)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["r2-objects", selectedBucket] })
      setSelectedObject(null)
    },
  })

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

  if (loadingBuckets) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading buckets...</div>
      </div>
    )
  }

  if (!buckets?.buckets.length) {
    return (
      <div className="p-6">
        <PageHeader
          icon={Folder01Icon}
          iconColor="text-r2"
          title="R2 Buckets"
          description="Manage your R2 object storage"
        />
        <EmptyState
          icon={Folder01Icon}
          title="No R2 buckets configured"
          description="Add an R2 bucket binding to your wrangler.toml to get started"
          className="mt-8"
        />
      </div>
    )
  }

  const objectCount = objects?.objects?.length ?? 0

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <PageHeader
          icon={Folder01Icon}
          iconColor="text-r2"
          title="R2 Buckets"
          description="Manage your R2 object storage"
        />

        {/* Stats */}
        <StatsCardGroup className="mt-6">
          <StatsCard
            icon={Folder01Icon}
            iconColor="text-r2"
            label="Buckets"
            value={buckets.buckets.length}
          />
          <StatsCard
            icon={File01Icon}
            iconColor="text-muted-foreground"
            label="Objects"
            value={objectCount}
            description={selectedBucket ? `in ${selectedBucket}` : "Select a bucket"}
          />
        </StatsCardGroup>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Bucket List */}
        <div className="w-56 border-r border-border flex flex-col bg-muted/30">
          <div className="p-3 border-b border-border">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Buckets
            </span>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {buckets.buckets.map((bucket) => (
                <button
                  key={bucket.binding}
                  onClick={() => {
                    setSelectedBucket(bucket.binding)
                    setSelectedObject(null)
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors",
                    selectedBucket === bucket.binding
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <HugeiconsIcon
                    icon={Folder01Icon}
                    className={cn("size-4", selectedBucket === bucket.binding && "text-r2")}
                    strokeWidth={2}
                  />
                  {bucket.binding}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Objects List */}
        <div className="w-72 border-r border-border flex flex-col bg-muted/10">
          {selectedBucket ? (
            <>
              <div className="p-3 border-b border-border">
                <SearchInput
                  value={searchPrefix}
                  onChange={setSearchPrefix}
                  placeholder="Filter by prefix..."
                  className="h-8"
                />
              </div>
              <ScrollArea className="flex-1">
                {loadingObjects ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">Loading objects...</div>
                ) : objects?.objects?.length ? (
                  <div className="p-2 space-y-0.5">
                    {objects.objects.map((obj) => {
                      const FileIcon = getFileIcon(undefined, obj.key)
                      return (
                        <button
                          key={obj.key}
                          onClick={() => setSelectedObject(obj.key)}
                          className={cn(
                            "w-full text-left px-3 py-2.5 rounded-md transition-colors group",
                            selectedObject === obj.key
                              ? "bg-sidebar-accent"
                              : "hover:bg-muted"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <HugeiconsIcon
                              icon={FileIcon}
                              className={cn(
                                "size-3.5 shrink-0",
                                selectedObject === obj.key ? "text-r2" : "text-muted-foreground"
                              )}
                              strokeWidth={2}
                            />
                            <span
                              className={cn(
                                "font-mono text-xs truncate",
                                selectedObject === obj.key ? "font-medium" : "text-muted-foreground"
                              )}
                            >
                              {obj.key}
                            </span>
                          </div>
                          <div className="mt-1 ml-5.5 text-[10px] text-muted-foreground">
                            {formatBytes(obj.size)}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      {searchPrefix ? "No objects match your search" : "This bucket is empty"}
                    </p>
                  </div>
                )}
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <p className="text-sm text-muted-foreground text-center">
                Select a bucket
              </p>
            </div>
          )}
        </div>

        {/* Preview Panel */}
        <div className="flex-1 flex flex-col min-w-0 bg-background">
          {selectedObject && objectMeta ? (
            <div className="flex flex-col h-full">
              {/* Object Header */}
              <div className="px-6 py-4 border-b border-border flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon
                      icon={getFileIcon(objectMeta.httpMetadata?.contentType, selectedObject)}
                      className="size-4 text-r2 shrink-0"
                      strokeWidth={2}
                    />
                    <h3 className="font-mono text-sm font-semibold truncate">{selectedObject}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 ml-6">
                    {formatBytes(objectMeta.size)} • {objectMeta.httpMetadata?.contentType || 'Unknown type'} • {formatDate(objectMeta.uploaded)}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <HugeiconsIcon icon={Download01Icon} className="size-4 mr-1.5" strokeWidth={2} />
                    Download
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteObjectMutation.mutate(selectedObject)}
                    disabled={deleteObjectMutation.isPending}
                  >
                    <HugeiconsIcon icon={Delete02Icon} className="size-4 mr-1.5" strokeWidth={2} />
                    Delete
                  </Button>
                </div>
              </div>

              {/* Preview */}
              <div className="flex-1 overflow-auto p-6">
                <FilePreview
                  bucket={selectedBucket!}
                  objectKey={selectedObject}
                  contentType={objectMeta.httpMetadata?.contentType}
                  size={objectMeta.size}
                />

                {/* Metadata */}
                <div className="mt-6">
                  <h5 className="text-xs font-medium text-muted-foreground mb-2">Metadata</h5>
                  <div className="p-3 rounded-md bg-muted/50 font-mono text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ETag</span>
                      <span>{objectMeta.etag}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Content-Type</span>
                      <span>{objectMeta.httpMetadata?.contentType || "application/octet-stream"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Size</span>
                      <span>{formatBytes(objectMeta.size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Uploaded</span>
                      <span>{formatDate(objectMeta.uploaded)}</span>
                    </div>
                  </div>

                  {objectMeta.customMetadata && Object.keys(objectMeta.customMetadata).length > 0 && (
                    <>
                      <h5 className="text-xs font-medium text-muted-foreground mb-2 mt-4">Custom Metadata</h5>
                      <div className="p-3 rounded-md bg-muted/50 font-mono text-xs space-y-1.5">
                        {Object.entries(objectMeta.customMetadata).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground">{key}</span>
                            <span>{value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : selectedBucket ? (
            <EmptyState
              icon={File01Icon}
              title="Select a file"
              description="Choose a file from the list to preview"
            />
          ) : (
            <EmptyState
              icon={Folder01Icon}
              title="Select a bucket"
              description="Choose a bucket from the sidebar to browse objects"
            />
          )}
        </div>
      </div>
    </div>
  )
}
