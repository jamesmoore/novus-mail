/***
 * TODO
 * sidebar close on click on mobile
 * sidebar separator
 * navbar(s)
 * auto switch theme
 * DONE
 * page title
 * websocket notification
 * MUI removal
 */

import { Mail, MailOpen, Settings, Trash2 } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import useAddressResponse from "@/useAddressResponse";
import { JSX, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import useUnreadCounts from "@/useUnreadCounts";
import { Badge } from "./ui/badge";

interface SidebarItem {
  key: string,
  title: string,
  url: string,
  icon: JSX.Element
  selected: boolean,
  unreadCount?: number,
}

const keyPrefix = "SIDEBAR_KEY_";
export function AppSidebar() {

  const navigate = useNavigate();
  const location = useLocation();
  const { address: urlAddressSegment } = useParams();
  const { data: addressesResponse, isLoading: addressIsLoading } = useAddressResponse();
  const { data: unreadCounts } = useUnreadCounts();

  const { setOpenMobile } = useSidebar();


  // generate sidebar menu items
  const items = useMemo(() => {

    let items: SidebarItem[] = [];

    if (!addressIsLoading && addressesResponse) {
      const mapped = addressesResponse.addresses.map((addr) => ({
        key: keyPrefix + addr.addr,
        title: addr.addr,
        url: '/inbox/' + addr.addr,
        icon: addr.addr === urlAddressSegment ? <MailOpen strokeWidth={3} /> : <Mail />,
        selected: addr.addr === urlAddressSegment,
        unreadCount: unreadCounts?.filter(p => p.recipient === addr.addr)[0]?.unread,
      }));
      items.push(...mapped);
    }

    items.push({
      key: keyPrefix + "DELETED",
      title: "Deleted",
      url: "/deleted",
      icon: <Trash2 strokeWidth={location.pathname === '/deleted' ? 3 : 2} />,
      selected: location.pathname === '/deleted',
    });

    items.push({
      key: keyPrefix + "SETTINGS",
      title: "Settings",
      url: "/manage",
      icon: <Settings strokeWidth={location.pathname === '/manage' ? 3 : 2} />,
      selected: location.pathname === '/manage',
    });

    return items;

  }, [addressesResponse, addressIsLoading, urlAddressSegment, location.pathname, unreadCounts]);

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Mailbox</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton asChild >
                    <a href='#' onClick={() => sidebarClicked(item)} className={item.selected ? "font-bold bg-neutral-200 dark:bg-neutral-700" : ""}>
                      {item.icon}
                      <span>{item.title}</span>
                      {item.unreadCount && <Badge className="h-5 min-w-5 rounded-full px-1">
                        {item.unreadCount}
                      </Badge>}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )

  function sidebarClicked(item: SidebarItem): void {
    setOpenMobile(false);
    navigate(item.url);
  }
}