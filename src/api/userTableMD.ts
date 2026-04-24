// import { sapApi } from "./client"
// type LinkedUDOs = {
//   TableName: string
//   TableDescription: string
// }

// function escapeODataString(value: string) {
//   return value.replaceAll("'", "''")
// }

// export async function fetchLinkedUDO(search = ""): Promise<LinkedUDOs[]> {
//   const normalizedSearch = search.trim()
//   const params: Record<string, string> = {
//     $select: "TableName,TableDescription",
//   }

//   if (normalizedSearch) {
//     const escapedSearch = escapeODataString(normalizedSearch)
//     params.$filter = `contains(TableName,'${escapedSearch}') or contains(TableDescription,'${escapedSearch}')`
//   }

//   const response = await sapApi.get<LinkedUDOs[] | { value: LinkedUDOs[] }>(
//     "/UserTablesMD",
//     { params }
//   )

//   return Array.isArray(response.data) ? response.data : response.data.value
// }

// export type UserTableMD = {
//   TableName: string
//   TableDescription: string
//   TableType: "bott_Document" | "bott_DocumentLines"
// }

// export async function fetchUserTables(search: string): Promise<UserTableMD[]> {
//   const res = await sapApi.get("/UserTablesMD", {
//     params: {
//       $select: "TableName,TableDescription,TableType",
//       $top: 500,
//       $skip: 0,
//       ...(search && {
//         $filter: `TableName eq '${search}' and TableDescription eq '${search}'`,
//       }),
//     },
//   })

//   return res.data?.value ?? []
// }

// export type UserFieldMD = {
//   FieldID: number
//   Name: string
//   Description: string
//   Type: string
//   Size?: number
//   SubType?: string
//   LinkedTable?: string | null
//   DefaultValue?: string | null
//   TableName: string
//   tableType: string
//   Mandatory: "tYES" | "tNO"
//   LinkedUDO?: string | null
//   LinkedSystemObject?: string | null
//   ValidValuesMD?: Array<{ Value: string; Description: string }>
// }
// // fetchTableFields(tableName, tableType)

// // Fetch all fields for a given table e.g. "@tableName"
// export async function fetchTableFields(
//   tableName: string
// ): Promise<UserFieldMD[]> {
//   const res = await sapApi.get("/UserFieldsMD", {
//     params: {
//       $filter: `TableName eq '@${tableName}'`,
//       $select:
//         "TableName,Description,Type,Size,SubType,Name,FieldID,LinkedTable,DefaultValue,TableName,Mandatory,LinkedUDO,LinkedSystemObject,ValidValuesMD",
//     },
//   })
//   return res.data?.value ?? []
// }

// // Update a single field by FieldID
// export async function updateTableField(
//   tableName: string,
//   fieldId: number,
//   payload: Partial<Omit<UserFieldMD, "FieldID" | "TableName" | "Name">>
// ): Promise<void> {
//   await sapApi.patch(
//     `/UserFieldsMD(TableName='@${tableName}',FieldID=${fieldId})`,
//     payload
//   )
// }

import { sapApi } from "./client"
type LinkedUDOs = {
  TableName: string
  TableDescription: string
}

function escapeODataString(value: string) {
  return value.replaceAll("'", "''")
}

export async function fetchLinkedUDO(search = ""): Promise<LinkedUDOs[]> {
  const normalizedSearch = search.trim()
  const params: Record<string, string> = {
    $select: "TableName,TableDescription",
  }

  if (normalizedSearch) {
    const escapedSearch = escapeODataString(normalizedSearch)
    params.$filter = `contains(TableName,'${escapedSearch}') or contains(TableDescription,'${escapedSearch}')`
  }

  const response = await sapApi.get<LinkedUDOs[] | { value: LinkedUDOs[] }>(
    "/UserTablesMD",
    { params }
  )

  return Array.isArray(response.data) ? response.data : response.data.value
}

export type UserTableMD = {
  TableName: string
  TableDescription: string
  TableType: "bott_Document" | "bott_DocumentLines"
}

export async function fetchUserTables(search = ""): Promise<UserTableMD[]> {
  const params: Record<string, string | number> = {
    $select: "TableName,TableDescription,TableType",
    $top: 500, // increase limit
    $skip: 0,
  }

  if (search.trim()) {
    const escaped = search.replaceAll("'", "''")
    params.$filter = `contains(TableName,'${escaped}') or contains(TableDescription,'${escaped}')`
  }

  const res = await sapApi.get("/UserTablesMD", { params })

  return res.data?.value ?? []
}

export type UserFieldMD = {
  FieldID: number
  Name: string
  Description: string
  Type: string
  Size?: number
  SubType?: string
  LinkedTable?: string | null
  DefaultValue?: string | null
  TableName: string
  tableType: string
  Mandatory: "tYES" | "tNO"
  LinkedUDO?: string | null
  LinkedSystemObject?: string | null
  ValidValuesMD?: Array<{ Value: string; Description: string }>
}
// fetchTableFields(tableName, tableType)

// Fetch all fields for a given table e.g. "@tableName"
export async function fetchTableFields(
  tableName: string
): Promise<UserFieldMD[]> {
  const res = await sapApi.get("/UserFieldsMD", {
    params: {
      $filter: `TableName eq '@${tableName}'`,
      $select:
        "TableName,Description,Type,Size,SubType,Name,FieldID,LinkedTable,DefaultValue,TableName,Mandatory,LinkedUDO,LinkedSystemObject,ValidValuesMD",
    },
  })
  return res.data?.value ?? []
}

// Update a single field by FieldID
export async function updateTableField(
  tableName: string,
  fieldId: number,
  payload: Partial<Omit<UserFieldMD, "FieldID" | "TableName" | "Name">>
): Promise<void> {
  await sapApi.patch(
    `/UserFieldsMD(TableName='@${tableName}',FieldID=${fieldId})`,
    payload
  )
}
