import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ReactNode } from "react";
import WebSocketNotificationHandler from "./WebSocketNotificationHandler";
import { useSystemThemeListener } from "./useSystemThemeListener";

export interface LayoutProps {
  children?: ReactNode;
  topBarChildren?: ReactNode;
}

export default function Layout({ children, topBarChildren }: LayoutProps) {
  useSystemThemeListener();

  return <>
    <WebSocketNotificationHandler />
    <SidebarProvider>
      <AppSidebar />
      <div className="flex min-h-svh flex-col w-full min-w-0">
        {topBarChildren &&
          <div className="sticky top-0">
            <div className="bg-sidebar p-1 pr-3">
              {topBarChildren}
            </div>
            <div className="shrink-0 h-px w-full bg-sidebar-border"></div>
          </div>
        }
        <div className="flex p-2 w-full flex-col gap-2 h-full" >
          {children}
        </div>
      </div>
    </SidebarProvider>
  </>
}