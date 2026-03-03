/**
 * Row Editor Dialog Component
 * 
 * Modal dialog for creating and editing table rows.
 * Auto-generates form fields based on table schema.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { PlusIcon, PencilSimpleIcon, KeyIcon } from '@phosphor-icons/react'
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
import type { D1Row, D1CellValue, D1TableSchema, D1Column } from './types'

// ============================================================================
// Types
// ============================================================================

interface RowEditorDialogProps {
  /** Whether dialog is open */
  open: boolean
  /** Called when dialog open state changes */
  onOpenChange: (open: boolean) => void
  /** Table schema for form generation */
  schema: D1TableSchema
  /** Existing row data for edit mode (null for create) */
  row?: D1Row | null
  /** Called when row is saved */
  onSave: (data: Record<string, D1CellValue>) => void
  /** Whether save is in progress */
  isSaving?: boolean
}

// ============================================================================
// Field Component
// ============================================================================

interface FormFieldProps {
  column: D1Column
  value: D1CellValue
  onChange: (value: D1CellValue) => void
  isPrimaryKey: boolean
  isAutoIncrement: boolean
  disabled?: boolean
  error?: string
}

function FormField({
  column,
  value,
  onChange,
  isPrimaryKey,
  isAutoIncrement,
  disabled = false,
  error,
}: FormFieldProps) {
  const upperType = column.type.toUpperCase()
  const isRequired = column.notnull === 1 && column.dflt_value === null
  const inputDisabled = disabled || (isAutoIncrement && !value)
  
  // Determine input type
  const inputType = useMemo(() => {
    if (upperType.includes('INT')) return 'number'
    if (upperType.includes('REAL') || upperType.includes('FLOAT') || upperType.includes('DOUBLE')) return 'number'
    if (upperType === 'BOOLEAN') return 'checkbox'
    return 'text'
  }, [upperType])
  
  // Format value for input
  const inputValue = useMemo(() => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'boolean') return value
    return String(value)
  }, [value])
  
  // Handle change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement
    
    if (inputType === 'checkbox') {
      onChange(target.checked ? 1 : 0)
      return
    }
    
    const newValue = target.value
    
    if (newValue === '') {
      onChange(null)
      return
    }
    
    if (inputType === 'number') {
      const num = upperType.includes('INT') 
        ? parseInt(newValue, 10) 
        : parseFloat(newValue)
      onChange(isNaN(num) ? null : num)
      return
    }
    
    onChange(newValue)
  }, [inputType, upperType, onChange])
  
  // Handle NULL toggle
  const handleNullToggle = useCallback(() => {
    onChange(value === null ? '' : null)
  }, [value, onChange])
  
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label 
          htmlFor={column.name}
          className={cn(
            "text-xs font-medium flex items-center gap-1.5",
            isPrimaryKey && "text-kumo-brand"
          )}
        >
          {isPrimaryKey && (
            <KeyIcon size={12} />
          )}
          {column.name}
          {isRequired && <span className="text-kumo-danger">*</span>}
        </Label>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-kumo-strong uppercase">
            {column.type}
          </span>
          {!isRequired && (
            <button
              type="button"
              onClick={handleNullToggle}
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded",
                "transition-colors",
                value === null
                  ? "bg-yellow-500/20 text-yellow-500"
                  : "bg-kumo-fill text-kumo-strong hover:bg-kumo-fill"
              )}
            >
              NULL
            </button>
          )}
        </div>
      </div>
      
      {inputType === 'checkbox' ? (
        <div className="flex items-center gap-2 py-2">
          <input
            type="checkbox"
            id={column.name}
            checked={!!value}
            onChange={handleChange}
            disabled={inputDisabled}
            className="rounded border-kumo-line"
          />
          <span className="text-xs text-kumo-strong">
            {value ? 'true (1)' : 'false (0)'}
          </span>
        </div>
      ) : upperType === 'TEXT' && !column.name.toLowerCase().includes('id') ? (
        <textarea
          id={column.name}
          value={value === null ? '' : String(inputValue)}
          onChange={handleChange}
          disabled={inputDisabled}
          placeholder={value === null ? 'NULL' : isAutoIncrement ? 'Auto-generated' : ''}
          rows={2}
          className={cn(
            "w-full px-3 py-2 rounded-md border border-kumo-line bg-kumo-base",
            "text-sm font-mono",
            "placeholder:text-kumo-subtle",
            "focus:outline-none focus:ring-2 focus:ring-kumo-ring focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            value === null && "italic text-kumo-strong",
            error && "border-kumo-danger focus:ring-kumo-danger"
          )}
        />
      ) : (
        <Input
          type={inputType}
          id={column.name}
          value={value === null ? '' : String(inputValue)}
          onChange={handleChange}
          disabled={inputDisabled}
          placeholder={value === null ? 'NULL' : isAutoIncrement ? 'Auto-generated' : ''}
          className={cn(
            "font-mono text-sm",
            value === null && "italic",
            error && "border-kumo-danger focus:ring-kumo-danger"
          )}
        />
      )}

      {error && (
        <p className="text-xs text-kumo-danger">{error}</p>
      )}
      
      {column.dflt_value !== null && (
        <p className="text-[10px] text-kumo-strong">
          Default: {String(column.dflt_value)}
        </p>
      )}
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function RowEditorDialog({
  open,
  onOpenChange,
  schema,
  row,
  onSave,
  isSaving = false,
}: RowEditorDialogProps) {
  const isEditing = !!row
  
  // Form state
  const [formData, setFormData] = useState<Record<string, D1CellValue>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // SQL expression defaults that should be handled by SQLite, not us
  const sqlExpressionDefaults = [
    'CURRENT_TIMESTAMP', 'CURRENT_DATE', 'CURRENT_TIME',
    'DATETIME', 'DATE', 'TIME', 'STRFTIME',
    '(', // Any expression starting with parenthesis
  ]
  
  const isSqlExpression = useCallback((defaultValue: unknown): boolean => {
    if (defaultValue === null || defaultValue === undefined) return false
    const strValue = String(defaultValue).toUpperCase().trim()
    return sqlExpressionDefaults.some(expr => strValue.startsWith(expr))
  }, [])
  
  /**
   * Parse SQLite default value to get the actual value
   * SQLite stores defaults with SQL syntax:
   * - Strings: 'user' or "user"
   * - Numbers: 123 or 45.67
   * - NULL: NULL
   * - Expressions: CURRENT_TIMESTAMP, (datetime('now')), etc.
   */
  const parseDefaultValue = useCallback((defaultValue: unknown, columnType: string): D1CellValue => {
    if (defaultValue === null || defaultValue === undefined) return null
    
    const strValue = String(defaultValue).trim()
    const upperType = columnType.toUpperCase()
    
    // Check for SQL expressions - don't parse these
    if (isSqlExpression(defaultValue)) return null
    
    // Check for quoted strings: 'value' or "value"
    if ((strValue.startsWith("'") && strValue.endsWith("'")) ||
        (strValue.startsWith('"') && strValue.endsWith('"'))) {
      // Remove quotes and return the inner string
      return strValue.slice(1, -1)
    }
    
    // Check for NULL
    if (strValue.toUpperCase() === 'NULL') return null
    
    // Check for numeric types
    if (upperType.includes('INT')) {
      const num = parseInt(strValue, 10)
      return isNaN(num) ? strValue : num
    }
    
    if (upperType.includes('REAL') || upperType.includes('FLOAT') || upperType.includes('DOUBLE')) {
      const num = parseFloat(strValue)
      return isNaN(num) ? strValue : num
    }
    
    // Return as-is for other cases
    return strValue
  }, [isSqlExpression])
  
  // Initialize form data when row changes
  useEffect(() => {
    if (row) {
      // Edit mode: populate with existing values
      setFormData({ ...row } as Record<string, D1CellValue>)
    } else {
      // Create mode: initialize with defaults
      const defaults: Record<string, D1CellValue> = {}
      for (const col of schema.columns) {
        // Don't pre-fill SQL expression defaults - leave empty so SQLite handles them
        if (col.dflt_value !== null && !isSqlExpression(col.dflt_value)) {
          // Parse the default value to get actual value (strip quotes, etc.)
          defaults[col.name] = parseDefaultValue(col.dflt_value, col.type)
        } else if (col.notnull === 0 || col.dflt_value !== null) {
          defaults[col.name] = null
        } else {
          defaults[col.name] = ''
        }
      }
      setFormData(defaults)
    }
    setErrors({})
  }, [row, schema.columns, open, isSqlExpression, parseDefaultValue])
  
  // Update field value
  const updateField = useCallback((columnName: string, value: D1CellValue) => {
    setFormData(prev => ({ ...prev, [columnName]: value }))
    // Clear error when field is updated
    setErrors(prev => {
      const next = { ...prev }
      delete next[columnName]
      return next
    })
  }, [])
  
  // Validate form
  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}
    
    for (const col of schema.columns) {
      const value = formData[col.name]
      const isAutoIncrement = schema.primaryKeys.includes(col.name) && 
        col.type.toUpperCase() === 'INTEGER'
      
      // Skip auto-increment PKs for new rows
      if (isAutoIncrement && !isEditing) continue
      
      // Check required fields
      if (col.notnull === 1 && col.dflt_value === null) {
        if (value === null || value === undefined || value === '') {
          newErrors[col.name] = 'This field is required'
        }
      }
      
      // Type validation
      const upperType = col.type.toUpperCase()
      if (value !== null && value !== '' && value !== undefined) {
        if (upperType.includes('INT')) {
          if (typeof value !== 'number' || !Number.isInteger(value)) {
            const parsed = parseInt(String(value), 10)
            if (isNaN(parsed)) {
              newErrors[col.name] = 'Must be an integer'
            }
          }
        }
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, schema, isEditing])
  
  // Handle save
  const handleSave = useCallback(() => {
    if (!validate()) return
    
    // Prepare data for save
    const saveData: Record<string, D1CellValue> = {}
    
    for (const col of schema.columns) {
      const isAutoIncrement = schema.primaryKeys.includes(col.name) && 
        col.type.toUpperCase() === 'INTEGER'
      
      // Skip auto-increment PKs for new rows
      if (isAutoIncrement && !isEditing) continue
      
      // For new rows, skip columns with SQL expression defaults if value is empty/null
      if (!isEditing && col.dflt_value !== null && isSqlExpression(col.dflt_value)) {
        const currentValue = formData[col.name]
        // If value is empty or null, let SQLite use the default
        if (currentValue === '' || currentValue === null || currentValue === undefined) {
          continue
        }
      }
      
      saveData[col.name] = formData[col.name]
    }
    
    onSave(saveData)
  }, [validate, formData, schema, isEditing, onSave, isSqlExpression])
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? <PencilSimpleIcon size={20} /> : <PlusIcon size={20} />}
            {isEditing ? 'Edit Row' : 'Add Row'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? `Editing row in ${schema.name}` 
              : `Add a new row to ${schema.name}`
            }
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 min-h-0 -mx-6 px-6 overflow-y-auto">
          <div className="space-y-4 py-4 pr-2">
            {schema.columns.map(col => {
              const isPK = schema.primaryKeys.includes(col.name)
              const isAutoIncrement = isPK && col.type.toUpperCase() === 'INTEGER'
              
              return (
                <FormField
                  key={col.name}
                  column={col}
                  value={formData[col.name]}
                  onChange={(value) => updateField(col.name, value)}
                  isPrimaryKey={isPK}
                  isAutoIncrement={isAutoIncrement}
                  disabled={isSaving || (isAutoIncrement && !isEditing)}
                  error={errors[col.name]}
                />
              )
            })}
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Row'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default RowEditorDialog
