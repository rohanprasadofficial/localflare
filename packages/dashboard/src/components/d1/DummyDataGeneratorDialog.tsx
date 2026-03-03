/**
 * Dummy Data Generator Dialog
 *
 * Simple dialog to generate and insert dummy data into a table.
 */

import { useState, useCallback } from 'react'
import { SparkleIcon } from '@phosphor-icons/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@cloudflare/kumo'
import { getColumnGeneratorDescription } from './dummy-data-generator'
import type { D1TableSchema } from './types'

interface DummyDataGeneratorDialogProps {
  /** Whether dialog is open */
  open: boolean
  /** Called when dialog open state changes */
  onOpenChange: (open: boolean) => void
  /** Table schema */
  schema: D1TableSchema
  /** Called when user wants to generate data */
  onGenerate: (count: number) => Promise<void>
  /** Whether generation is in progress */
  isGenerating?: boolean
  /** Current progress (0-count) */
  progress?: number
}

export function DummyDataGeneratorDialog({
  open,
  onOpenChange,
  schema,
  onGenerate,
  isGenerating = false,
  progress = 0,
}: DummyDataGeneratorDialogProps) {
  const [rowCount, setRowCount] = useState(10)

  const handleGenerate = useCallback(async () => {
    await onGenerate(rowCount)
  }, [onGenerate, rowCount])

  const handleRowCountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value) && value >= 1 && value <= 100) {
      setRowCount(value)
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparkleIcon size={20} className="text-kumo-brand" />
            Generate Dummy Data
          </DialogTitle>
          <DialogDescription>
            Insert random test data into <span className="font-medium text-kumo-default">{schema.name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Row count input */}
          <div className="space-y-2">
            <Label htmlFor="row-count">Number of rows to generate</Label>
            <div className="flex items-center gap-2">
              <Input
                id="row-count"
                type="number"
                min={1}
                max={100}
                value={rowCount}
                onChange={handleRowCountChange}
                disabled={isGenerating}
                className="w-24"
              />
              <span className="text-sm text-kumo-strong">(max 100)</span>
            </div>
          </div>

          {/* Column preview */}
          <div className="space-y-2">
            <Label>Data preview</Label>
            <ScrollArea className="h-48 rounded-md border">
              <div className="p-3 space-y-2">
                {schema.columns.map((col) => (
                  <div
                    key={col.name}
                    className="flex items-center justify-between text-sm py-1.5 border-b border-kumo-line last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-mono",
                        col.pk > 0 && "text-kumo-brand font-medium"
                      )}>
                        {col.name}
                      </span>
                      <span className="text-[10px] text-kumo-strong uppercase">
                        {col.type}
                      </span>
                    </div>
                    <span className="text-xs text-kumo-strong">
                      {getColumnGeneratorDescription(col, schema.foreignKeys)}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Progress indicator */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Inserting rows...</span>
                <span className="text-kumo-strong">
                  {progress} / {rowCount}
                </span>
              </div>
              <div className="h-2 bg-kumo-fill rounded-full overflow-hidden">
                <div
                  className="h-full bg-kumo-brand transition-all duration-200"
                  style={{ width: `${(progress / rowCount) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || rowCount < 1}
          >
            {isGenerating ? (
              <>Generating...</>
            ) : (
              <>
                <SparkleIcon size={16} className="mr-1.5" />
                Generate {rowCount} Row{rowCount !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
