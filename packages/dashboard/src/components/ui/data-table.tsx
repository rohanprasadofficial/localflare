import * as React from "react"
import { SpinnerIcon, type Icon } from "@phosphor-icons/react"
import { cn } from "@cloudflare/kumo"

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
  emptyIcon?: Icon
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
        <tr key={i} className="border-b border-kumo-line">
          {[...Array(columns)].map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 bg-kumo-fill rounded animate-pulse" />
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
  emptyIcon: EmptyIcon,
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
      <div className={cn("border border-kumo-line rounded-lg overflow-hidden", className)}>
        <table className="w-full text-sm">
          <thead className="bg-kumo-tint/50">
            <tr className="border-b border-kumo-line">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-xs font-medium text-kumo-strong uppercase tracking-wide",
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
          <tbody className="bg-kumo-base">
            <DataTableSkeleton columns={columns.length + (actions ? 1 : 0)} />
          </tbody>
        </table>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={cn("border border-kumo-line rounded-lg overflow-hidden", className)}>
        <table className="w-full text-sm">
          <thead className="bg-kumo-tint/50">
            <tr className="border-b border-kumo-line">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-xs font-medium text-kumo-strong uppercase tracking-wide",
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
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-kumo-base">
          {EmptyIcon && (
            <EmptyIcon size={40} className="text-kumo-subtle mb-3" />
          )}
          <p className="text-sm font-medium text-kumo-default">{emptyTitle}</p>
          <p className="text-xs text-kumo-strong mt-1">{emptyDescription}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("border border-kumo-line rounded-lg overflow-hidden", className)}>
      <table className="w-full text-sm">
        <thead className="bg-kumo-tint/50">
          <tr className="border-b border-kumo-line">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 text-xs font-medium text-kumo-strong uppercase tracking-wide text-left",
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
        <tbody className="bg-kumo-base divide-y divide-kumo-line">
          {data.map((row, rowIndex) => (
            <tr
              key={getKey(row, rowIndex)}
              className={cn(
                "transition-colors",
                onRowClick && "cursor-pointer hover:bg-kumo-tint/50"
              )}
              onClick={() => onRowClick?.(row, rowIndex)}
            >
              {columns.map((col) => {
                const value = getValue(row, col.key)
                return (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-kumo-default",
                      col.align === "center" && "text-center",
                      col.align === "right" && "text-right"
                    )}
                  >
                    {col.render ? (
                      col.render(value, row, rowIndex)
                    ) : value === null || value === undefined ? (
                      <span className="text-kumo-strong italic">-</span>
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
      <SpinnerIcon size={24} className="animate-spin text-kumo-strong" />
    </div>
  )
}
