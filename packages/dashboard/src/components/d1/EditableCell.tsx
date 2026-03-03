/**
 * Editable Cell Component
 * 
 * Inline editable cell for the data table.
 * Supports different data types and provides visual feedback.
 */

import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { cn } from '@cloudflare/kumo'
import type { D1CellValue, D1Column } from './types'

interface EditableCellProps {
  /** Current cell value */
  value: D1CellValue
  /** Column definition */
  column: D1Column
  /** Whether cell is editable */
  editable?: boolean
  /** Whether this is a primary key column */
  isPrimaryKey?: boolean
  /** Called when value changes */
  onSave: (value: D1CellValue) => void
  /** Called when edit is cancelled */
  onCancel?: () => void
}

/**
 * Format value for display
 */
function formatDisplayValue(value: D1CellValue, _type: string): string {
  if (value === null) return ''
  if (value === undefined) return ''
  
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }
  
  if (value instanceof Uint8Array) {
    return `[BLOB: ${value.length} bytes]`
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  
  return String(value)
}

/**
 * Parse input value based on column type
 */
function parseInputValue(input: string, type: string): D1CellValue {
  const upperType = type.toUpperCase()
  
  // Empty string becomes null
  if (input === '') {
    return null
  }
  
  // Integer types
  if (upperType.includes('INT')) {
    const num = parseInt(input, 10)
    return isNaN(num) ? null : num
  }
  
  // Real/float types
  if (upperType.includes('REAL') || upperType.includes('FLOAT') || upperType.includes('DOUBLE')) {
    const num = parseFloat(input)
    return isNaN(num) ? null : num
  }
  
  // Boolean (stored as integer in SQLite)
  if (upperType === 'BOOLEAN') {
    const lower = input.toLowerCase()
    if (lower === 'true' || lower === '1') return 1
    if (lower === 'false' || lower === '0') return 0
    return null
  }
  
  // Default to string
  return input
}

/**
 * Editable Cell Component
 */
export const EditableCell = memo(function EditableCell({
  value,
  column,
  editable = true,
  isPrimaryKey = false,
  onSave,
  onCancel,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  
  const displayValue = formatDisplayValue(value, column.type)
  const isNull = value === null
  const isBlob = value instanceof Uint8Array
  const isAutoIncrement = isPrimaryKey && column.type.toUpperCase() === 'INTEGER'
  
  // Cannot edit auto-increment PKs or BLOBs inline
  const canEdit = editable && !isAutoIncrement && !isBlob
  
  // Start editing
  const startEditing = useCallback(() => {
    if (!canEdit) return
    setEditValue(displayValue)
    setIsEditing(true)
  }, [canEdit, displayValue])
  
  // Save changes
  const saveChanges = useCallback(() => {
    const parsedValue = parseInputValue(editValue, column.type)
    
    // Only save if value changed
    if (parsedValue !== value) {
      onSave(parsedValue)
    }
    
    setIsEditing(false)
  }, [editValue, column.type, value, onSave])
  
  // Cancel editing
  const cancelEditing = useCallback(() => {
    setIsEditing(false)
    setEditValue('')
    onCancel?.()
  }, [onCancel])
  
  // Handle keyboard
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveChanges()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEditing()
    }
  }, [saveChanges, cancelEditing])
  
  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])
  
  // Editing mode
  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={saveChanges}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full px-2 py-1 -my-1 -mx-2',
          'bg-kumo-base border border-kumo-brand rounded',
          'text-xs font-mono',
          'focus:outline-none focus:ring-2 focus:ring-kumo-brand/20'
        )}
      />
    )
  }
  
  // Display mode
  return (
    <div
      onDoubleClick={canEdit ? startEditing : undefined}
      className={cn(
        'px-1 py-0.5 rounded text-xs font-mono truncate min-h-5',
        'transition-colors duration-100',
        canEdit && 'cursor-text hover:bg-kumo-tint/50',
        isNull && 'text-kumo-strong italic',
        isBlob && 'text-kumo-strong',
        isPrimaryKey && 'font-semibold text-kumo-brand',
      )}
      title={canEdit ? 'Double-click to edit' : undefined}
    >
      {isNull ? (
        <span className="text-kumo-inactive">NULL</span>
      ) : isBlob ? (
        <span className="text-kumo-strong">{displayValue}</span>
      ) : (
        displayValue
      )}
    </div>
  )
})

export default EditableCell
