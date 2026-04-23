import type { ColumnDef } from "@tanstack/react-table"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { useDataGrid } from "@/hooks/use-data-grid"
import type { KeyValueItemData } from "@/components/ui/key-value"
import ValidValueDialog from "@/components/keyValue"
import { DataGrid } from "@/components/data-grid/data-grid"
import { DataGridKeyboardShortcuts } from "@/components/data-grid/data-grid-keyboard-shortcuts"
import type { DataGridCellProps } from "@/types/data-grid"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMutation, useQuery } from "@tanstack/react-query"
import { fetchLinkedUDO } from "@/api/userTableMD"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createUdoWithBatch } from "@/api/udoBatch"
import { toast } from "sonner"

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

const yesNoDefaultOptions = [
  { label: "Yes", value: "tYES" },
  { label: "No", value: "tNO" },
]

const tableTypeByTab = {
  header: "bott_Document",
  row: "bott_DocumentLines",
} as const

const subtypeOptionsByType: Record<string, { label: string; value: string }[]> =
  {
    db_float: [
      { label: "Sum", value: "st_sum" },
      { label: "Price", value: "price" },
      { label: "Quantity", value: "quantity" },
      { label: "Percentage", value: "percentage" },
    ],
    db_Memo: [
      { label: "None", value: "st_none" },
      { label: "Phone", value: "st_phone" },
      { label: "Address", value: "st_address" },
    ],
    db_Alpha: [
      { label: "None", value: "st_none" },
      { label: "Checkbox", value: "st_checkbox" },
    ],
  }

function getDefaultSubtype(type: string) {
  const options = subtypeOptionsByType[type] ?? []

  if (type === "db_float") {
    return options.find((option) => option.value === "st_sum")?.value ?? ""
  }

  return options.find((option) => option.value === "st_none")?.value ?? ""
}

function createEmptyRow(): TableRow {
  return {
    id: crypto.randomUUID(),
    name: "",
    description: "",
    type: "",
    subtype: "",
    value: [{ key: "", value: "", id: "" }] as KeyValueItemData[],
    linkeUDO: "",
    linkesystemobj: "",
    mandatory: false,
    default: "",
  }
}

const initialRows: TableRow[] = [createEmptyRow()]

function loadSavedRows(): TableRow[] {
  const saved = localStorage.getItem("tableRows")

  if (!saved) return initialRows

  try {
    const parsed = JSON.parse(saved)

    if (Array.isArray(parsed)) return parsed
    if (Array.isArray(parsed?.value)) return parsed.value

    return initialRows
  } catch {
    return initialRows
  }
}
type LinkedUDO = {
  TableName: string
  TableDescription: string
}
export function LinkedUDOCell(props: DataGridCellProps<TableRow>) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const type = props.cell.row.original.type
  const subtype = props.cell.row.original.subtype

  const isAllowedType = type === "db_Alpha" || type === "db_numeric"
  const isCheckbox = subtype === "st_checkbox"

  const isDisabled = !isAllowedType || isCheckbox
  const val = props.cell.row.original.linkeUDO ?? ""
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

  const debounceID = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const debouncedOnSelect = (table:LinkedUDO) => {
    
    if (debounceID.current) {
      clearTimeout(debounceID.current)
    }
    debounceID.current = setTimeout(() => {
       
      props.tableMeta?.onDataUpdate?.({
        rowIndex: props.rowIndex,
        columnId: props.columnId,
        value: table.TableName,
      })
      setOpen(false)
    }, 5000)
  }

  if (isDisabled) {
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
        <DialogTitle className="border-b p-3 font-medium mb-2">
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
                    // onSelect={() => {
                    //   props.tableMeta?.onDataUpdate?.({
                    //     rowIndex: props.rowIndex,
                    //     columnId: props.columnId,
                    //     value: udo.TableName,
                    //   })
                    //   setOpen(false)
                    // }}
                    onSelect={() => debouncedOnSelect(udo)}
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

const Create = () => {
  const [rows, setRows] = React.useState<TableRow[]>(loadSavedRows)
  const [openDialog, setOpenDialog] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<"header" | "row">("header")
  const [activeRow, setActiveRow] = React.useState<TableRow | null>(null)

  const tableSchema = z.object({
    tableName: z.string().min(1, "Table name is required"),
    description: z.string().min(1, "Description is required"),
  })

  const form = useForm<TableFormValues>({
    resolver: zodResolver(tableSchema),
    defaultValues: {
      tableName: "",
      description: "",
    },
  })
  type TableFormValues = z.infer<typeof tableSchema>

  const createMutation = useMutation({
    mutationFn: async ({
      table,
      fields,
    }: {
      table: {
        tableName: string
        tableDescription: string
        tableType: "bott_Document" | "bott_DocumentLines"
      }
      fields: Array<{
        name: string
        type: string
        size?: number
        description: string
        subType?: string
        defaultValue?: string
        mandatory: boolean
        linkedUDO?: string
        linkedSystemObject?: string
        validValues: Array<{ key: string; value: string }>
      }>
    }) => {
    
      return createUdoWithBatch(table, fields)
    },
    onSuccess: () => {
      toast.success("Table and fields created successfully.")
      localStorage.removeItem("tableRows")
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to create table."
      )
    },
  })

  const onSubmit = (values: TableFormValues) => {
   
    if (!values.tableName) {
      toast.error("Add table name before creating the table.")
      return
    }
    if (!values.description) {
      toast.error("Add description name before creating the table.")
      return
    }

    const fields = rows.map((row) => ({
      name: row.name.trim(),
      type: row.type,
      size: row.type === "db_Alpha" ? row.size : undefined,
      description: row.description.trim(),
      subType: row.subtype,
      defaultValue: row.default,
      mandatory: row.mandatory ?? false,
      linkedUDO: row.linkeUDO,
      linkedSystemObject: row.linkesystemobj,
      validValues:
        row.value?.map((item) => ({
          key: String(item.key ?? "").trim(),
          value: String(item.value ?? "").trim(),
        })) ?? [],
    }))
    // .filter((field) => field.name && field.description && field.type)

    if (fields.length === 0) {
      toast.error("Add at least one valid field before creating the table.")
      return
    }

    createMutation.mutate({
      table: {
        tableName: values.tableName.trim(),
        tableDescription: values.description.trim(),
        tableType: tableTypeByTab[activeTab],
      },
      fields,
    })
  }

  const columns = React.useMemo<ColumnDef<TableRow>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Name",
        meta: {
          customCell: (props) => {
            const row = props.cell.row.original
            return (
              <Input
                value={row.name ?? ""}
                placeholder="Enter name"
                className="size-full border-none bg-transparent px-2 py-1.5 focus-visible:ring-0"
                onChange={(e) => {
                 
                  props.tableMeta?.onDataUpdate?.({
                    rowIndex: props.rowIndex,
                    columnId: "name",
                    value: e.target.value,
                  })
                }}
                onClick={(e) => e.stopPropagation()}
              />
            )
          },
        },
      },
      {
        id: "description",
        accessorKey: "description",
        header: "Description",
        meta: {
          customCell: (props) => {
            const row = props.cell.row.original

            return (
              <Input
                value={row.description ?? ""}
                placeholder="Enter description"
                className="size-full border-none bg-transparent px-2 py-1.5 focus-visible:ring-0"
                onChange={(e) => {
               
                  props.tableMeta?.onDataUpdate?.({
                    rowIndex: props.rowIndex,
                    columnId: "description",
                    value: e.target.value,
                  })
                }}
                onClick={(e) => e.stopPropagation()}
              />
            )
          },
        },
      },
      {
        id: "type",
        accessorKey: "type",
        header: "Type",
        meta: {
          cell: {
            variant: "select",
            placeholder: "select type",
            options: [
              { label: "Text", value: "db_Alpha" },
              { label: "Long Text", value: "db_Memo" },
              { label: "Integer", value: "db_numeric" },
              { label: "Decimal", value: "db_float" },
              { label: "Date", value: "date" },
            ],
          },
        },
      },
      {
        id: "size",
        accessorKey: "size",
        header: "Size",
        meta: {
          customCell: (props: DataGridCellProps<TableRow>) => {
            const row = props.cell.row.original
            const isSizeEnabled = row.type === "db_Alpha" && !props.readOnly

            return (
              <Input
                type="number"
                value={row.size ?? ""}
                min={0}
                max={254}
                disabled={!isSizeEnabled}
                placeholder="Enter Size"
                className={`size-full rounded-none border-none bg-transparent px-2 py-1.5 shadow-none focus-visible:ring-0 enabled:cursor-pointer disabled:cursor-not-allowed disabled:text-zinc-400 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                onChange={(event) => {
                  const value = event.target.value
                  const size =
                    value === ""
                      ? undefined
                      : Math.min(Math.max(Number(value), 1), 254)

                  props.tableMeta?.onDataUpdate?.({
                    rowIndex: props.rowIndex,
                    columnId: props.columnId,
                    value: size,
                  })
                }}
                onClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
              />
            )
          },
        },
      },
      {
        id: "subtype",
        accessorKey: "subtype",
        header: "Sub Type",
        meta: {
          customCell: (props: DataGridCellProps<TableRow>) => {
            const row = props.cell.row.original
            const options = subtypeOptionsByType[row.type] ?? []
            const displayLabel =
              options.find((option) => option.value === row.subtype)?.label ??
              ""
            return (
              <Select
                value={row.subtype ?? ""}
                disabled={!options.length || props.readOnly}
                onOpenChange={(open) => {
                  if (open && !props.readOnly) {
                    props.tableMeta?.onCellEditingStart?.(
                      props.rowIndex,
                      props.columnId
                    )
                  } else {
                    props.tableMeta?.onCellEditingStop?.()
                  }
                }}
                onValueChange={(value) => {
                  props.tableMeta?.onDataUpdate?.({
                    rowIndex: props.rowIndex,
                    columnId: props.columnId,
                    value,
                  })
                }}
              >
                <SelectTrigger
                  size="sm"
                  className="size-full items-start border-none p-0 shadow-none focus-visible:ring-0 dark:bg-transparent [&_svg]:hidden"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  {displayLabel ? (
                    <Badge
                      variant="secondary"
                      className="px-1.5 py-px whitespace-pre-wrap"
                    >
                      <SelectValue placeholder="Select subtype" />
                    </Badge>
                  ) : (
                    <SelectValue placeholder="Select subtype" />
                  )}
                </SelectTrigger>
                <SelectContent
                  data-grid-cell-editor=""
                  align="start"
                  alignOffset={-8}
                  sideOffset={-8}
                  className="min-w-[calc(var(--radix-select-trigger-width)+16px)]"
                >
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          },
        },
      },
      {
        id: "validValue",
        header: "Valid Value",
        accessorFn: (row) => row.value?.length ?? 0,
        meta: {
          customCell: (props: DataGridCellProps<TableRow>) => {
            const isValidValueEnabled =
              props.cell.row.original.type === "db_Alpha" &&
              props.cell.row.original.subtype !== "st_checkbox" &&
              !props.readOnly

            return (
              <div className="h-7 px-3 py-1">
                <Button
                  onClick={() => {
                    if (!isValidValueEnabled) return
                    setOpenDialog(true)
                    setActiveRow(props.cell.row.original)
                  }}
                  disabled={!isValidValueEnabled}
                  className="h-7 cursor-pointer text-center text-sm disabled:cursor-not-allowed"
                >
                  Open
                </Button>
              </div>
            )
          },
        },
      },
      {
        id: "linkeUDO",
        accessorKey: "linkeUDO",
        header: "Linked UDO",
        meta: {
          customCell: (props: DataGridCellProps<TableRow>) => {
            return <LinkedUDOCell {...props} />
          },
        },
      },
      {
        id: "linkesystemobj",
        accessorKey: "linkesystemobj",
        header: "Linked System Object",
        meta: {
          customCell: (props: DataGridCellProps<TableRow>) => {
            const val = props.cell.row.original.linkesystemobj
            const type = props.cell.row.original.type
            const subtype = props.cell.row.original.subtype
            const isAllowedType = type === "db_Alpha" || type === "db_numeric"
            const isCheckbox = subtype === "st_checkbox"
            const isDisabled = !isAllowedType || isCheckbox
            if (isDisabled) {
              return (
                <button
                  disabled
                  className="w-full cursor-not-allowed px-2 py-1 text-left text-gray-400"
                >
                  Enter Linked System Object
                </button>
              )
            }
            return (
              <Input
                value={val ?? ""}
                placeholder="Enter Linked System Object"
                className="size-full border-none bg-transparent px-2 py-1.5 focus-visible:ring-0"
                onChange={(e) => {
                 
                  props.tableMeta?.onDataUpdate?.({
                    rowIndex: props.rowIndex,
                    columnId: "linkesystemobj",
                    value: e.target.value,
                  })
                }}
                onClick={(e) => e.stopPropagation()}
              />
            )
          },
        },
      },
      {
        id: "mandatory",
        accessorKey: "mandatory",
        header: "Mandatory",
        meta: {
          cell: {
            variant: "checkbox",
          },
        },
      },
      {
        id: "default",
        accessorKey: "default",
        header: "Default",
        meta: {
          customCell: (props: DataGridCellProps<TableRow>) => {
            const row = props.cell.row.original
            const validValueOptions =
              row.value
                ?.map((item) => ({
                  label: item.value || item.key,
                  value: item.key || item.value,
                }))
                .filter((item) => item.label.trim() && item.value.trim()) ?? []

            const options = row.mandatory
              ? yesNoDefaultOptions
              : validValueOptions

            const displayLabel =
              options.find((option) => option.value === row.default)?.label ??
              ""

            if (row.mandatory || validValueOptions.length > 0) {
              return (
                <Select
                  value={row.default ?? ""}
                  disabled={!options.length || props.readOnly}
                  onOpenChange={(open) => {
                    if (open && !props.readOnly) {
                      props.tableMeta?.onCellEditingStart?.(
                        props.rowIndex,
                        props.columnId
                      )
                    } else {
                      props.tableMeta?.onCellEditingStop?.()
                    }
                  }}
                  onValueChange={(value) => {
                    props.tableMeta?.onDataUpdate?.({
                      rowIndex: props.rowIndex,
                      columnId: props.columnId,
                      value,
                    })
                  }}
                >
                  <SelectTrigger
                    size="sm"
                    className="size-full items-start border-none p-0 shadow-none focus-visible:ring-0 dark:bg-transparent [&_svg]:hidden"
                    onClick={(event) => event.stopPropagation()}
                    onPointerDown={(event) => event.stopPropagation()}
                  >
                    {displayLabel ? (
                      <Badge
                        variant="secondary"
                        className="px-1.5 py-px whitespace-pre-wrap"
                      >
                        <SelectValue placeholder="Select default" />
                      </Badge>
                    ) : (
                      <SelectValue placeholder="Select default" />
                    )}
                  </SelectTrigger>
                  <SelectContent
                    data-grid-cell-editor=""
                    align="start"
                    alignOffset={-8}
                    sideOffset={-8}
                    className="min-w-[calc(var(--radix-select-trigger-width)+16px)]"
                  >
                    {options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )
            }

            return (
              <Input
                value={row.default ?? ""}
                disabled={props.readOnly}
                placeholder="Enter default"
                className="size-full rounded-none border-none bg-transparent px-2 py-1.5 shadow-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:text-zinc-400"
                onChange={(event) => {
                  props.tableMeta?.onDataUpdate?.({
                    rowIndex: props.rowIndex,
                    columnId: props.columnId,
                    value: event.target.value,
                  })
                }}
                onClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
              />
            )
          },
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const onRowAdd = React.useCallback(() => {
    let newIndex = 0
    setRows((currentRows) => {
      

      newIndex = currentRows.length
      return [...currentRows, createEmptyRow()]
    })
    return {
      rowIndex: newIndex,
      columnId: "name",
    }
  }, [])

  const handleDataChange = React.useCallback((data: TableRow[]) => {
    setRows(
      data.map((row) => {
        const options = subtypeOptionsByType[row.type] ?? [] //list of option

        const subtype = options.some((o) => o.value === row.subtype)
          ? row.subtype
          : getDefaultSubtype(row.type)

        const isCheckbox = subtype === "st_checkbox"

        const validValues =
          row.value?.map((v) => v.key || v.value).filter(Boolean) ?? []

        const defaultOptions = row.mandatory
          ? ["tYES", "tNO"]
          : validValues.length
            ? validValues
            : null

        return {
          ...row,
          size:
            row.type === "db_Alpha"
              ? Math.min(Math.max(row.size ?? 1, 1), 254)
              : undefined,
          subtype,
          value: isCheckbox ? [] : row.value,
          default:
            !defaultOptions || defaultOptions.includes(row.default!)
              ? row.default
              : "",
        }
      })
    )
  }, [])
  const { table, ...dataGridProps } = useDataGrid({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    onDataChange: handleDataChange,
    onRowAdd,
    enableSearch: true,
    readOnly: false,
    enablePaste: true,
  })

  return (
    <section className="max-w-9xl mx-auto flex min-h-screen w-full flex-col gap-5 bg-[#f7f8fb] px-4 py-5 text-zinc-950 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal text-zinc-950 sm:text-4xl">
              Create Fields
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600 sm:text-base">
              Define clean field names, descriptions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as "header" | "row")}
            >
              <TabsList className="rounded-md bg-zinc-100 p-1">
                <TabsTrigger
                  value="header"
                  className="rounded-md px-4 py-1.5 text-sm data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-md"
                >
                  Header
                </TabsTrigger>

                <TabsTrigger
                  value="row"
                  className="rounded-md px-4 py-1.5 text-sm data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm"
                >
                  Row
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              disabled={createMutation.isPending}
              className="cursor-pointer bg-teal-700 text-white hover:bg-teal-800"
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Table Name</Label>
            <Input
              placeholder="Enter table name"
              {...form.register("tableName")}
            />
          </div>

          <div className="space-y-2">
            <Label>Table Description</Label>
            <Input
              placeholder="Enter table description"
              {...form.register("description")}
            />
          </div>
        </div>
        <div className="p-3 sm:p-5">
          <DataGridKeyboardShortcuts
            enableSearch
            enableUndoRedo
            enablePaste
            enableRowAdd={false}
            enableRowsDelete={false}
          />

          <DataGrid table={table} stretchColumns {...dataGridProps} />
        </div>
        <ValidValueDialog
          open={openDialog}
          onOpenChange={setOpenDialog}
          row={activeRow}
          onSave={(data) => {
            if (!activeRow) return

            setRows((prev) => {
              const updated = prev.map((r) =>
                r.id === activeRow.id ? { ...r, value: data } : r
              )

              localStorage.setItem("tableRows", JSON.stringify(updated))

              return updated
            })
          }}
        />
      </div>
    </section>
  )
}

export default Create
