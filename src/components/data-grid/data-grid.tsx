/* eslint-disable react-hooks/refs */
"use client"

import { Plus } from "lucide-react"
import * as React from "react"
import { DataGridColumnHeader } from "@/components/data-grid/data-grid-column-header"
import { DataGridContextMenu } from "@/components/data-grid/data-grid-context-menu"
import { DataGridPasteDialog } from "@/components/data-grid/data-grid-paste-dialog"
import { DataGridRow } from "@/components/data-grid/data-grid-row"
import { DataGridSearch } from "@/components/data-grid/data-grid-search"
import { useAsRef } from "@/hooks/use-as-ref"
import type { useDataGrid } from "@/hooks/use-data-grid"
import {
  flexRender,
  getColumnBorderVisibility,
  getColumnPinningStyle,
} from "@/lib/data-grid"
import { cn } from "@/lib/utils"
import type { Direction } from "@/types/data-grid"

const EMPTY_CELL_SELECTION_SET = new Set<string>()

interface DataGridProps<TData>
  extends
    Omit<ReturnType<typeof useDataGrid<TData>>, "dir">,
    Omit<React.ComponentProps<"div">, "contextMenu"> {
  dir?: Direction
  height?: number
  stretchColumns?: boolean
}

export function DataGrid<TData>({
  dataGridRef,
  headerRef,
  rowMapRef,
  footerRef,
  dir = "ltr",
  table,
  tableMeta,
  virtualTotalSize,
  virtualItems,
  measureElement,
  columns,
  columnSizeVars,
  searchState,
  searchMatchesByRow,
  activeSearchMatch,
  cellSelectionMap,
  focusedCell,
  editingCell,
  rowHeight,
  contextMenu,
  pasteDialog,
  onRowAdd: onRowAddProp,
  height = 600,
  stretchColumns = false,
  adjustLayout = false,
  className,
  ...props
}: DataGridProps<TData>) {
  const rows = table.getRowModel().rows
  const readOnly = tableMeta?.readOnly ?? false
  const columnVisibility = table.getState().columnVisibility
  const columnPinning = table.getState().columnPinning

  const onRowAddRef = useAsRef(onRowAddProp)

  const onRowAdd = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      onRowAddRef.current?.(event)
    },
    [onRowAddRef]
  )

  const onDataGridContextMenu = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault()
    },
    []
  )

  const onFooterCellKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!onRowAddRef.current) return

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        onRowAddRef.current()
      }
    },
    [onRowAddRef]
  )

  return (
    <div
      data-slot="grid-wrapper"
      dir={dir}
      {...props}
      className={cn(
        "relative flex w-full max-w-full min-w-0 flex-col",
        className
      )}
    >
      {searchState && <DataGridSearch {...searchState} />}
      <DataGridContextMenu
        tableMeta={tableMeta}
        columns={columns}
        contextMenu={contextMenu}
      />
      <DataGridPasteDialog tableMeta={tableMeta} pasteDialog={pasteDialog} />
      <div
        role="grid"
        aria-label="Data grid"
        aria-rowcount={rows.length + (onRowAddProp ? 1 : 0)}
        aria-colcount={columns.length}
        data-slot="grid"
        tabIndex={0}
        ref={dataGridRef}
        
        className="relative grid w-full max-w-full overflow-x-auto overflow-y-auto rounded-md border border-zinc-200 bg-white p-0 shadow-sm select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/20"
        style={{
          ...columnSizeVars,
          maxHeight: `${height}px`,
        }}
        onContextMenu={onDataGridContextMenu}
        id="grid-wrapper"
      >
        <div
          role="rowgroup"
          data-slot="grid-header"
          ref={headerRef}
          className="sticky top-0 z-10 grid border-b border-zinc-200 bg-zinc-50/95 backdrop-blur"
        >
          {table.getHeaderGroups().map((headerGroup, rowIndex) => (
            <div
              key={headerGroup.id}
              role="row"
              aria-rowindex={rowIndex + 1}
              data-slot="grid-header-row"
              tabIndex={-1}
              className="flex w-full"
            >
              {headerGroup.headers.map((header, colIndex) => {
                const sorting = table.getState().sorting
                const currentSort = sorting.find(
                  (sort) => sort.id === header.column.id
                )
                const isSortable = header.column.getCanSort()

                const nextHeader = headerGroup.headers[colIndex + 1]
                const isLastColumn = colIndex === headerGroup.headers.length - 1

                const { showEndBorder, showStartBorder } =
                  getColumnBorderVisibility({
                    column: header.column,
                    nextColumn: nextHeader?.column,
                    isLastColumn,
                  })

                return (
                  <div
                    key={header.id}
                    role="columnheader"
                    aria-colindex={colIndex + 1}
                    aria-sort={
                      currentSort?.desc === false
                        ? "ascending"
                        : currentSort?.desc === true
                          ? "descending"
                          : isSortable
                            ? "none"
                            : undefined
                    }
                    data-slot="grid-header-cell"
                    tabIndex={-1}
                    className={cn(
                      "relative border-r border-zinc-200/80 last:border-r-0",
                      {
                        grow: stretchColumns && header.column.id !== "select",
                        "border-r-zinc-200":
                          showEndBorder && header.column.id !== "select",
                        "border-l border-l-zinc-200":
                          showStartBorder && header.column.id !== "select",
                      }
                    )}
                    style={{
                      ...getColumnPinningStyle({ column: header.column, dir }),
                      width: `calc(var(--header-${header.id}-size) * 1px)`,
                    }}
                  >
                    {header.isPlaceholder ? null : typeof header.column
                        .columnDef.header === "function" ? (
                      <div className="size-full px-3 py-1.5">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </div>
                    ) : (
                      <DataGridColumnHeader header={header} table={table} />
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        <div
          role="rowgroup"
          data-slot="grid-body"
          className="relative grid"
          style={{
            height: `${virtualTotalSize}px`,
            contain: adjustLayout ? "layout paint" : "strict",
          }}
        >
          {virtualItems.map((virtualItem) => {
            const row = rows[virtualItem.index]
            if (!row) return null

            const cellSelectionKeys =
              cellSelectionMap?.get(virtualItem.index) ??
              EMPTY_CELL_SELECTION_SET

            const searchMatchColumns =
              searchMatchesByRow?.get(virtualItem.index) ?? null
            const isActiveSearchRow =
              activeSearchMatch?.rowIndex === virtualItem.index

            return (
              <DataGridRow
                key={row.id}
                row={row}
                tableMeta={tableMeta}
                rowMapRef={rowMapRef}
                virtualItem={virtualItem}
                measureElement={measureElement}
                rowHeight={rowHeight}
                columnVisibility={columnVisibility}
                columnPinning={columnPinning}
                focusedCell={focusedCell}
                editingCell={editingCell}
                cellSelectionKeys={cellSelectionKeys}
                searchMatchColumns={searchMatchColumns}
                activeSearchMatch={isActiveSearchRow ? activeSearchMatch : null}
                dir={dir}
                adjustLayout={adjustLayout}
                stretchColumns={stretchColumns}
                readOnly={readOnly}
              />
            )
          })}
        </div>
        {!readOnly && onRowAdd && (
          <div
            role="rowgroup"
            data-slot="grid-footer"
            ref={footerRef}
            className="sticky bottom-0 z-10 grid border-t border-zinc-200 bg-white"
          >
            <div
              role="row"
              aria-rowindex={rows.length + 2}
              data-slot="grid-add-row"
              tabIndex={-1}
              className="flex w-full"
            >
              <div
                role="gridcell"
                tabIndex={0}
                className="relative m-3 flex h-9 grow items-center bg-zinc-50/60 transition-colors hover:bg-zinc-100 focus:bg-zinc-100 focus:outline-none"
                style={{
                  width: "100%",
                  minWidth: 0,
                }}
                // onClick={onRowAdd}
                // onKeyDown={onFooterCellKeyDown}
              >
                <div
                  role="button"
                  tabIndex={0}
                  className="sticky inset-s-0 flex cursor-pointer items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-xs transition-colors hover:border-teal-600 hover:text-teal-700"
                  onClick={onRowAdd}
                  onKeyDown={onFooterCellKeyDown}
                >
                  <Plus className="size-4" />
                  <span>Add field</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
