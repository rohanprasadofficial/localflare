import * as React from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { Loading03Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

export interface Column<T> {
  key: string
  header: string
  width?: string
  align?: "left" | "center" | "right"
  render?: (value: unknown, row: T, index: number) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  emptyIcon?: IconSvgElement
  emptyTitle?: string
  emptyDescription?: string
  onRowClick?: (row: T, index: number) => void
  rowKey?: (row: T, index: number) => string | number
  actions?: (row: T, index: number) => React.ReactNode
  className?: string
}

function DataTableSkeleton({ columns }: { columns: number }) {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <tr key={i} className="border-b border-border">
          {[...Array(columns)].map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 bg-muted rounded animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  isLoading = false,
  emptyIcon,
  emptyTitle = "No data",
  emptyDescription = "No items to display",
  onRowClick,
  rowKey,
  actions,
  className,
}: DataTableProps<T>) {
  const getKey = (row: T, index: number) => {
    if (rowKey) return rowKey(row, index)
    if ("id" in row) return row.id as string | number
    return index
  }

  const getValue = (row: T, key: string) => {
    const keys = key.split(".")
    let value: unknown = row
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = (value as Record<string, unknown>)[k]
      } else {
        return undefined
      }
    }
    return value
  }

  if (isLoading) {
    return (
      <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="border-b border-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide",
                    col.align === "center" && "text-center",
                    col.align === "right" && "text-right"
                  )}
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
              {actions && <th className="px-4 py-3 w-12" />}
            </tr>
          </thead>
          <tbody className="bg-card">
            <DataTableSkeleton columns={columns.length + (actions ? 1 : 0)} />
          </tbody>
        </table>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="border-b border-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide",
                    col.align === "center" && "text-center",
                    col.align === "right" && "text-right"
                  )}
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
              {actions && <th className="px-4 py-3 w-12" />}
            </tr>
          </thead>
        </table>
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-card">
          {emptyIcon && (
            <HugeiconsIcon
              icon={emptyIcon}
              className="size-10 text-muted-foreground/50 mb-3"
              strokeWidth={1.5}
            />
          )}
          <p className="text-sm font-medium text-foreground">{emptyTitle}</p>
          <p className="text-xs text-muted-foreground mt-1">{emptyDescription}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide text-left",
                  col.align === "center" && "text-center",
                  col.align === "right" && "text-right"
                )}
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
            {actions && <th className="px-4 py-3 w-12" />}
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-border">
          {data.map((row, rowIndex) => (
            <tr
              key={getKey(row, rowIndex)}
              className={cn(
                "transition-colors",
                onRowClick && "cursor-pointer hover:bg-muted/50"
              )}
              onClick={() => onRowClick?.(row, rowIndex)}
            >
              {columns.map((col) => {
                const value = getValue(row, col.key)
                return (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-foreground",
                      col.align === "center" && "text-center",
                      col.align === "right" && "text-right"
                    )}
                  >
                    {col.render ? (
                      col.render(value, row, rowIndex)
                    ) : value === null || value === undefined ? (
                      <span className="text-muted-foreground italic">-</span>
                    ) : (
                      String(value)
                    )}
                  </td>
                )
              })}
              {actions && (
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  {actions(row, rowIndex)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function DataTableLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <HugeiconsIcon
        icon={Loading03Icon}
        className="size-6 animate-spin text-muted-foreground"
        strokeWidth={2}
      />
    </div>
  )
}
