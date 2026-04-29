import { Database, LayoutTemplate, LogOut, PlusSquare } from "lucide-react"
import { useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const navigationItems = [
  {
    title: "Create Table",
    href: "/",
    icon: PlusSquare,
    match: (pathname: string) => pathname === "/",
  },
  {
    title: "Existing Table",
    href: "/existing",
    icon: Database,
    match: (pathname: string) => pathname === "/existing",
  },
]

export function AppSidebar() {
  const location = useLocation()
  const navigate = useNavigate()

  const userDetails = useMemo(() => {
    try {
      const User = localStorage.getItem("user-details")
      return User ? (JSON.parse(User) as Record<string, string>) : null
    } catch {
      return null
    }
  }, [])

  const username = userDetails?.username?.trim() || "SAP User"
  const database = userDetails?.database?.trim() || "Connected workspace"

  const handleLogout = () => {
    localStorage.removeItem("user-details")
    localStorage.removeItem("tableRows")
    navigate("/auth/login", { replace: true })
  }

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="gap-4 px-3 py-4">
        <div className="bg-sidebar-accent/60 flex items-center gap-3 rounded-xl px-3 py-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <LayoutTemplate className="size-5" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-sidebar-foreground truncate text-sm font-semibold">
              SAP UDO Manager
            </p>
            <p className="text-sidebar-foreground/70 truncate text-xs">
              Table workspace
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={item.match(location.pathname)}
                    onClick={() => navigate(item.href)}
                    className="cursor-pointer"
                  >
                    <item.icon />
                    <span className="font-medium tracking-[1px] font-sans">
                      {item.title}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 pb-4">
        <div className="bg-sidebar-accent/40 rounded-xl p-3 group-data-[collapsible=icon]:hidden">
          <p className="text-sidebar-foreground truncate text-sm font-medium">
            {username.toLocaleUpperCase()}
          </p>
          <p className="text-sidebar-foreground/70 truncate text-xs">
            {database}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="border-sidebar-border bg-sidebar text-sidebar-foreground hover:bg-gray-400 w-full cursor-pointer justify-start gap-2 transition-colors duration-300 ease-in-out"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
          <span className="group-data-[collapsible=icon]:hidden font-semibold">Logout</span>
        </Button>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
