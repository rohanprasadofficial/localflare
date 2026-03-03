/**
 * D1 Database Explorer
 *
 * A comprehensive database management interface inspired by Drizzle Studio and Supabase.
 * Provides full CRUD operations, SQL query execution, and schema visualization.
 */

import { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DatabaseIcon,
  PlayIcon,
  TableIcon,
  PlusIcon,
  ArrowsClockwiseIcon,
  GearIcon,
  CodeIcon,
  ClockIcon,
} from '@phosphor-icons/react'
import { d1Api } from '@/lib/api'
import { cn } from '@cloudflare/kumo'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTableLoading } from '@/components/ui/data-table'
import { Toaster, toast } from '@/components/ui/toaster'

// D1 Component imports
import { SQLEditor } from './SQLEditor'
import { EditableDataTable } from './EditableDataTable'
import { RowEditorDialog } from './RowEditorDialog'
import { DummyDataGeneratorDialog } from './DummyDataGeneratorDialog'
import { TableSchemaPanel } from './TableSchemaPanel'
import { QueryHistory } from './QueryHistory'
import { generateDummyRow, type ForeignKeyValues } from './dummy-data-generator'
import {
  useD1TableInfo,
  useD1AllTableSchemas,
  usePagination,
  useQueryHistory,
  d1QueryKeys,
  type SortConfig,
} from './hooks'
import type {
  D1Row,
  D1CellValue,
  QueryHistoryEntry,
} from './types'
import type { SortingState } from '@tanstack/react-table'

// ============================================================================
// Main Component
// ============================================================================

export function D1Explorer() {
  // State
  const [selectedDb, setSelectedDb] = useState<string | null>(null)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [sqlQuery, setSqlQuery] = useState('')
  const [queryResult, setQueryResult] = useState<D1Row[] | null>(null)
  const [queryError, setQueryError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'data' | 'query' | 'schema'>('data')
  const [showRowEditor, setShowRowEditor] = useState(false)
  const [editingRow, setEditingRow] = useState<D1Row | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)
  const [serverSideSort, setServerSideSort] = useState(false)
  const [showDummyDataDialog, setShowDummyDataDialog] = useState(false)
  const [isGeneratingDummyData, setIsGeneratingDummyData] = useState(false)
  const [dummyDataProgress, setDummyDataProgress] = useState(0)

  const queryClient = useQueryClient()
  const { pagination, updatePagination, goToPage, setPageSize } = usePagination(50)
  const { entries: historyEntries, addEntry: addHistoryEntry, clearHistory } = useQueryHistory()

  // Queries
  const { data: databases, isLoading: loadingDatabases } = useQuery({
    queryKey: d1QueryKeys.databases(),
    queryFn: d1Api.list,
  })

  const { data: schema } = useQuery({
    queryKey: d1QueryKeys.schema(selectedDb ?? ''),
    queryFn: () => (selectedDb ? d1Api.getSchema(selectedDb) : null),
    enabled: !!selectedDb,
  })

  const { data: tableInfo, isLoading: loadingTableInfo } = useD1TableInfo(selectedDb, selectedTable)

  const { data: tableData, isLoading: loadingTableData, refetch: refetchRows } = useQuery({
    queryKey: d1QueryKeys.tableRows(
      selectedDb ?? '',
      selectedTable ?? '',
      pagination.pageIndex,
      pagination.pageSize,
      serverSideSort ? sortConfig?.column : undefined,
      serverSideSort ? sortConfig?.direction : undefined
    ),
    queryFn: () =>
      selectedDb && selectedTable
        ? d1Api.getRows(
            selectedDb,
            selectedTable,
            pagination.pageSize,
            pagination.pageIndex * pagination.pageSize,
            serverSideSort ? sortConfig?.column : undefined,
            serverSideSort ? sortConfig?.direction : undefined
          )
        : null,
    enabled: !!selectedDb && !!selectedTable,
  })

  useEffect(() => {
    if (tableInfo) updatePagination({ totalRows: tableInfo.rowCount })
  }, [tableInfo, updatePagination])

  // Mutations
  const queryMutation = useMutation({
    mutationFn: async ({ sql }: { sql: string }) => {
      if (!selectedDb) throw new Error('No database selected')
      const startTime = Date.now()
      const result = await d1Api.query(selectedDb, sql)
      return { ...result, duration: Date.now() - startTime }
    },
    onSuccess: (data, variables) => {
      setQueryResult((data.results as D1Row[]) ?? [])
      setQueryError(null)
      addHistoryEntry({ sql: variables.sql, database: selectedDb!, success: true, duration: data.meta?.duration, rowCount: data.rowCount })
      const upperSql = variables.sql.trim().toUpperCase()
      if (!upperSql.startsWith('SELECT') && !upperSql.startsWith('PRAGMA')) {
        queryClient.invalidateQueries({ queryKey: ['d1'] })
        toast.success('Query executed successfully', { description: `${data.meta?.changes ?? 0} rows affected` })
      }
    },
    onError: (error, variables) => {
      const errorMessage = String(error)
      setQueryError(errorMessage)
      setQueryResult(null)
      addHistoryEntry({ sql: variables.sql, database: selectedDb!, success: false, error: errorMessage })
      toast.error('Query failed', { description: errorMessage })
    },
  })

  const updateCellMutation = useMutation({
    mutationFn: async ({ rowId, column, value }: { rowId: string; column: string; value: D1CellValue }) => {
      if (!selectedDb || !selectedTable) throw new Error('No table selected')
      return d1Api.updateCell(selectedDb, selectedTable, rowId, column, value)
    },
    onSuccess: () => { refetchRows(); toast.success('Cell updated') },
    onError: (error) => { toast.error('Failed to update cell', { description: String(error) }) },
  })

  const insertRowMutation = useMutation({
    mutationFn: async (data: Record<string, D1CellValue>) => {
      if (!selectedDb || !selectedTable) throw new Error('No table selected')
      return d1Api.insertRow(selectedDb, selectedTable, data as Record<string, unknown>)
    },
    onSuccess: () => {
      setShowRowEditor(false); setEditingRow(null)
      queryClient.invalidateQueries({ queryKey: d1QueryKeys.tableInfo(selectedDb ?? '', selectedTable ?? '') })
      refetchRows(); toast.success('Row inserted')
    },
    onError: (error) => { toast.error('Failed to insert row', { description: String(error) }) },
  })

  const updateRowMutation = useMutation({
    mutationFn: async ({ rowId, data }: { rowId: string; data: Record<string, D1CellValue> }) => {
      if (!selectedDb || !selectedTable) throw new Error('No table selected')
      return d1Api.updateRow(selectedDb, selectedTable, rowId, data as Record<string, unknown>)
    },
    onSuccess: () => {
      setShowRowEditor(false); setEditingRow(null); refetchRows(); toast.success('Row updated')
    },
    onError: (error) => { toast.error('Failed to update row', { description: String(error) }) },
  })

  const deleteRowMutation = useMutation({
    mutationFn: async (rowId: string) => {
      if (!selectedDb || !selectedTable) throw new Error('No table selected')
      return d1Api.deleteRow(selectedDb, selectedTable, rowId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: d1QueryKeys.tableInfo(selectedDb ?? '', selectedTable ?? '') })
      refetchRows(); toast.success('Row deleted')
    },
    onError: (error) => { toast.error('Failed to delete row', { description: String(error) }) },
  })

  // Handlers
  const handleRunQuery = useCallback(() => {
    if (sqlQuery.trim()) queryMutation.mutate({ sql: sqlQuery })
  }, [sqlQuery, queryMutation])

  const handleCellEdit = useCallback((rowId: string, columnId: string, value: D1CellValue) => {
    updateCellMutation.mutate({ rowId, column: columnId, value })
  }, [updateCellMutation])

  const handleRowDelete = useCallback((row: D1Row) => {
    if (!tableInfo) return
    let rowId: string
    if (tableInfo.primaryKeys.length === 0) rowId = JSON.stringify(row)
    else if (tableInfo.primaryKeys.length === 1) rowId = String(row[tableInfo.primaryKeys[0]])
    else rowId = JSON.stringify(tableInfo.primaryKeys.map(pk => row[pk]))
    deleteRowMutation.mutate(rowId)
  }, [tableInfo, deleteRowMutation])

  const handleRowEdit = useCallback((row: D1Row) => { setEditingRow(row); setShowRowEditor(true) }, [])

  const handleRowSave = useCallback((data: Record<string, D1CellValue>) => {
    if (editingRow && tableInfo) {
      let rowId: string
      if (tableInfo.primaryKeys.length === 1) rowId = String(editingRow[tableInfo.primaryKeys[0]])
      else rowId = JSON.stringify(tableInfo.primaryKeys.map(pk => editingRow[pk]))
      updateRowMutation.mutate({ rowId, data })
    } else {
      insertRowMutation.mutate(data)
    }
  }, [editingRow, tableInfo, updateRowMutation, insertRowMutation])

  const handleHistorySelect = useCallback((entry: QueryHistoryEntry) => {
    setSqlQuery(entry.sql)
    if (entry.database !== selectedDb) setSelectedDb(entry.database)
    setActiveTab('query'); setShowHistory(false)
  }, [selectedDb])

  const handleRefresh = useCallback(() => {
    refetchRows()
    queryClient.invalidateQueries({ queryKey: d1QueryKeys.tableInfo(selectedDb ?? '', selectedTable ?? '') })
    toast.success('Data refreshed')
  }, [refetchRows, queryClient, selectedDb, selectedTable])

  const handleSortingChange = useCallback((sorting: SortingState) => {
    if (sorting.length > 0) setSortConfig({ column: sorting[0].id, direction: sorting[0].desc ? 'desc' : 'asc' })
    else setSortConfig(null)
  }, [])

  const handleServerSideSortChange = useCallback((enabled: boolean) => {
    setServerSideSort(enabled); goToPage(0)
  }, [goToPage])

  const handleGenerateDummyData = useCallback(async (count: number) => {
    if (!tableInfo || !selectedDb) return
    setIsGeneratingDummyData(true); setDummyDataProgress(0)
    try {
      const foreignKeyValues: ForeignKeyValues = {}
      if (tableInfo.foreignKeys?.length > 0) {
        for (const fk of tableInfo.foreignKeys) {
          try {
            const result = await d1Api.query(selectedDb, `SELECT DISTINCT "${fk.to}" FROM "${fk.table}" LIMIT 100`)
            if (result.results && result.results.length > 0) {
              foreignKeyValues[fk.from] = (result.results as Record<string, D1CellValue>[]).map(row => row[fk.to]).filter(v => v != null)
            }
          } catch { console.warn(`Could not fetch FK values for ${fk.from} -> ${fk.table}.${fk.to}`) }
        }
      }
      for (let i = 0; i < count; i++) {
        const row = generateDummyRow(tableInfo, foreignKeyValues)
        await d1Api.insertRow(selectedDb, selectedTable!, row as Record<string, unknown>)
        setDummyDataProgress(i + 1)
      }
      queryClient.invalidateQueries({ queryKey: d1QueryKeys.tableInfo(selectedDb ?? '', selectedTable ?? '') })
      refetchRows()
      toast.success(`Generated ${count} row${count !== 1 ? 's' : ''}`, { description: `Added to ${selectedTable}` })
      setShowDummyDataDialog(false)
    } catch (error) {
      toast.error('Failed to generate data', { description: String(error) })
    } finally {
      setIsGeneratingDummyData(false); setDummyDataProgress(0)
    }
  }, [tableInfo, selectedDb, selectedTable, queryClient, refetchRows])

  const tableNames = schema?.tables?.map(t => t.name)
  const { data: allTableSchemas } = useD1AllTableSchemas(selectedDb, tableNames)

  // Render
  if (loadingDatabases) {
    return <div className="p-8"><DataTableLoading /></div>
  }

  if (!databases?.databases.length) {
    return (
      <div className="p-8 max-w-3xl">
        <h1 className="text-2xl font-semibold text-kumo-default">D1 Databases</h1>
        <p className="text-sm text-kumo-strong mt-1">Manage your D1 SQLite databases</p>
        <div className="mt-8 rounded-lg border border-kumo-line p-8 text-center">
          <DatabaseIcon size={32} className="text-kumo-subtle mx-auto mb-3" />
          <p className="text-sm text-kumo-default font-medium">No D1 databases configured</p>
          <p className="text-xs text-kumo-strong mt-1">Add a D1 database binding to your wrangler.toml to get started</p>
        </div>
        <Toaster />
      </div>
    )
  }

  const tableCount = schema?.tables?.length ?? 0
  const rowCount = tableInfo?.rowCount ?? 0

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b border-kumo-line">
        <h1 className="text-2xl font-semibold text-kumo-default">D1 Databases</h1>
        <p className="text-sm text-kumo-strong mt-1">Manage your D1 SQLite databases</p>

        <div className="grid grid-cols-3 gap-px rounded-lg border border-kumo-line bg-kumo-line overflow-hidden mt-5 max-w-lg">
          <div className="bg-kumo-base px-4 py-3">
            <p className="text-xs text-kumo-strong">Databases</p>
            <p className="text-xl font-semibold text-kumo-default mt-0.5 tabular-nums">{databases.databases.length}</p>
          </div>
          <div className="bg-kumo-base px-4 py-3">
            <p className="text-xs text-kumo-strong">Tables</p>
            <p className="text-xl font-semibold text-kumo-default mt-0.5 tabular-nums">{tableCount}</p>
          </div>
          <div className="bg-kumo-base px-4 py-3">
            <p className="text-xs text-kumo-strong">Rows</p>
            <p className="text-xl font-semibold text-kumo-default mt-0.5 tabular-nums">{rowCount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <div className="w-52 border-r border-kumo-line flex flex-col bg-kumo-elevated">
          <div className="px-3 py-2.5 border-b border-kumo-line flex items-center justify-between">
            <span className="text-[11px] font-medium text-kumo-subtle uppercase tracking-wider">Databases</span>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={cn("p-1 rounded hover:bg-kumo-tint transition-colors", showHistory && "text-kumo-brand")}
              title="Query History"
            >
              <ClockIcon size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {showHistory ? (
              <div className="p-2">
                <QueryHistory entries={historyEntries} onSelect={handleHistorySelect} onClear={clearHistory} maxEntries={20} />
              </div>
            ) : (
              <div className="p-2 space-y-0.5">
                {databases.databases.map((db) => (
                  <div key={db.binding}>
                    <button
                      onClick={() => { setSelectedDb(db.binding); setSelectedTable(null); goToPage(0) }}
                      className={cn(
                        'w-full text-left px-2.5 py-1.5 rounded-md text-sm flex items-center gap-2 transition-colors',
                        selectedDb === db.binding
                          ? 'bg-kumo-tint text-kumo-default font-medium'
                          : 'text-kumo-strong hover:bg-kumo-tint/60 hover:text-kumo-default'
                      )}
                    >
                      <DatabaseIcon size={14} className={cn('shrink-0', selectedDb === db.binding && 'text-d1')} />
                      {db.binding}
                    </button>
                    {selectedDb === db.binding && schema?.tables && (
                      <div className="ml-3 mt-0.5 pl-3 border-l border-kumo-line space-y-px">
                        {schema.tables.map((table) => (
                          <button
                            key={table.name}
                            onClick={() => { setSelectedTable(table.name); goToPage(0) }}
                            className={cn(
                              'w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2 transition-colors',
                              selectedTable === table.name
                                ? 'bg-kumo-tint text-kumo-default font-medium'
                                : 'text-kumo-strong hover:bg-kumo-tint/60 hover:text-kumo-default'
                            )}
                          >
                            <TableIcon size={12} className="shrink-0" />
                            {table.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'data' | 'query' | 'schema')} className="flex-1 flex flex-col">
            <div className="border-b border-kumo-line px-4 bg-kumo-elevated flex items-center justify-between">
              <TabsList className="h-10 bg-transparent p-0 gap-4">
                <TabsTrigger value="data" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-10 px-0">
                  <TableIcon size={14} className="mr-1.5" /> Data
                </TabsTrigger>
                <TabsTrigger value="query" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-10 px-0">
                  <CodeIcon size={14} className="mr-1.5" /> SQL Query
                </TabsTrigger>
                <TabsTrigger value="schema" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-10 px-0">
                  <GearIcon size={14} className="mr-1.5" /> Schema
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                {activeTab === 'data' && selectedTable && (
                  <>
                    <Button variant="ghost" size="sm" onClick={handleRefresh} className="h-7 text-xs">
                      <ArrowsClockwiseIcon size={14} className="mr-1.5" /> Refresh
                    </Button>
                    <Button size="sm" onClick={() => { setEditingRow(null); setShowRowEditor(true) }} className="h-7 text-xs">
                      <PlusIcon size={14} className="mr-1.5" /> Add Row
                    </Button>
                  </>
                )}
              </div>
            </div>

            <TabsContent value="data" className="flex-1 m-0 overflow-auto p-4">
              {loadingTableData || loadingTableInfo ? <DataTableLoading /> : selectedTable && tableInfo && tableData?.rows ? (
                <EditableDataTable schema={tableInfo} data={tableData.rows} pagination={pagination}
                  onPaginationChange={(p) => { if (p.pageIndex !== undefined) goToPage(p.pageIndex); if (p.pageSize !== undefined) setPageSize(p.pageSize) }}
                  onCellEdit={handleCellEdit} onRowDelete={handleRowDelete} onRowEdit={handleRowEdit} editable={true}
                  serverSideSort={serverSideSort} onSortingChange={handleSortingChange} onServerSideSortChange={handleServerSideSortChange}
                  onGenerateData={() => setShowDummyDataDialog(true)} />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <TableIcon size={32} className="text-kumo-subtle mb-3" />
                  <p className="text-sm text-kumo-default font-medium">Select a table</p>
                  <p className="text-xs text-kumo-strong mt-1">Choose a table from the sidebar to view and edit its data</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="query" className="flex-1 m-0 flex flex-col">
              <div className="p-4 border-b border-kumo-line">
                <SQLEditor value={sqlQuery} onChange={setSqlQuery} onExecute={handleRunQuery} schema={allTableSchemas}
                  placeholder="Enter SQL query... (Ctrl/Cmd + Enter to execute)" disabled={!selectedDb} height="150px" />
                <div className="mt-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-kumo-strong">{selectedDb ? `Database: ${selectedDb}` : 'Select a database first'}</span>
                    <span className="text-[10px] text-kumo-subtle hidden sm:flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-kumo-fill rounded text-[9px] font-mono">⌘</kbd><span>+</span>
                      <kbd className="px-1.5 py-0.5 bg-kumo-fill rounded text-[9px] font-mono">Enter</kbd><span className="ml-1">to run</span>
                    </span>
                  </div>
                  <Button onClick={handleRunQuery} disabled={!selectedDb || !sqlQuery.trim() || queryMutation.isPending} size="sm">
                    <PlayIcon size={14} className="mr-1.5" /> {queryMutation.isPending ? 'Running...' : 'Run Query'}
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4">
                {queryError && (
                  <div className="p-4 rounded-md bg-kumo-danger/10 border border-kumo-danger/20 text-kumo-danger text-sm font-mono">{queryError}</div>
                )}
                {queryResult && (
                  queryResult.length > 0 ? (
                    <>
                      <div className="border border-kumo-line rounded-lg overflow-hidden">
                        <div className="overflow-auto max-h-125">
                          <table className="w-full text-sm">
                            <thead className="bg-kumo-tint/50 sticky top-0">
                              <tr className="border-b border-kumo-line">
                                {Object.keys(queryResult[0]).map((key) => (
                                  <th key={key} className="px-4 py-2.5 text-left text-xs font-medium text-kumo-strong">{key}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="bg-kumo-base divide-y divide-kumo-line">
                              {queryResult.map((row, i) => (
                                <tr key={i}>
                                  {Object.values(row).map((value, j) => (
                                    <td key={j} className="px-4 py-2 font-mono text-xs">
                                      {value === null ? <span className="text-kumo-inactive italic">NULL</span> : String(value)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-kumo-strong">{queryResult.length} row(s) returned</div>
                    </>
                  ) : <div className="text-sm text-kumo-strong">Query executed successfully. No rows returned.</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="schema" className="flex-1 m-0 overflow-auto p-4">
              {loadingTableInfo ? <DataTableLoading /> : selectedTable && tableInfo ? (
                <TableSchemaPanel schema={tableInfo} />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <GearIcon size={32} className="text-kumo-subtle mb-3" />
                  <p className="text-sm text-kumo-default font-medium">Select a table</p>
                  <p className="text-xs text-kumo-strong mt-1">Choose a table from the sidebar to view its schema</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {tableInfo && <RowEditorDialog open={showRowEditor} onOpenChange={setShowRowEditor} schema={tableInfo} row={editingRow} onSave={handleRowSave} isSaving={insertRowMutation.isPending || updateRowMutation.isPending} />}
      {tableInfo && <DummyDataGeneratorDialog open={showDummyDataDialog} onOpenChange={setShowDummyDataDialog} schema={tableInfo} onGenerate={handleGenerateDummyData} isGenerating={isGeneratingDummyData} progress={dummyDataProgress} />}
      <Toaster />
    </div>
  )
}

export default D1Explorer
