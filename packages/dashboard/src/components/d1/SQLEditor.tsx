/**
 * SQL Editor Component
 * 
 * A feature-rich SQL editor built on CodeMirror with:
 * - Syntax highlighting for SQL
 * - Auto-completion for table/column names (dynamic per schema)
 * - Keyboard shortcuts (Cmd/Ctrl+Enter to execute)
 * - Custom dark theme matching LocalFlare branding
 */

import { useEffect, useRef, useCallback } from 'react'
import { EditorView, keymap, placeholder as cmPlaceholder } from '@codemirror/view'
import { EditorState, Compartment, Prec } from '@codemirror/state'
import { sql, SQLite } from '@codemirror/lang-sql'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { 
  autocompletion, 
  completionKeymap,
  CompletionContext,
  type CompletionResult,
  type Completion,
} from '@codemirror/autocomplete'
import { oneDark } from '@codemirror/theme-one-dark'
import { cn } from '@cloudflare/kumo'
import type { D1TableSchema, SQLEditorProps } from './types'

// ============================================================================
// Theme Configuration - LocalFlare Branding
// ============================================================================

// Light mode theme
const lightTheme = EditorView.theme({
  '&': {
    fontSize: '13px',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    backgroundColor: '#ffffff',
  },
  '.cm-content': {
    padding: '12px 0',
    minHeight: '100px',
    caretColor: '#f97316',
    color: '#1f2937',
  },
  '.cm-line': {
    padding: '0 12px',
  },
  '.cm-gutters': {
    backgroundColor: '#f9fafb',
    border: 'none',
    paddingLeft: '8px',
    color: '#9ca3af',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#f3f4f6',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(249, 115, 22, 0.06)',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'rgba(249, 115, 22, 0.15) !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'rgba(249, 115, 22, 0.2) !important',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: '#f97316',
    borderLeftWidth: '2px',
  },
  '.cm-placeholder': {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  // Autocomplete tooltip - light background
  '.cm-tooltip': {
    backgroundColor: '#ffffff !important',
    border: '1px solid #e5e7eb !important',
    borderRadius: '8px',
    boxShadow: '0 10px 40px -5px rgb(0 0 0 / 0.15)',
    overflow: 'hidden',
  },
  '.cm-tooltip-autocomplete': {
    backgroundColor: '#ffffff !important',
    '& > ul': {
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
      fontSize: '12px',
      padding: '4px',
      maxHeight: '250px',
      backgroundColor: '#ffffff !important',
    },
    '& > ul > li': {
      padding: '6px 10px',
      borderRadius: '4px',
      margin: '1px 0',
      color: '#1f2937',
      backgroundColor: 'transparent',
    },
    '& > ul > li[aria-selected]': {
      backgroundColor: 'rgba(249, 115, 22, 0.15) !important',
      color: '#1f2937',
    },
  },
  '.cm-completionLabel': {
    color: '#1f2937',
  },
  '.cm-completionDetail': {
    color: '#6b7280',
    marginLeft: '8px',
    fontStyle: 'italic',
  },
  '.cm-completionMatchedText': {
    color: '#ea580c !important',
    fontWeight: '600',
    textDecoration: 'none',
  },
  '.cm-completionIcon': {
    color: '#6b7280',
  },
  // Syntax highlighting overrides for light mode
  '.cm-keyword': { color: '#7c3aed' },
  '.cm-string': { color: '#059669' },
  '.cm-number': { color: '#0284c7' },
  '.cm-operator': { color: '#dc2626' },
  '.cm-comment': { color: '#6b7280', fontStyle: 'italic' },
  '.cm-punctuation': { color: '#6b7280' },
}, { dark: false })

// Dark mode theme  
const darkTheme = EditorView.theme({
  '&': {
    fontSize: '13px',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    backgroundColor: '#1a1a1a',
  },
  '.cm-content': {
    padding: '12px 0',
    minHeight: '100px',
    caretColor: '#f97316',
    color: '#e5e5e5',
  },
  '.cm-line': {
    padding: '0 12px',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    border: 'none',
    paddingLeft: '8px',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(249, 115, 22, 0.05)',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'rgba(249, 115, 22, 0.2) !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'rgba(249, 115, 22, 0.25) !important',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: '#f97316',
    borderLeftWidth: '2px',
  },
  '.cm-placeholder': {
    color: 'rgba(255, 255, 255, 0.4)',
    fontStyle: 'italic',
  },
  // Autocomplete tooltip - solid dark background
  '.cm-tooltip': {
    backgroundColor: '#1a1a1a !important',
    border: '1px solid #333 !important',
    borderRadius: '8px',
    boxShadow: '0 10px 40px -5px rgb(0 0 0 / 0.5)',
    overflow: 'hidden',
  },
  '.cm-tooltip-autocomplete': {
    backgroundColor: '#1a1a1a !important',
    '& > ul': {
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
      fontSize: '12px',
      padding: '4px',
      maxHeight: '250px',
      backgroundColor: '#1a1a1a !important',
    },
    '& > ul > li': {
      padding: '6px 10px',
      borderRadius: '4px',
      margin: '1px 0',
      color: '#e5e5e5',
      backgroundColor: 'transparent',
    },
    '& > ul > li[aria-selected]': {
      backgroundColor: 'rgba(249, 115, 22, 0.2) !important',
      color: '#ffffff',
    },
  },
  '.cm-completionLabel': {
    color: '#e5e5e5',
  },
  '.cm-completionDetail': {
    color: '#888888',
    marginLeft: '8px',
    fontStyle: 'italic',
  },
  '.cm-completionMatchedText': {
    color: '#f97316 !important',
    fontWeight: '600',
    textDecoration: 'none',
  },
  '.cm-completionIcon': {
    color: '#888888',
  },
}, { dark: true })

// ============================================================================
// SQL Keywords & Functions
// ============================================================================

const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN',
  'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE',
  'CREATE', 'TABLE', 'INDEX', 'DROP', 'ALTER', 'ADD', 'COLUMN',
  'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'CROSS', 'ON', 'AS',
  'ORDER', 'BY', 'ASC', 'DESC', 'LIMIT', 'OFFSET',
  'GROUP', 'HAVING', 'DISTINCT', 'UNION', 'ALL', 'EXCEPT', 'INTERSECT',
  'EXISTS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'NULL', 'IS', 'DEFAULT', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES',
  'UNIQUE', 'CHECK', 'CONSTRAINT', 'CASCADE', 'RESTRICT', 'AUTOINCREMENT',
  'INTEGER', 'TEXT', 'REAL', 'BLOB', 'BOOLEAN', 'NUMERIC', 'VARCHAR',
  'PRAGMA', 'EXPLAIN', 'ANALYZE', 'VACUUM', 'REINDEX',
  'BEGIN', 'COMMIT', 'ROLLBACK', 'TRANSACTION',
]

const SQL_FUNCTIONS = [
  { name: 'COUNT', detail: 'Aggregate' },
  { name: 'SUM', detail: 'Aggregate' },
  { name: 'AVG', detail: 'Aggregate' },
  { name: 'MIN', detail: 'Aggregate' },
  { name: 'MAX', detail: 'Aggregate' },
  { name: 'GROUP_CONCAT', detail: 'Aggregate' },
  { name: 'LENGTH', detail: 'String' },
  { name: 'LOWER', detail: 'String' },
  { name: 'UPPER', detail: 'String' },
  { name: 'SUBSTR', detail: 'String' },
  { name: 'TRIM', detail: 'String' },
  { name: 'REPLACE', detail: 'String' },
  { name: 'ABS', detail: 'Numeric' },
  { name: 'ROUND', detail: 'Numeric' },
  { name: 'RANDOM', detail: 'Numeric' },
  { name: 'DATE', detail: 'DateTime' },
  { name: 'TIME', detail: 'DateTime' },
  { name: 'DATETIME', detail: 'DateTime' },
  { name: 'STRFTIME', detail: 'DateTime' },
  { name: 'COALESCE', detail: 'Logic' },
  { name: 'NULLIF', detail: 'Logic' },
  { name: 'IFNULL', detail: 'Logic' },
  { name: 'JSON_EXTRACT', detail: 'JSON' },
]

// ============================================================================
// Autocomplete - Dynamic per Schema
// ============================================================================

function createSchemaCompletions(schemas: D1TableSchema[] | undefined) {
  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/[\w.]*/)
    if (!word || (word.from === word.to && !context.explicit)) {
      return null
    }
    
    const input = word.text
    const options: Completion[] = []
    const dotIndex = input.lastIndexOf('.')
    const isColumnContext = dotIndex > -1
    
    if (isColumnContext && schemas) {
      // User typed "tablename." - show columns for that table
      const tableName = input.substring(0, dotIndex).toLowerCase()
      const matchedTable = schemas.find(t => t.name.toLowerCase() === tableName)
      
      if (matchedTable) {
        for (const col of matchedTable.columns) {
          options.push({
            label: col.name,
            type: 'property',
            detail: col.type.toUpperCase(),
            boost: 2,
          })
        }
      }
    } else {
      // Add tables first (highest priority)
      if (schemas) {
        for (const table of schemas) {
          options.push({
            label: table.name,
            type: 'class',
            detail: 'Table',
            boost: 2,
          })
          
          // Add columns with table context
          for (const col of table.columns) {
            options.push({
              label: col.name,
              type: 'property',
              detail: `${table.name} · ${col.type}`,
              boost: 1,
            })
          }
        }
      }
      
      // Add SQL functions
      for (const fn of SQL_FUNCTIONS) {
        options.push({
          label: fn.name,
          type: 'function',
          detail: fn.detail,
          apply: `${fn.name}()`,
          boost: 0,
        })
      }
      
      // Add SQL keywords (lower boost)
      for (const keyword of SQL_KEYWORDS) {
        options.push({
          label: keyword,
          type: 'keyword',
          boost: -1,
        })
      }
    }
    
    return {
      from: isColumnContext ? word.from + dotIndex + 1 : word.from,
      options,
      validFor: /^[\w]*$/,
    }
  }
}

// ============================================================================
// SQL Editor Component
// ============================================================================

export function SQLEditor({
  value,
  onChange,
  onExecute,
  schema,
  placeholder = 'Enter SQL query... (Ctrl/Cmd + Enter to execute)',
  disabled = false,
  height = '150px',
  className,
}: SQLEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const schemaCompartment = useRef(new Compartment())
  const themeCompartment = useRef(new Compartment())
  
  // Use ref for onExecute to avoid stale closures in keymap
  const onExecuteRef = useRef(onExecute)
  onExecuteRef.current = onExecute
  
  // Detect dark mode from document
  const isDarkMode = useCallback(() => {
    return document.documentElement.classList.contains('dark') || document.documentElement.getAttribute('data-mode') === 'dark'
  }, [])
  
  const createExtensions = useCallback(() => {
    const dark = isDarkMode()
    return [
      history(),
      EditorView.lineWrapping,
      // Always include oneDark for syntax highlighting, then override with theme
      oneDark,
      themeCompartment.current.of(dark ? darkTheme : lightTheme),
      cmPlaceholder(placeholder),
      sql({ dialect: SQLite }),
      schemaCompartment.current.of(
        autocompletion({
          override: [createSchemaCompletions(schema)],
          activateOnTyping: true,
          maxRenderedOptions: 25,
        })
      ),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...completionKeymap,
      ]),
      // Use highest priority for execute shortcut - use ref to avoid stale closure
      Prec.highest(
        keymap.of([{ 
          key: 'Mod-Enter', 
          run: () => { 
            if (onExecuteRef.current && !disabled) {
              onExecuteRef.current()
            }
            return true 
          } 
        }])
      ),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChange(update.state.doc.toString())
        }
      }),
      EditorView.editable.of(!disabled),
    ]
  }, [schema, placeholder, onChange, disabled, isDarkMode])
  
  useEffect(() => {
    if (!containerRef.current) return
    
    if (viewRef.current) {
      viewRef.current.destroy()
    }
    
    const state = EditorState.create({
      doc: value,
      extensions: createExtensions(),
    })
    
    viewRef.current = new EditorView({
      state,
      parent: containerRef.current,
    })
    
    return () => {
      viewRef.current?.destroy()
      viewRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled])
  
  // Update autocomplete when schema changes
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: schemaCompartment.current.reconfigure(
          autocompletion({
            override: [createSchemaCompletions(schema)],
            activateOnTyping: true,
            maxRenderedOptions: 25,
          })
        ),
      })
    }
  }, [schema])
  
  // Watch for dark mode changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (viewRef.current) {
        const dark = isDarkMode()
        viewRef.current.dispatch({
          effects: themeCompartment.current.reconfigure(
            dark ? darkTheme : lightTheme
          ),
        })
      }
    })
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-mode'],
    })
    
    return () => observer.disconnect()
  }, [isDarkMode])
  
  // Sync external value changes
  useEffect(() => {
    if (viewRef.current) {
      const currentValue = viewRef.current.state.doc.toString()
      if (value !== currentValue) {
        viewRef.current.dispatch({
          changes: { from: 0, to: currentValue.length, insert: value },
        })
      }
    }
  }, [value])
  
  return (
    <div
      ref={containerRef}
      className={cn(
        'rounded-md border border-kumo-line bg-kumo-base overflow-hidden',
        'focus-within:ring-2 focus-within:ring-kumo-brand/20 focus-within:border-kumo-brand/50',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      style={{ height }}
    />
  )
}

export default SQLEditor
