import { Toaster } from "sonner"
import AppRoutes from "./routes/app-routes"


export function App() {
  return (
    <>
     <Toaster richColors position="top-right" />
      <AppRoutes/>
    </>
  )
}

export default App
