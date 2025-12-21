import { ChevronRight, LogOut, Mail, MailOpen, Settings, Trash2, User2 } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
import { Fragment, JSX, useEffect, useMemo } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import useUnreadCounts from "@/useUnreadCounts";
import { Badge } from "./ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import useUser from "@/useUser";

interface SidebarItem {
  key: string,
  title: string,
  url: string,
  icon: JSX.Element
  selected: boolean,
  unreadCount?: number,
  hasSeparator: boolean,
}

export function AppSidebar() {

  const location = useLocation();
  const { address: urlAddressSegment } = useParams();
  const { data: addressesResponse, isLoading: addressIsLoading } = useAddressResponse();
  const { data: unreadCounts } = useUnreadCounts();
  const { data: user } = useUser();
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    setOpenMobile(false);
  }, [location.pathname, setOpenMobile]);

  const unreadByRecipient = useMemo(() => {
    return new Map(
      unreadCounts?.map(u => [u.recipient, u.unread])
    );
  }, [unreadCounts]);

  // generate sidebar menu items
  const items = useMemo(() => {

    let items: SidebarItem[] = [];

    if (!addressIsLoading && addressesResponse) {
      const mapped = addressesResponse.addresses.map((addr) => ({
        key: "ADDR_" + addr.addr,
        title: addr.addr,
        url: '/inbox/' + addr.addr,
        icon: addr.addr === urlAddressSegment ? <MailOpen strokeWidth={3} /> : <Mail />,
        selected: addr.addr === urlAddressSegment,
        unreadCount: unreadByRecipient.get(addr.addr),
        hasSeparator: false,
      }));
      items.push(...mapped);
    }

    items.push({
      key: "DELETED",
      title: "Deleted",
      url: "/deleted",
      icon: <Trash2 strokeWidth={location.pathname === '/deleted' ? 3 : 2} />,
      selected: location.pathname === '/deleted',
      hasSeparator: true,
    });

    items.push({
      key: "SETTINGS",
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
                  {item.hasSeparator && <SidebarSeparator />}
                  <SidebarMenuItem  >
                    <SidebarMenuButton asChild className="text-base my-0.5" isActive={item.selected}>
                      <Link to={item.url}
                        onClick={() => {
                          if (item.selected) {
                            setOpenMobile(false);
                          }
                        }}
                      >
                        {item.icon}
                        <span>{item.title}</span>
                        {item.unreadCount && <Badge className="h-5 min-w-5 rounded-full px-1 bg-highlight-color">
                          {item.unreadCount}
                        </Badge>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </Fragment>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {user && user.requiresAuth &&
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton className="text-base">
                <User2 /> {user.name ?? user.email}
                <ChevronRight className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right">
              <DropdownMenuItem className="text-base">
                <LogOut /><span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      </SidebarFooter >
    </Sidebar>
  )
}