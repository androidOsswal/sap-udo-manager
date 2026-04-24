import type { ColumnDef } from "@tanstack/react-table"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { useDataGrid } from "@/hooks/use-data-grid"
import type { KeyValueItemData } from "@/components/ui/key-value"
import ValidValueDialog from "@/components/keyValue"
import { DataGrid } from "@/components/data-grid/data-grid"
import { DataGridKeyboardShortcuts } from "@/components/data-grid/data-grid-keyboard-shortcuts"
import type { DataGridCellProps } from "@/types/data-grid"
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
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  fetchUserTables,
  fetchTableFields,
  updateTableField,
} from "@/api/userTableMD"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
} from "@/components/ui/command"

export type UserTableMD = {
  TableName: string
  TableDescription: string
  TableType: "bott_Document" | "bott_DocumentLines"
}

function TableSelectorDialog({
  mode,
  value,
  onSelect,
  tableType,
  disable,
}: {
  mode: "name" | "description"
  value: string
  onSelect: (table: UserTableMD) => void
  tableType: string
  disable?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const { data: userTables = [] } = useQuery({
    queryKey: ["userTables", tableType, search],
    queryFn: () => fetchUserTables(search),
    enabled: open,
  })
  console.log(userTables)

  const filtered = userTables.filter((t) => {
    const text = mode === "name" ? t.TableName : t.TableDescription
    return text?.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-full rounded-md border border-input bg-transparent px-3 py-1 text-left">
          {value ||
            (mode === "name" ? "Select Table Name" : "Select Description")}
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-md p-0">
        <DialogTitle className="border-b p-3">
          {mode === "name" ? "Select Table Name" : "Select Description"}
        </DialogTitle>

        <Command shouldFilter={false}>
          <CommandInput
            autoFocus
            placeholder={
              mode === "name" ? "Search table..." : "Search description..."
            }
            value={search}
            onValueChange={setSearch}
          />

          <CommandList className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <CommandEmpty>No results found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filtered.map((t) => (
                  <CommandItem
                    key={t.TableName}
                    disabled={disable}
                    value={mode === "name" ? t.TableName : t.TableDescription}
                    onSelect={() => {
                      onSelect(t)
                      setOpen(false)
                    }}
                  >
                    {/* {mode === "name" ? (
                      <span className="font-medium">{t.TableName}</span>
                    ) : (
                      <span className="font-medium">
                        {t.TableDescription || "No description"}
                      </span>
                    )}
                 */}
                    <div className="flex flex-col gap-0.5 py-1">
                      <span className="font-medium">{t.TableName}</span>
                      <span className="text-xs text-zinc-500">
                        {t.TableDescription || "No description"}
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
type TableRow = {
  id: string
  fieldId?: number //FieldID, need for PATCH
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
}

//constan

const yesNoDefaultOptions = [
  { label: "Yes", value: "tYES" },
  { label: "No", value: "tNO" },
]
const typeOptionByValue: Record<string, { label?: string; value: string }[]> = {
  db_Alpha: [{ value: "db_Alpha", label: "Text" }],
  db_Memo: [{ value: "db_Memo", label: "Long Text" }],
  db_Numeric: [{ value: "db_Numeric", label: "Integer" }],
  db_Float: [{ value: "db_Float", label: "Decimal" }],
  db_Date: [{ value: "db_Date", label: "Date" }],
}
const subtypeOptionsByType: Record<string, { label: string; value: string }[]> =
  {
    db_Float: [
      { label: "Sum", value: "st_Sum" },
      { label: "Price", value: "st_Price" },
      { label: "Quantity", value: "st_Quantity" },
      { label: "Percentage", value: "st_Percentage" },
    ],
    db_Memo: [
      { label: "None", value: "st_None" },
      { label: "Phone", value: "st_Phone" },
      { label: "Address", value: "st_Address" },
    ],
    db_Alpha: [
      { label: "None", value: "st_None" },
      { label: "Checkbox", value: "st_Checkbox" },
    ],
  }

function getDefaultSubtype(type: string) {
  const options = subtypeOptionsByType[type] ?? []
  if (type === "db_Float")
    return options.find((o) => o.value === "st_Sum")?.value ?? ""
  return options.find((o) => o.value === "st_None")?.value ?? ""
}

// Map field to TableRow
function mapFieldToRow(
  field: import("@/api/userTableMD").UserFieldMD
): TableRow {
  return {
    id: String(field.FieldID),
    fieldId: field.FieldID,
    name: field.Name ?? "",
    description: field.Description ?? "",
    type: field.Type ?? "",
    subtype: field.SubType ?? "",
    size: field.Size,
    linkeUDO: field.LinkedUDO ?? "",
    linkesystemobj: field.LinkedSystemObject ?? "",
    mandatory: field.Mandatory === "tYES",
    default: field.DefaultValue ?? "",
    value:
      field.ValidValuesMD?.map((v) => ({
        id: v.Value,
        key: v.Value,
        value: v.Description,
      })) ?? [],
  }
}

// Map TableRow payload
function mapRowToPayload(row: TableRow) {
  const validValues =
    row.value
      ?.map((item) => ({
        Value: String(item.key ?? "").trim(),
        Description: String(item.value ?? "").trim(),
      }))
      .filter((v) => v.Value && v.Description) ?? []
  const mandatoryValue: "tYES" | "tNO" = row.mandatory ? "tYES" : "tNO"

  return {
    Description: row.description.trim(),
    SubType: row.subtype ?? "",
    Size:
      row.type === "db_Alpha"
        ? Math.min(Math.max(row.size ?? 1, 1), 254)
        : row.type === "db_Numeric"
          ? 11
          : undefined,
    DefaultValue: row.default?.trim() || null,
    // Mandatory: row.mandatory ? "tYES" : "tNO",
    Mandatory: mandatoryValue,
    LinkedUDO: row.linkeUDO?.trim() || null,
    LinkedSystemObject: row.linkesystemobj?.trim() || null,
    ValidValuesMD: validValues,
  }
}

// function LinkedUDOCell(props: DataGridCellProps<TableRow>) {
//   const [open, setOpen] = React.useState(false)
//   const [search, setSearch] = React.useState("")
//   const type = props.cell.row.original.type
//   const subtype = props.cell.row.original.subtype
//   const isAllowedType = type === "db_Alpha" || type === "db_Numeric"
//   const isCheckbox = subtype === "st_Checkbox"
//   const isDisabled = !isAllowedType || isCheckbox
//   const val = props.cell.row.original.linkeUDO ?? ""

//   const {
//     data: linkedUDOData = [],
//     isLoading,
//     isFetching,
//     isError,
//   } = useQuery({
//     queryKey: ["linkedudo", search.trim()],
//     queryFn: () => fetchLinkedUDO(search),
//     enabled: open,
//   })

//   if (isDisabled) {
//     return (
//       <button
//         disabled
//         className="w-full cursor-not-allowed px-2 py-1 text-left text-gray-400"
//       >
//         Select Linked UDO
//       </button>
//     )
//   }

//   return (
//     <Dialog
//       open={open}
//       onOpenChange={(nextOpen) => {
//         setOpen(nextOpen)
//         if (nextOpen) setSearch("")
//         if (nextOpen && !props.readOnly) {
//           props.tableMeta?.onCellEditingStart?.(props.rowIndex, props.columnId)
//         } else {
//           props.tableMeta?.onCellEditingStop?.()
//         }
//       }}
//     >
//       <DialogTrigger asChild>
//         <button
//           disabled={props.readOnly}
//           className="w-full px-2 py-1 text-left"
//           onClick={(e) => e.stopPropagation()}
//         >
//           {val || "Select linked UDO"}
//         </button>
//       </DialogTrigger>
//       <DialogContent
//         className="max-w-md p-0"
//         data-grid-cell-editor=""
//         onClick={(e) => e.stopPropagation()}
//         onKeyDown={(e) => e.stopPropagation()}
//         onPointerDown={(e) => e.stopPropagation()}
//       >
//         <DialogTitle className="border-b p-3 font-medium">
//           Select Linked UDO
//         </DialogTitle>
//         <DialogDescription className="-mt-3 -mb-8 px-3">
//           Choose a linked UDO from the list.
//         </DialogDescription>
//         <Command shouldFilter={false}>
//           <CommandInput
//             autoFocus
//             placeholder="Search UDO..."
//             value={search}
//             onValueChange={setSearch}
//           />
//           <CommandList className="max-h-64 overflow-y-auto">
//             {isLoading || isFetching ? (
//               <CommandEmpty>Loading linked UDOs...</CommandEmpty>
//             ) : isError ? (
//               <CommandEmpty>Could not load linked UDOs.</CommandEmpty>
//             ) : linkedUDOData.length === 0 ? (
//               <CommandEmpty>No results found.</CommandEmpty>
//             ) : (
//               <CommandGroup>
//                 {linkedUDOData.map((udo) => (
//                   <CommandItem
//                     key={udo.TableName}
//                     value={udo.TableName}
//                     onSelect={() => {
//                       props.tableMeta?.onDataUpdate?.({
//                         rowIndex: props.rowIndex,
//                         columnId: props.columnId,
//                         value: udo.TableName,
//                       })
//                       setOpen(false)
//                     }}
//                   >
//                     <div className="flex flex-col gap-0.5">
//                       <span className="font-medium">{udo.TableName}</span>
//                       <span className="text-xs text-muted-foreground">
//                         {udo.TableDescription || "No description"}
//                       </span>
//                     </div>
//                   </CommandItem>
//                 ))}
//               </CommandGroup>
//             )}
//           </CommandList>
//         </Command>
//       </DialogContent>
//     </Dialog>
//   )
// }

const ManageFields = () => {
  const [rows, setRows] = React.useState<TableRow[]>([])
  const [selectedTableType, setSelectedTableType] = React.useState<string>("")
  const [openDialog, setOpenDialog] = React.useState(false)
  const [activeRow, setActiveRow] = React.useState<TableRow | null>(null)
  const [selectedTableName, setSelectedTableName] = React.useState<string>("")
  const [selectedDescription, setSelectedDescription] = React.useState("")

  // fetch fields when a table is selected
  const {
    data: fetchedFields = [],
    isLoading: isLoadingFields,
    isFetching: isFetchingFields,
  } = useQuery({
    queryKey: ["tableFields", selectedTableName, selectedTableType],
    queryFn: () => fetchTableFields(selectedTableName),
    enabled:
      !!selectedTableName && !!selectedDescription && !!selectedTableType,
  })

  //  fetched fields into  rows
  React.useEffect(() => {
    if (fetchedFields.length > 0) {
      setRows((prev) => {
        // prevent unnecessary reset
        if (prev.length === fetchedFields.length) return prev
        return fetchedFields.map(mapFieldToRow)
      })
    }
  }, [fetchedFields])

  const isTableSelected = !!selectedTableName

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedRows: TableRow[]) => {
      const results = await Promise.allSettled(
        updatedRows
          .filter((row) => row.fieldId !== undefined)
          .map((row) =>
            updateTableField(
              selectedTableName,
              row.fieldId!,
              mapRowToPayload(row)
            )
          )
      )

      const failures = results.filter((r) => r.status === "rejected")
      if (failures.length > 0) {
        throw new Error(
          `${failures.length} field(s) failed to update. Please try again.`
        )
      }
    },
    onSuccess: () => {
      toast.success("Fields updated successfully.")
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to update fields."
      )
    },
  })

  const onSubmit = () => {
    if (!selectedTableName) {
      toast.error("Select a table first.")
      return
    }
    if (rows.length === 0) {
      toast.error("No fields to update.")
      return
    }
    updateMutation.mutate(rows)
  }

  //Columns

  const columns = React.useMemo<ColumnDef<TableRow>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Name",
        meta: {
          customCell: (props) => (
            <span className="w-full cursor-not-allowed px-2 py-1.5 text-sm text-zinc-500">
              {props.cell.row.original.name || "—"}
            </span>
          ),
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
          // customCell: (props: DataGridCellProps<TableRow>) => {
          //   const row = props.cell.row.original

          //   const options = typeOptionByValue[row.type]

          //   const displaylabel =
          //     options?.find((op) => op.value === row.type)?.label ?? ""

          //   return (
          //     <span className="w-full cursor-not-allowed px-2 py-1.5 text-sm text-zinc-500">
          //       {displaylabel}
          //     </span>
          //   )
          // },
          customCell: (props: DataGridCellProps<TableRow>) => {
            const row = props.cell.row.original

            const options = typeOptionByValue[row.type]

            const displaylabel =
              options?.find((op) => op.value === row.type)?.label ?? "—"
            return (
              <span className="w-full cursor-not-allowed px-2 py-1.5 text-sm text-zinc-500">
                {displaylabel}
              </span>
            )
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
                min={1}
                max={254}
                disabled={!isSizeEnabled}
                placeholder="—"
                className="size-full rounded-none border-none bg-transparent px-2 py-1.5 shadow-none focus-visible:ring-0 enabled:cursor-pointer disabled:cursor-not-allowed disabled:text-zinc-400 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                onChange={(e) => {
                  const val = e.target.value
                  const size =
                    val === ""
                      ? undefined
                      : Math.min(Math.max(Number(val), 1), 254)
                  props.tableMeta?.onDataUpdate?.({
                    rowIndex: props.rowIndex,
                    columnId: props.columnId,
                    value: size,
                  })
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
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
              options.find((o) => o.value === row.subtype)?.label ?? ""
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
                    <SelectValue placeholder="—" />
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
              props.cell.row.original.subtype !== "st_Checkbox" &&
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
            //   <LinkedUDOCell {...props} />
            return (
              <span className="w-full cursor-not-allowed px-2 py-1.5 text-sm text-zinc-500">
                {props.cell.row.original.linkeUDO || "—"}
              </span>
            )
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
            const isAllowedType = type === "db_Alpha" || type === "db_Numeric"
            const isCheckbox = subtype === "st_Checkbox"
            const isDisabled = !isAllowedType || isCheckbox
            if (isDisabled) {
              return (
                <button
                  disabled
                  className="w-full cursor-not-allowed px-2 py-1 text-left text-gray-400"
                >
                  —
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
        meta: { cell: { variant: "checkbox" } },
      },
      {
        id: "default",
        accessorKey: "default",
        header: "Default",
        meta: {
          customCell: (props: DataGridCellProps<TableRow>) => {
            const row = props.cell.row.original

            if (!row.mandatory) {
              row.default = ""
            }
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
              options.find((o) => o.value === row.default)?.label ?? ""

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
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    {displayLabel ? (
                      <Badge
                        variant="secondary"
                        className="px-1.5 py-px whitespace-pre-wrap"
                      >
                        <SelectValue placeholder="Select default" />
                      </Badge>
                    ) : (
                      <SelectValue placeholder="—" />
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
                placeholder="—"
                className="size-full rounded-none border-none bg-transparent px-2 py-1.5 shadow-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:text-zinc-400"
                onChange={(e) => {
                  props.tableMeta?.onDataUpdate?.({
                    rowIndex: props.rowIndex,
                    columnId: props.columnId,
                    value: e.target.value,
                  })
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
            )
          },
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const handleDataChange = React.useCallback((data: TableRow[]) => {
    const updated = data.map((row) => {
      const subtypeOptions = subtypeOptionsByType[row.type] ?? []
      const hasValidSubtype =
        !!row.subtype && subtypeOptions.some((o) => o.value === row.subtype)
      const nextSubtype = hasValidSubtype
        ? row.subtype
        : getDefaultSubtype(row.type)
      const isCheckboxSubtype = nextSubtype === "st_Checkbox"
      const validValueDefaultOptions =
        row.value
          ?.map((item) => item.key || item.value)
          .filter((v): v is string => Boolean(v?.trim())) ?? []
      const defaultOptions = row.mandatory
        ? ["tYES", "tNO"]
        : validValueDefaultOptions.length > 0
          ? validValueDefaultOptions
          : null
      const hasValidDefault =
        !defaultOptions || !row.default || defaultOptions.includes(row.default)
      return {
        ...row,
        size:
          row.type === "db_Alpha" && typeof row.size === "number"
            ? Math.min(Math.max(row.size, 1), 254)
            : undefined,
        subtype: nextSubtype,
        value: isCheckboxSubtype ? [] : row.value,
        default: hasValidDefault ? row.default : "",
      }
    })
    setRows(updated)
  }, [])

  const { table, ...dataGridProps } = useDataGrid({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    onDataChange: handleDataChange,
    enableSearch: true,
    readOnly: false,
    enablePaste: true,
  })

  const isLoadingAny = isLoadingFields || isFetchingFields

  //Render
  return (
    <section className="max-w-9xl mx-auto flex min-h-screen w-full flex-col gap-5 bg-[#f7f8fb] px-4 py-5 text-zinc-950 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal text-zinc-950 sm:text-4xl">
              Manage Fields
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600 sm:text-base">
              Select a table to view and edit its fields.
            </p>
          </div>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={
              updateMutation.isPending || !isTableSelected || isLoadingAny
            }
            className="cursor-pointer bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-50"
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
          {/* Table Name */}
          <div className="space-y-2">
            <Label>Table Name</Label>
            <TableSelectorDialog
              mode="name"
              value={selectedTableName}
              tableType={selectedTableType}
              onSelect={(t: UserTableMD) => {
                setSelectedTableName(t.TableName)
                setSelectedDescription(t.TableDescription ?? "")
                setSelectedTableType(t.TableType)
                setRows([])
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Table Description</Label>
            <TableSelectorDialog
              mode="description"
              value={selectedDescription}
              disable
              tableType={selectedTableType}
              onSelect={(t) => {
                setSelectedDescription(t.TableDescription ?? "")
                setSelectedTableName(t.TableName)
                setRows([])
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Table Type</Label>
            <Select
              value={selectedTableType}
              onValueChange={(val) => {
                setSelectedTableType(val)
                setRows([]) // reset when changed
              }}
              disabled
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select table type" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="bott_Document">Header</SelectItem>
                <SelectItem value="bott_DocumentLines">Row </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {!isTableSelected ? (
          <div className="flex items-center justify-center py-16 text-sm text-zinc-400">
            Select a table name above to load its fields.
          </div>
        ) : isLoadingAny ? (
          <div className="flex items-center justify-center py-16 text-sm text-zinc-400">
            Loading fields...
          </div>
        ) : rows.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-zinc-400">
            No fields found for this table.
          </div>
        ) : (
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
        )}

        <ValidValueDialog
          open={openDialog}
          onOpenChange={setOpenDialog}
          row={activeRow}
          onSave={(data) => {
            if (!activeRow) return
            setRows((prev) =>
              prev.map((r) =>
                r.id === activeRow.id ? { ...r, value: data } : r
              )
            )
          }}
        />
      </div>
    </section>
  )
}

export default ManageFields
