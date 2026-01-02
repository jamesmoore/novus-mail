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
import useAddressResponse from "@/use-address-response";
import { Fragment, JSX, useEffect, useMemo } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import useUnreadCounts from "@/use-unread-counts";
import { Badge } from "./ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import useUser from "@/use-user";
import { logout } from "@/api-client";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Address } from "@/models/addresses-response";

interface SidebarItem {
  key: string,
  title: string,
  url: string,
  icon: JSX.Element
  selected: boolean,
  unreadCount?: number,
  hasSeparator: boolean,
  header?: string,
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
      const addrPrivate = addressesResponse.addresses.filter(p => p.owner);
      const addrPublic = addressesResponse.addresses.filter(p => !p.owner);

      const mappedPrivate = addrPrivate.map((addr) => addrToSidebarItem(
        addr,
        addr.addr === urlAddressSegment,
        unreadByRecipient.get(addr.addr)));
      const mappedPublic = addrPublic.map((addr) => addrToSidebarItem(
        addr,
        addr.addr === urlAddressSegment,
        unreadByRecipient.get(addr.addr)));

      if (mappedPrivate.length > 0 && mappedPublic.length > 0) {
        mappedPrivate[0].header = "Private"
        mappedPublic[0].header = "Public"
      }

      items.push(...mappedPrivate);
      items.push(...mappedPublic);
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

  const doLogout = async () => {
    const logoutResponse = await logout();
    if (logoutResponse.logoutUrl) {
      window.location.href = logoutResponse.logoutUrl;
    }
    else {
      window.location.href = "/";
    }
  };

  return (
    <Sidebar className="h-full">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-base my-0.5">Mailbox</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarSeparator />
              {items.map((item) => (
                <Fragment key={item.key}>
                  {item.header && <SidebarGroupLabel className="text-base my-0.5">{item.header}</SidebarGroupLabel>}
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
                {user.picture ?
                  <Avatar>
                    <AvatarImage src={user.picture} />
                  </Avatar>
                  : <User2 />
                }
                {user.name ?? user.email}
                <ChevronRight className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right">
              <DropdownMenuItem className="text-base" onClick={doLogout}>
                <LogOut /><span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      </SidebarFooter >
    </Sidebar>
  )
}

function addrToSidebarItem(addr: Address, selected: boolean, unreadCount?: number): SidebarItem {
  return {
    key: "ADDR_" + addr.addr,
    title: addr.addr,
    url: '/inbox/' + addr.addr,
    icon: selected ? <MailOpen strokeWidth={3} /> : <Mail />,
    selected: selected,
    unreadCount: unreadCount,
    hasSeparator: false,
  };
}
