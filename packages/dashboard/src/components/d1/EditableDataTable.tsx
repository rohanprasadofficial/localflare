/**
 * Editable Data Table Component
 *
 * A full-featured data table built on TanStack Table with:
 * - Inline cell editing
 * - Row selection for bulk operations
 * - Sorting (client-side and server-side)
 * - Column resizing
 * - Column visibility controls
 * - Global search
 * - Column-level filtering
 * - Pagination
 * - Responsive design
 */

import { useMemo, useCallback, useState, useEffect } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
  type VisibilityState,
  type ColumnSizingState,
} from '@tanstack/react-table'
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowsDownUpIcon,
  TrashIcon,
  PencilSimpleIcon,
  CopyIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  XIcon,
  DatabaseIcon,
  SparkleIcon,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@cloudflare/kumo'
import { EditableCell } from './EditableCell'
import type { D1Row, D1CellValue, D1TableSchema, PaginationState, FilterOperator } from './types'

// ============================================================================
// Types
// ============================================================================

interface ColumnFilterConfig {
  columnId: string
  operator: FilterOperator
  value: string
}

interface EditableDataTableProps {
  /** Table schema information */
  schema: D1TableSchema
  /** Current page of data */
  data: D1Row[]
  /** Loading state */
  isLoading?: boolean
  /** Pagination state */
  pagination: PaginationState
  /** Called when pagination changes */
  onPaginationChange: (pagination: Partial<PaginationState>) => void
  /** Called when a cell is edited */
  onCellEdit?: (rowId: string, columnId: string, value: D1CellValue) => void
  /** Called when row is deleted */
  onRowDelete?: (row: D1Row) => void
  /** Called when row edit button clicked */
  onRowEdit?: (row: D1Row) => void
  /** Whether inline editing is enabled */
  editable?: boolean
  /** Called when sorting changes (for server-side sorting) */
  onSortingChange?: (sorting: SortingState) => void
  /** Whether server-side sorting is enabled */
  serverSideSort?: boolean
  /** Called when server-side sort toggle changes */
  onServerSideSortChange?: (enabled: boolean) => void
  /** Called when generate data button is clicked */
  onGenerateData?: () => void
  /** Additional CSS classes */
  className?: string
}

// ============================================================================
// Filter Operators Config
// ============================================================================

const FILTER_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: 'equals', label: 'Equals' },
  { value: 'notEquals', label: 'Not equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'startsWith', label: 'Starts with' },
  { value: 'isNull', label: 'Is null' },
  { value: 'isNotNull', label: 'Is not null' },
]

// ============================================================================
// Debounce Hook
// ============================================================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// ============================================================================
// Column Filter Popover Component
// ============================================================================

interface ColumnFilterPopoverProps {
  columnId: string
  columnName: string
  filter: ColumnFilterConfig | undefined
  onFilterChange: (filter: ColumnFilterConfig | null) => void
}

function ColumnFilterPopover({ columnId, columnName, filter, onFilterChange }: ColumnFilterPopoverProps) {
  const [open, setOpen] = useState(false)
  const [operator, setOperator] = useState<FilterOperator>(filter?.operator || 'contains')
  const [value, setValue] = useState(filter?.value || '')

  const handleApply = () => {
    if (operator === 'isNull' || operator === 'isNotNull') {
      onFilterChange({ columnId, operator, value: '' })
    } else if (value.trim()) {
      onFilterChange({ columnId, operator, value: value.trim() })
    }
    setOpen(false)
  }

  const handleClear = () => {
    onFilterChange(null)
    setOperator('contains')
    setValue('')
    setOpen(false)
  }

  const needsValue = operator !== 'isNull' && operator !== 'isNotNull'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "p-0.5 rounded hover:bg-kumo-tint transition-colors",
            filter && "text-kumo-brand"
          )}
          title={filter ? `Filtered: ${filter.operator} ${filter.value}` : 'Filter column'}
        >
          <FunnelIcon size={12} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          <div className="text-xs font-medium text-kumo-strong">
            Filter: {columnName}
          </div>

          <select
            value={operator}
            onChange={(e) => setOperator(e.target.value as FilterOperator)}
            className="w-full h-8 px-2 text-xs border border-kumo-line rounded bg-kumo-base focus:outline-none focus:ring-1 focus:ring-kumo-ring"
          >
            {FILTER_OPERATORS.map(op => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </select>

          {needsValue && (
            <Input
              placeholder="Filter value..."
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-8 text-xs"
              onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            />
          )}

          <div className="flex gap-2">
            <Button size="sm" className="flex-1 h-7 text-xs" onClick={handleApply}>
              Apply
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleClear}>
              Clear
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ============================================================================
// Pagination Component
// ============================================================================

interface PaginationControlsProps {
  pagination: PaginationState
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

function PaginationControls({
  pagination,
  onPageChange,
  onPageSizeChange
}: PaginationControlsProps) {
  const { pageIndex, pageSize, totalRows, totalPages } = pagination
  const startRow = pageIndex * pageSize + 1
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows)

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-kumo-line bg-kumo-tint/30">
      <div className="flex items-center gap-2 text-xs text-kumo-strong">
        <span>
          {totalRows > 0 ? (
            <>Showing {startRow}-{endRow} of {totalRows} rows</>
          ) : (
            'No rows'
          )}
        </span>
        <span className="text-kumo-line">|</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="bg-transparent border border-kumo-line rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-kumo-ring"
        >
          {[25, 50, 100, 250].map(size => (
            <option key={size} value={size}>{size} per page</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(0)}
          disabled={pageIndex === 0}
          className="h-7 px-2 text-xs"
        >
          First
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pageIndex - 1)}
          disabled={pageIndex === 0}
          className="h-7 px-2 text-xs"
        >
          Prev
        </Button>
        <span className="px-3 text-xs text-kumo-strong">
          Page {pageIndex + 1} of {totalPages || 1}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pageIndex + 1)}
          disabled={pageIndex >= totalPages - 1}
          className="h-7 px-2 text-xs"
        >
          Next
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages - 1)}
          disabled={pageIndex >= totalPages - 1}
          className="h-7 px-2 text-xs"
        >
          Last
        </Button>
      </div>
    </div>
  )
}

// ============================================================================
// Row Actions Component
// ============================================================================

interface RowActionsProps {
  row: D1Row
  onEdit?: () => void
  onDelete?: () => void
}

function RowActions({ row, onEdit, onDelete }: RowActionsProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(row, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [row])

  return (
    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
      {onEdit && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onEdit}
          title="Edit row"
        >
          <PencilSimpleIcon size={14} />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={handleCopy}
        title="Copy as JSON"
      >
        {copied ? (
          <CheckIcon size={14} className="text-green-500" />
        ) : (
          <CopyIcon size={14} />
        )}
      </Button>
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:text-kumo-danger"
          onClick={onDelete}
          title="Delete row"
        >
          <TrashIcon size={14} />
        </Button>
      )}
    </div>
  )
}

// ============================================================================
// Custom Filter Function
// ============================================================================

function applyColumnFilters(data: D1Row[], filters: ColumnFilterConfig[]): D1Row[] {
  if (filters.length === 0) return data

  return data.filter(row => {
    return filters.every(filter => {
      const cellValue = row[filter.columnId]
      const strValue = cellValue == null ? '' : String(cellValue).toLowerCase()
      const filterValue = filter.value.toLowerCase()

      switch (filter.operator) {
        case 'equals':
          return strValue === filterValue
        case 'notEquals':
          return strValue !== filterValue
        case 'contains':
          return strValue.includes(filterValue)
        case 'startsWith':
          return strValue.startsWith(filterValue)
        case 'isNull':
          return cellValue == null
        case 'isNotNull':
          return cellValue != null
        default:
          return true
      }
    })
  })
}

// ============================================================================
// Main Component
// ============================================================================

export function EditableDataTable({
  schema,
  data,
  isLoading = false,
  pagination,
  onPaginationChange,
  onCellEdit,
  onRowDelete,
  onRowEdit,
  editable = true,
  onSortingChange,
  serverSideSort = false,
  onServerSideSortChange,
  onGenerateData,
  className,
}: EditableDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFilterConfig[]>([])

  const debouncedGlobalFilter = useDebounce(globalFilter, 300)

  // Notify parent of sorting changes for server-side sorting
  useEffect(() => {
    if (serverSideSort && onSortingChange) {
      onSortingChange(sorting)
    }
  }, [sorting, serverSideSort, onSortingChange])

  // Get primary key column(s) for row identification
  const getRowId = useCallback((row: D1Row): string => {
    if (schema.primaryKeys.length === 0) {
      return JSON.stringify(row)
    }
    if (schema.primaryKeys.length === 1) {
      return String(row[schema.primaryKeys[0]])
    }
    return schema.primaryKeys.map(pk => row[pk]).join('::')
  }, [schema.primaryKeys])

  // Apply column filters manually (client-side)
  const filteredData = useMemo(() => {
    let result = data

    // Apply column filters
    result = applyColumnFilters(result, columnFilters)

    // Apply global filter
    if (debouncedGlobalFilter) {
      const search = debouncedGlobalFilter.toLowerCase()
      result = result.filter(row =>
        Object.values(row).some(val =>
          val != null && String(val).toLowerCase().includes(search)
        )
      )
    }

    return result
  }, [data, columnFilters, debouncedGlobalFilter])

  // Handle column filter changes
  const handleColumnFilterChange = useCallback((columnId: string, filter: ColumnFilterConfig | null) => {
    setColumnFilters(prev => {
      if (filter === null) {
        return prev.filter(f => f.columnId !== columnId)
      }
      const existing = prev.findIndex(f => f.columnId === columnId)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = filter
        return updated
      }
      return [...prev, filter]
    })
  }, [])

  // Get filter for a specific column
  const getColumnFilter = useCallback((columnId: string) => {
    return columnFilters.find(f => f.columnId === columnId)
  }, [columnFilters])

  // Build columns from schema
  const columns = useMemo<ColumnDef<D1Row>[]>(() => {
    const cols: ColumnDef<D1Row>[] = [
      // Selection column
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="rounded border-kumo-line"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="rounded border-kumo-line"
          />
        ),
        size: 40,
        minSize: 40,
        maxSize: 40,
        enableSorting: false,
        enableResizing: false,
        enableHiding: false,
      },
    ]

    // Data columns
    for (const col of schema.columns) {
      const isPK = schema.primaryKeys.includes(col.name)

      cols.push({
        id: col.name,
        accessorKey: col.name,
        header: ({ column }) => {
          const sorted = column.getIsSorted()
          return (
            <div className="flex items-center gap-1.5">
              <button
                className="flex items-center gap-1 hover:text-kumo-default transition-colors group/sort"
                onClick={() => column.toggleSorting()}
                title={sorted ? `Sorted ${sorted}ending` : 'Click to sort'}
              >
                <span className={cn(isPK && 'text-kumo-brand')}>{col.name}</span>
                {isPK && <span className="text-[9px] text-kumo-brand/60 ml-0.5">PK</span>}
                <span className="text-[9px] text-kumo-inactive ml-1">
                  {col.type.toUpperCase()}
                </span>
                {/* Sort indicator - always visible */}
                <span className={cn(
                  "inline-flex items-center justify-center size-4 rounded transition-colors",
                  sorted ? "text-kumo-brand bg-kumo-brand/10" : "text-kumo-inactive group-hover/sort:text-kumo-strong group-hover/sort:bg-kumo-tint"
                )}>
                  {sorted === 'asc' ? (
                    <ArrowUpIcon size={12} />
                  ) : sorted === 'desc' ? (
                    <ArrowDownIcon size={12} />
                  ) : (
                    <ArrowsDownUpIcon size={12} />
                  )}
                </span>
              </button>
              <ColumnFilterPopover
                columnId={col.name}
                columnName={col.name}
                filter={getColumnFilter(col.name)}
                onFilterChange={(filter) => handleColumnFilterChange(col.name, filter)}
              />
            </div>
          )
        },
        cell: ({ row }) => {
          const value = row.getValue(col.name) as D1CellValue
          const rowId = getRowId(row.original)

          return (
            <EditableCell
              value={value}
              column={col}
              editable={editable}
              isPrimaryKey={isPK}
              onSave={(newValue) => {
                onCellEdit?.(rowId, col.name, newValue)
              }}
            />
          )
        },
        enableSorting: true,
        enableResizing: true,
        enableHiding: true,
        size: 150,
        minSize: 80,
        maxSize: 400,
      })
    }

    // Actions column
    cols.push({
      id: 'actions',
      header: () => null,
      cell: ({ row }) => (
        <RowActions
          row={row.original}
          onEdit={onRowEdit ? () => onRowEdit(row.original) : undefined}
          onDelete={onRowDelete ? () => onRowDelete(row.original) : undefined}
        />
      ),
      size: 100,
      minSize: 100,
      maxSize: 100,
      enableSorting: false,
      enableResizing: false,
      enableHiding: false,
    })

    return cols
  }, [schema, editable, getRowId, onCellEdit, onRowDelete, onRowEdit, getColumnFilter, handleColumnFilterChange])

  // Handle sorting change - update local state and notify parent for server-side sorting
  const handleSortingChange = useCallback((updater: SortingState | ((old: SortingState) => SortingState)) => {
    const newSorting = typeof updater === 'function' ? updater(sorting) : updater
    setSorting(newSorting)
    // Notify parent for server-side sorting
    onSortingChange?.(newSorting)
  }, [sorting, onSortingChange])

  // Initialize table
  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      rowSelection,
      columnVisibility,
      columnSizing,
    },
    onSortingChange: handleSortingChange,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: serverSideSort ? undefined : getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => getRowId(row),
    enableRowSelection: true,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
  })

  // Handle pagination
  const handlePageChange = useCallback((pageIndex: number) => {
    onPaginationChange({ pageIndex })
  }, [onPaginationChange])

  const handlePageSizeChange = useCallback((pageSize: number) => {
    onPaginationChange({ pageSize, pageIndex: 0 })
  }, [onPaginationChange])

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setColumnFilters([])
    setGlobalFilter('')
  }, [])

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn("border border-kumo-line rounded-lg overflow-hidden", className)}>
        <div className="animate-pulse">
          <div className="h-12 bg-kumo-tint/50 border-b border-kumo-line" />
          <div className="h-10 bg-kumo-tint/50 border-b border-kumo-line" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 border-b border-kumo-line flex">
              {[...Array(schema.columns.length + 2)].map((_, j) => (
                <div key={j} className="flex-1 p-3">
                  <div className="h-4 bg-kumo-fill rounded" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Selected rows count
  const selectedCount = Object.keys(rowSelection).length
  const hasFilters = columnFilters.length > 0 || globalFilter.length > 0

  return (
    <div className={cn("border border-kumo-line rounded-lg overflow-hidden flex flex-col", className)}>
      {/* Toolbar */}
      <div className="px-4 py-2 border-b border-kumo-line bg-kumo-tint/30 flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <MagnifyingGlassIcon
            size={16}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-kumo-strong"
          />
          <Input
            placeholder="Search all columns..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>

        {/* Column Visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <EyeIcon size={14} />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs">Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter(column => column.getCanHide())
              .map(column => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="text-xs capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Generate Data Button */}
        {onGenerateData && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={onGenerateData}
          >
            <SparkleIcon size={14} />
            Generate Data
          </Button>
        )}

        {/* Filter count badge */}
        {hasFilters && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={clearAllFilters}
          >
            <FunnelIcon size={14} />
            Filters ({columnFilters.length + (globalFilter ? 1 : 0)})
            <XIcon size={12} />
          </Button>
        )}

        {/* Server-side sort toggle */}
        {onServerSideSortChange && (
          <div className="flex items-center gap-2 ml-auto">
            <Checkbox
              id="server-sort"
              checked={serverSideSort}
              onCheckedChange={(checked) => onServerSideSortChange(!!checked)}
            />
            <Label
              htmlFor="server-sort"
              className="text-xs text-kumo-strong cursor-pointer"
              title="When enabled, sorting queries the database with ORDER BY to sort across all pages. When disabled, only the current page is sorted."
            >
              <span className="flex items-center gap-1">
                <DatabaseIcon size={12} />
                <span>Sort via DB</span>
                <span className="text-[10px] opacity-60">(ORDER BY)</span>
              </span>
            </Label>
          </div>
        )}
      </div>

      {/* Bulk actions toolbar */}
      {selectedCount > 0 && (
        <div className="px-4 py-2 bg-kumo-brand/10 border-b border-kumo-line flex items-center gap-3">
          <span className="text-xs font-medium">
            {selectedCount} row{selectedCount !== 1 ? 's' : ''} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-kumo-danger hover:text-kumo-danger"
            onClick={() => {
              const selectedRows = table.getSelectedRowModel().rows
              selectedRows.forEach(row => onRowDelete?.(row.original))
              setRowSelection({})
            }}
          >
            <TrashIcon size={14} className="mr-1" />
            Delete Selected
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setRowSelection({})}
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm" style={{ minWidth: table.getCenterTotalSize() }}>
          <thead className="bg-kumo-tint/50 sticky top-0 z-10">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="border-b border-kumo-line">
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className={cn(
                      "px-4 py-2.5 text-left text-xs font-medium text-kumo-strong whitespace-nowrap relative overflow-hidden",
                      header.column.id === 'select' && 'w-10',
                      header.column.id === 'actions' && 'w-24',
                    )}
                    style={{
                      width: header.getSize(),
                      maxWidth: header.getSize(),
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    {/* Resize handle - subtle, only visible on hover */}
                    {header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        onDoubleClick={() => header.column.resetSize()}
                        className={cn(
                          "absolute right-0 top-0 h-full w-2 cursor-col-resize select-none touch-none",
                          "opacity-0 hover:opacity-100 transition-opacity",
                          header.column.getIsResizing() && "opacity-100"
                        )}
                        title="Drag to resize"
                      >
                        <div className={cn(
                          "w-0.5 h-full",
                          header.column.getIsResizing()
                            ? "bg-kumo-brand"
                            : "bg-kumo-line hover:bg-kumo-brand"
                        )} />
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-kumo-base divide-y divide-kumo-line">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-kumo-strong"
                >
                  {hasFilters ? 'No matching data' : 'No data in this table'}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr
                  key={row.id}
                  className={cn(
                    "group transition-colors hover:bg-kumo-tint/30",
                    row.getIsSelected() && "bg-kumo-brand/5"
                  )}
                >
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      className={cn(
                        "px-4 py-2 whitespace-nowrap overflow-hidden",
                        cell.column.id === 'select' && 'w-10',
                        cell.column.id === 'actions' && 'w-24',
                      )}
                      style={{
                        width: cell.column.getSize(),
                        maxWidth: cell.column.getSize(),
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <PaginationControls
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  )
}

export default EditableDataTable
