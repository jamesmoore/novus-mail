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
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import useAddressResponse from "@/useAddressResponse";
import { Fragment, JSX, useMemo } from "react";
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
  hasSeparator: boolean,
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
        hasSeparator: false,
      }));
      items.push(...mapped);
    }

    items.push({
      key: keyPrefix + "DELETED",
      title: "Deleted",
      url: "/deleted",
      icon: <Trash2 strokeWidth={location.pathname === '/deleted' ? 3 : 2} />,
      selected: location.pathname === '/deleted',
      hasSeparator: true,
    });

    items.push({
      key: keyPrefix + "SETTINGS",
      title: "Settings",
      url: "/manage",
      icon: <Settings strokeWidth={location.pathname === '/manage' ? 3 : 2} />,
      selected: location.pathname === '/manage',
      hasSeparator: true,
    });

    return items;

  }, [addressesResponse, addressIsLoading, urlAddressSegment, location.pathname, unreadCounts]);

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-base my-0.5">Mailbox</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarSeparator />
              {items.map((item) => (
                <Fragment key={item.key}>
                  {item.hasSeparator && <SidebarSeparator/>}
                  <SidebarMenuItem  >
                    <SidebarMenuButton asChild className="text-base my-0.5" isActive={item.selected}>
                      <a href='#' onClick={() => sidebarClicked(item)} >
                        {item.icon}
                        <span>{item.title}</span>
                        {item.unreadCount && <Badge className="h-5 min-w-5 rounded-full px-1">
                          {item.unreadCount}
                        </Badge>}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </Fragment>
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