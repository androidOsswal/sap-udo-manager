import { Outlet } from "react-router-dom"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"

import { AppSidebar } from "@/components/app-sidebar"

const MainLayout = () => {
  return (
    <>
      <AppSidebar />
      <SidebarInset className="min-w-0 overflow-x-hidden bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.14),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.95),rgba(244,247,251,0.98))]">
        <header className="sticky top-0 z-20 bg-background/85 backdrop-blur">
          <div className="flex flex-col gap-1 px-3 py-4 sm:px-6 lg:px-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <SidebarTrigger
                  className="hidden border border-border bg-card shadow-sm hover:bg-accent"
                  id="toggle"
                />
                <div>
                  <p className="text-sm font-semibold tracking-[0.18em] text-primary uppercase">
                    SAP UDO Manager
                  </p>
                  <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
                    Build and maintain user table
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Manage table creation, field updates from one place.
              </p>
            </div>
          </div>
          <Separator />
        </header>

        <div className="min-w-0 flex-1 overflow-x-auto">
          <Outlet />
        </div>
      </SidebarInset>
    </>
  )
}

export default MainLayout
