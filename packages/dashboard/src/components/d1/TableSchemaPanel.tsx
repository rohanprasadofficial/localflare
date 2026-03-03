/**
 * Table Schema Panel Component
 * 
 * Displays detailed table schema information including:
 * - Column names, types, and constraints
 * - Primary keys and foreign keys
 * - Indexes and statistics
 */

import { useMemo } from 'react'
import {
  KeyIcon,
  DatabaseIcon,
  LinkIcon,
  HashIcon,
  TextAaIcon,
  ToggleRightIcon,
  CalendarIcon,
  FileIcon,
} from '@phosphor-icons/react'
import { cn } from '@cloudflare/kumo'
import type { D1TableSchema, D1Column } from './types'

// ============================================================================
// Types
// ============================================================================

interface TableSchemaProps {
  /** Table schema information */
  schema: D1TableSchema
  /** Additional CSS classes */
  className?: string
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Get icon for column type
 */
function getTypeIcon(type: string) {
  const upperType = type.toUpperCase()
  
  if (upperType.includes('INT')) return HashIcon
  if (upperType.includes('TEXT') || upperType.includes('VARCHAR') || upperType.includes('CHAR')) return TextAaIcon
  if (upperType.includes('REAL') || upperType.includes('FLOAT') || upperType.includes('DOUBLE')) return HashIcon
  if (upperType.includes('BOOL')) return ToggleRightIcon
  if (upperType.includes('DATE') || upperType.includes('TIME')) return CalendarIcon
  if (upperType.includes('BLOB')) return FileIcon

  return DatabaseIcon
}

/**
 * Get human-readable type label
 */
function getTypeLabel(type: string): string {
  const upperType = type.toUpperCase()
  
  if (upperType === 'INTEGER') return 'Integer'
  if (upperType === 'TEXT') return 'Text'
  if (upperType === 'REAL') return 'Real'
  if (upperType === 'BLOB') return 'Blob'
  if (upperType === 'BOOLEAN') return 'Boolean'
  if (upperType.includes('VARCHAR')) return 'Varchar'
  
  return type
}

/**
 * Get constraint badges for a column
 */
function getConstraints(column: D1Column, isPrimaryKey: boolean): string[] {
  const constraints: string[] = []
  
  if (isPrimaryKey) constraints.push('PRIMARY KEY')
  if (column.notnull) constraints.push('NOT NULL')
  if (column.dflt_value !== null) constraints.push(`DEFAULT`)
  
  return constraints
}

// ============================================================================
// Column Row Component
// ============================================================================

interface ColumnRowProps {
  column: D1Column
  isPrimaryKey: boolean
  isLast: boolean
}

function ColumnRow({ column, isPrimaryKey, isLast }: ColumnRowProps) {
  const TypeIcon = getTypeIcon(column.type)
  const constraints = getConstraints(column, isPrimaryKey)
  
  return (
    <div 
      className={cn(
        "grid grid-cols-[auto_1fr_auto] gap-3 px-4 py-3",
        "hover:bg-kumo-tint/50 transition-colors",
        !isLast && "border-b border-kumo-line"
      )}
    >
      {/* Icon */}
      <div className={cn(
        "size-8 rounded-md flex items-center justify-center shrink-0",
        isPrimaryKey ? "bg-kumo-brand/10" : "bg-kumo-fill"
      )}>
        {isPrimaryKey ? (
          <KeyIcon size={16} className="text-kumo-brand" />
        ) : (
          <TypeIcon size={16} className="text-kumo-strong" />
        )}
      </div>
      
      {/* Column info */}
      <div className="min-w-0 overflow-hidden">
        <div className="flex items-baseline gap-2">
          <span className={cn(
            "font-medium text-sm truncate",
            isPrimaryKey && "text-kumo-brand"
          )}>
            {column.name}
          </span>
          <span className="text-xs text-kumo-strong font-mono uppercase shrink-0">
            {getTypeLabel(column.type)}
          </span>
        </div>
        
        {/* Constraints */}
        {constraints.length > 0 && (
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {constraints.map(constraint => (
              <span 
                key={constraint}
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap",
                  constraint === 'PRIMARY KEY'
                    ? "bg-kumo-brand/10 text-kumo-brand"
                    : constraint === 'NOT NULL'
                    ? "bg-yellow-500/10 text-yellow-500"
                    : "bg-kumo-fill text-kumo-strong"
                )}
              >
                {constraint}
              </span>
            ))}
          </div>
        )}
      </div>
      
      {/* Default value */}
      {column.dflt_value !== null ? (
        <div className="text-right shrink-0">
          <div className="text-[10px] text-kumo-strong mb-0.5">Default</div>
          <code className="text-xs font-mono text-kumo-default bg-kumo-fill px-1.5 py-0.5 rounded inline-block max-w-32 truncate">
            {String(column.dflt_value)}
          </code>
        </div>
      ) : (
        <div />
      )}
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function TableSchemaPanel({ schema, className }: TableSchemaProps) {
  // Sort columns: primary keys first, then by position
  const sortedColumns = useMemo(() => {
    return [...schema.columns].sort((a, b) => {
      const aIsPK = schema.primaryKeys.includes(a.name)
      const bIsPK = schema.primaryKeys.includes(b.name)
      
      if (aIsPK && !bIsPK) return -1
      if (!aIsPK && bIsPK) return 1
      return a.cid - b.cid
    })
  }, [schema.columns, schema.primaryKeys])
  
  return (
    <div className={cn("border border-kumo-line rounded-lg overflow-hidden flex flex-col", className)}>
      {/* Header */}
      <div className="px-4 py-3 bg-kumo-tint/50 border-b border-kumo-line shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DatabaseIcon size={16} className="text-d1" />
            <span className="font-medium text-sm">{schema.name}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-kumo-strong">
            <span>{schema.columns.length} columns</span>
            <span>•</span>
            <span>{schema.rowCount.toLocaleString()} rows</span>
          </div>
        </div>
      </div>
      
      {/* Columns list */}
      <div className="flex-1 overflow-auto">
        <div>
          {sortedColumns.map((column, index) => (
            <ColumnRow
              key={column.name}
              column={column}
              isPrimaryKey={schema.primaryKeys.includes(column.name)}
              isLast={index === sortedColumns.length - 1}
            />
          ))}
        </div>
      </div>
      
      {/* Footer stats */}
      <div className="px-4 py-2.5 bg-kumo-tint/30 border-t border-kumo-line shrink-0">
        <div className="flex items-center gap-4 text-[10px] text-kumo-strong">
          {schema.primaryKeys.length > 0 && (
            <div className="flex items-center gap-1">
              <KeyIcon size={12} />
              <span>Primary: {schema.primaryKeys.join(', ')}</span>
            </div>
          )}
          {schema.indexes.length > 0 && (
            <div className="flex items-center gap-1">
              <LinkIcon size={12} />
              <span>{schema.indexes.length} indexes</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TableSchemaPanel
