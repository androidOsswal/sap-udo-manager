import { sapApi } from "./client"

type TableType = "bott_Document" | "bott_DocumentLines"

export type CreateTablePayload = {
  tableName: string
  tableDescription: string
  tableType: TableType
}

export type CreateFieldPayload = {
  name: string
  type: string
  size?: number
  description: string
  subType?: string
  linkedTable?: string | null
  defaultValue?: string | null
  mandatory: boolean
  linkedUDO?: string | null
  linkedSystemObject?: string | null
  validValues?: Array<{
    key: string
    value: string
  }>
}

// 
const SAP_NUMERIC_SIZE = 11 // db_numeric valid range: 1–11

function getSapType(type: string): string {
  const typeMap: Record<string, string> = {
    db_numeric: "db_Numeric",
    db_float: "db_Float",
    date: "db_Date",
    db_Alpha: "db_Alpha",
    db_Memo: "db_Memo",
  }
  return typeMap[type] ?? type
}

function getSapSubType(subType?: string): string | null {
  if (!subType) return null
  const subTypeMap: Record<string, string> = {
    st_none: "st_None",
    st_checkbox: "st_Checkbox",
    st_sum: "st_Sum",
    price: "st_Price",
    quantity: "st_Quantity",
    percentage: "st_Percentage",
    st_phone: "st_Phone",
    st_address: "st_Address",
  }
  return subTypeMap[subType] ?? null
}

function getText(value?: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function getFieldSize(
  type: string,
  size?: number
): { Size: number | undefined; EditSize: number | undefined } {
  if (type === "db_Alpha") {
    const clamped = Math.min(Math.max(size ?? 1, 1), 254)
    return { Size: clamped, EditSize: clamped }
  }
  if (type === "db_numeric") {
    return { Size: SAP_NUMERIC_SIZE, EditSize: SAP_NUMERIC_SIZE }
  }
  // db_float, db_Memo, db_Date — SAP does not accept Size for these
  return { Size: undefined, EditSize: undefined }
}

export async function createUdoWithBatch(
  table: CreateTablePayload,
  fields: CreateFieldPayload[]
) {
  const batchBoundary = "batch_1"
  const changeSetBoundary = "changeset_1"
  const tableName = table.tableName.trim().replace(/^@/, "")

  const userTablePayload = {
    TableName: tableName,
    TableDescription: table.tableDescription.trim(),
    TableType: table.tableType,
  }

  const bodyParts = [
    `--${batchBoundary}`,
    `Content-Type: multipart/mixed; boundary=${changeSetBoundary}`,
    "",
    `--${changeSetBoundary}`,
    "Content-Type: application/http",
    "Content-Transfer-Encoding: binary",
    "",
    "POST /b1s/v1/UserTablesMD HTTP/1.1",
    "Content-Type: application/json",
    "",
    JSON.stringify(userTablePayload),
  ]

  for (const field of fields) {
    const validValues =
      field.validValues
        ?.map((item) => ({
          Value: item.key.trim(),
          Description: item.value.trim(),
        }))
        .filter((item) => item.Value && item.Description) ?? []

    const { Size, EditSize } = getFieldSize(field.type, field.size)

    const fieldPayload: Record<string, unknown> = {
      Name: field.name.trim(),
      Type: getSapType(field.type),
      Description: field.description.trim(),
      SubType: getSapSubType(field.subType),
      LinkedTable: getText(field.linkedTable),
      DefaultValue: getText(field.defaultValue),
      TableName: `@${tableName}`,
      Mandatory: field.mandatory ? "tYES" : "tNO",
      LinkedUDO: getText(field.linkedUDO),
      LinkedSystemObject: getText(field.linkedSystemObject),
      ValidValuesMD: validValues,
    }

    // Only include Size/EditSize when defined 
    if (Size !== undefined) fieldPayload.Size = Size
    if (EditSize !== undefined) fieldPayload.EditSize = EditSize

    bodyParts.push(
      `--${changeSetBoundary}`,
      "Content-Type: application/http",
      "Content-Transfer-Encoding: binary",
      "",
      "POST /b1s/v1/UserFieldsMD HTTP/1.1",
      "Content-Type: application/json",
      "",
      JSON.stringify(fieldPayload)
    )
  }

  bodyParts.push(`--${changeSetBoundary}--`, `--${batchBoundary}--`)

  const body = bodyParts.join("\r\n")


  const res = await sapApi.post("/$batch", body, {
  headers: {
    "Content-Type": `multipart/mixed; boundary=${batchBoundary}`,
    "Connection": "keep-alive",
    "Accept": "multipart/mixed",
  },
})


  // Parse batch response for embedded errors and surface them
  const rawResponse: string =
    typeof res.data === "string" ? res.data : JSON.stringify(res.data)

  const errorMatch = rawResponse.match(/"message"\s*:\s*\{[^}]*"value"\s*:\s*"([^"]+)"/)
  if (errorMatch) {
    throw new Error(errorMatch[1])
  }

  return res
}