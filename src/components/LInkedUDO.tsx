import { fetchLinkedUDO } from "@/api/userTableMD"
import type { DataGridCellProps } from "@/types/data-grid"
import { useQuery } from "@tanstack/react-query"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { KeyValueItemData } from "./ui/key-value"

import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
} from "@/components/ui/command"
type TableRow = {
  id: string
  name: string
  description: string
  type: string
  subtype?: string
  value?: KeyValueItemData[]
  linkeUDO?: string
  linkesystemobj?: string
  size?: number
  mandatory?: boolean
  default?: string
  enable?: boolean
}
export default function LinkedUDOCell(props: DataGridCellProps<TableRow>) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const type = props.cell.row.original.type
  const subtype = props.cell.row.original.subtype

  const isAllowedType = type === "db_Alpha" || type === "db_numeric"
  const isCheckbox = subtype === "st_checkbox"

  const isDisabled = !isAllowedType || isCheckbox
  const val = props.cell.row.original.linkeUDO ?? ""

  const linkesystemobj = props.cell.row.original.linkesystemobj ? true : false

  const {
    data: linkedUDOData = [],
    isLoading,
    isFetching,
    isError,
  } = useQuery({
    queryKey: ["linkedudo", search.trim()],
    queryFn: () => fetchLinkedUDO(search),
    enabled: open,
  })

  

  if (isDisabled || linkesystemobj) {
    return (
      <button
        disabled
        className="w-full cursor-not-allowed px-2 py-1 text-left text-gray-400"
      >
        Select Linked UDO
      </button>
    )
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)

        if (nextOpen) {
          setSearch("")
        }

        if (nextOpen && !props.readOnly) {
          props.tableMeta?.onCellEditingStart?.(props.rowIndex, props.columnId)
        } else {
          props.tableMeta?.onCellEditingStop?.()
        }
      }}
    >
      <DialogTrigger asChild>
        <button
          disabled={props.readOnly}
          className="w-full px-2 py-1 text-left"
          onClick={(event) => event.stopPropagation()}
        >
          {val || "Select linked UDO"}
        </button>
      </DialogTrigger>
      <DialogContent
        className="max-w-md p-0"
        data-grid-cell-editor=""
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <DialogTitle className="mb-2 border-b p-3 font-medium">
          Select Linked UDO
        </DialogTitle>
        <DialogDescription className="-mt-3 -mb-8 px-3">
          Choose a linked user from the list.
        </DialogDescription>
        <Command shouldFilter={false}>
          <CommandInput
            autoFocus
            placeholder="Search UDO..."
            value={search}
            onValueChange={setSearch}
          />

          <CommandList className="max-h-64 overflow-y-auto">
            {isLoading || isFetching ? (
              <CommandEmpty>Loading linked UDOs...</CommandEmpty>
            ) : isError ? (
              <CommandEmpty>Could not load linked UDOs.</CommandEmpty>
            ) : linkedUDOData.length === 0 ? (
              <CommandEmpty>No results found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {linkedUDOData.map((udo) => (
                  <CommandItem
                    key={udo.TableName}
                    value={udo.TableName}
                    onSelect={() => {
                      props.tableMeta?.onDataUpdate?.({
                        rowIndex: props.rowIndex,
                        columnId: props.columnId,
                        value: udo.TableName,
                      })
                      setOpen(false)
                    }}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{udo.TableName}</span>
                      <span className="text-xs text-muted-foreground">
                        {udo.TableDescription || "No description"}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
