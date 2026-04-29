import React from "react"
import { Button } from "./ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { Field, FieldGroup } from "./ui/field"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { createDynamicSapClient } from "@/api/sapClient"
import { createUdoWithBatch } from "@/api/udoBatch"
import type { TableRow } from "@/pages/exsiting"
import { toast } from "sonner"
import {
  Database,
  Eye,
  EyeOff,
  LockKeyhole,
  Server,
  UserRound,
} from "lucide-react"
// import { backgroundSapLogin } from "@/api/saplogin"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: string
  rows: TableRow[]
  TableType: "bott_Document" | "bott_DocumentLines"
}

export default function CopyToCompany({
  open,
  onOpenChange,
  table,
  rows,
  TableType,
}: Props) {
  const [form, setForm] = React.useState({
    url: "",
    username: "",
    password: "",
    database: "",
    table: "",
  })
  const [isShowPassword, setIsShowPassword] = React.useState(false)
  React.useEffect(() => {
    if (open) {
      const savedDetails = localStorage.getItem("user-details")
      if (savedDetails) {
        const data = JSON.parse(savedDetails)
        setForm({
          url: data.url || "",
          username: data.username || "",
          password: data.password || "",
          database: data.database || "",
          table: table || "",
        })
      }
    } else {
      setForm({ url: "", username: "", password: "", database: "", table: "" })
    }
  }, [open, table])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleCopy = async () => {
    try {
      // create new connection
      const client = await createDynamicSapClient({
        url: form.url,
        username: form.username,
        password: form.password,
        database: form.database,
      })
      // table payload
      const tablePayload = {
        tableName: form.table,
        tableDescription: form.table,
        tableType: TableType,
      }

      //convert rows → fields
      const fieldsPayload = rows.map((row) => ({
        name: row.name,
        description: row.description,
        type: row.type,
        subType: row.subtype,
        size: row.size,
        defaultValue: row.default || null,
        mandatory: row.mandatory || false,
        linkedUDO: row.linkeUDO || null,
        linkedSystemObject: row.linkesystemobj || null,
        validValues:
          row.value?.map((v) => ({
            key: v.key,
            value: v.value,
          })) || [],
      }))

      // call batch
      //   await backgroundSapLogin()
      await createUdoWithBatch(client, tablePayload, fieldsPayload)

      toast.success("Table copied successfully")
    } catch (err) {
      console.error(err)
      toast.warning(" Failed to copy")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            View or edit details and copy them.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <div className="relative space-y-2">
              <Label htmlFor="username" className="">
                Username
              </Label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  autoComplete="username"
                  name="username"
                  className="h-11 border border-zinc-300 bg-white pl-10"
                  onChange={handleChange}
                  value={form.username}
                />
              </div>
            </div>
          </Field>

          <Field>
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <div className="relative">
                <Server className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  id="url"
                  type="url"
                  placeholder="Enter your SAP server URL"
                  autoComplete="url"
                  value={form.url}
                  onChange={handleChange}
                  name="url"
                  className="h-11 border border-zinc-300 bg-white pl-10 font-sans tracking-wide"
                />
              </div>
            </div>
          </Field>

          <Field>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  id="password"
                  type={isShowPassword ? "text" : "password"}
                  placeholder="Enter password "
                  autoComplete="current-password"
                  name="password"
                  onChange={handleChange}
                  value={form.password}
                  className="h-11 border border-zinc-300 bg-white pl-10 font-sans font-bold tracking-wide"
                />
                {isShowPassword ? (
                  <EyeOff
                    onClick={() => setIsShowPassword(false)}
                    className="absolute top-1/2 right-3 size-4 -translate-y-1/2 cursor-pointer text-zinc-500"
                  />
                ) : (
                  <Eye
                    onClick={() => setIsShowPassword(true)}
                    className="absolute top-1/2 right-3 size-4 -translate-y-1/2 cursor-pointer text-zinc-500"
                  />
                )}
              </div>
            </div>
          </Field>

          <Field>
            <div className="space-y-2">
              <Label htmlFor="database">Database</Label>
              <div className="relative">
                <Database className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 font-bold text-zinc-500" />
                <Input
                  id="database"
                  value={form.database}
                  type="text"
                  onChange={handleChange}
                  placeholder="Enter database name"
                  autoComplete="off"
                  name="database"
                  className="h-11 border border-zinc-300 bg-white pl-10"
                />
              </div>
            </div>
          </Field>

          <Field>
            <Label>Table Name</Label>
            <Input
              name="table"
              value={table}
              onChange={handleChange}
              placeholder="Enter table name to copy"
              disabled
            />
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button onClick={handleCopy}>Copy</Button>

          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
