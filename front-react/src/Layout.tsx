import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
 
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex min-h-svh flex-col w-full p-2 gap-2 min-w-0">
        {children}
      </div>
    </SidebarProvider>
  )
}