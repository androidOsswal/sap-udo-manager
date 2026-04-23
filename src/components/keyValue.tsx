import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { KeyValueItemData } from "@/components/ui/key-value"
import {
  KeyValue,
  KeyValueList,
  KeyValueItem,
  KeyValueKeyInput,
  KeyValueValueInput,
  KeyValueRemove,
  KeyValueAdd,
} from "@/components/ui/key-value"
import { Button } from "./ui/button"
import { SaveIcon } from "lucide-react"

type TableRow = {
  id: string
  value?: KeyValueItemData[]
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  row: TableRow | null
  onSave: (data: KeyValueItemData[]) => void
}

export default function ValidValueDialog({
  open,
  onOpenChange,
  row,
  onSave,
}: Props) {
  const [value, setValue] = React.useState<KeyValueItemData[]>([])
  React.useEffect(() => {
    if (row?.value) {
      setValue(
        row.value.map((item, index) => ({
          id: item.id ?? index,
          key: String(item.key),
          value: String(item.value),
        }))
      )
    } else {
      setValue([
        {
          id: crypto.randomUUID(),
          key: "",
          value: "",
        },
      ])
    }
  }, [row])
  const handleSave = () => {
    onSave(value)
    onOpenChange(false)
  
      
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Enter Valid Values</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <KeyValue value={value} onValueChange={setValue}>
            <KeyValueList>
              <KeyValueItem>
                <KeyValueKeyInput />
                <KeyValueValueInput />
                <KeyValueRemove />
              </KeyValueItem>
            </KeyValueList>

            <KeyValueAdd className="mt-2" />
          </KeyValue>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={() => onOpenChange(false)} variant="secondary">
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            className="bg-sky-600/10 text-sky-600 hover:bg-sky-600/20 focus-visible:ring-sky-600/20 dark:bg-sky-400/10 dark:text-sky-400 dark:hover:bg-sky-400/20 dark:focus-visible:ring-sky-400/40"
          >
            <SaveIcon />
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
