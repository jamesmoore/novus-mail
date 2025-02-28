import { useState, ReactNode, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AppBar, Badge, Box, Divider, Drawer, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar } from '@mui/material';
import Grid from '@mui/material/Grid2';
import useAddressResponse from './useAddressResponse';
import SettingsIcon from '@mui/icons-material/Settings';
import MailIcon from '@mui/icons-material/Mail';
import MenuIcon from '@mui/icons-material/Menu';
import DraftsIcon from '@mui/icons-material/Drafts';
import useUnreadCounts from './useUnreadCounts';
import { useWebSocketNotifier, WebSocketMessage } from './useWebSocketNotifier';
import { useMailItems, useInvalidateMailItemsCache } from './useMailItems';

export interface LayoutProps {
  bodyChildren?: ReactNode;
  topBarChildren?: ReactNode;
}

function Layout({ bodyChildren, topBarChildren }: LayoutProps) {

  const { lastJsonMessage } = useWebSocketNotifier();

  const navigate = useNavigate();
  const location = useLocation();
  const { address: urlAddressSegment } = useParams();
  const drawerWidth = 240;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const { refetch } = useMailItems(urlAddressSegment);

  const handleDrawerClose = () => {
    setIsClosing(true);
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

  const handleDrawerToggle = () => {
    if (!isClosing) {
      setMobileOpen(!mobileOpen);
    }
  };

  const { data: addressesResponse, isLoading: addressIsLoading } = useAddressResponse();

  const { refetch: unreadRefetch, data: unreadCounts } = useUnreadCounts();

  const { invalidate } = useInvalidateMailItemsCache();

  const [lastReceivedMessage, setLastReceivedMessage] = useState<WebSocketMessage | null>(null);

  useEffect(() => {
    setLastReceivedMessage(lastJsonMessage);
  },
    [lastJsonMessage]
  )

  useEffect(() => {
    if (!lastReceivedMessage) return;

    switch (lastReceivedMessage.type) {
      case 'received':
        unreadRefetch();
        if (urlAddressSegment === lastReceivedMessage.value) {
          refetch();
        } else if (lastReceivedMessage.value) {
          invalidate(lastReceivedMessage.value);
        }
        break;

      case 'connected':
        // Handle connected state if needed
        break;

      default:
        console.error('Unhandled message type:', JSON.stringify(lastReceivedMessage));
    }

    setLastReceivedMessage(null);
  }, [lastReceivedMessage, invalidate, unreadRefetch, refetch, urlAddressSegment, setLastReceivedMessage]);

  const mailboxes = useMemo(() => addressesResponse?.addresses.map(p => p.addr).map((address) => ({
    address,
    unreadcount: unreadCounts?.filter(p => p.recipient === address).at(0)?.unread,
    selected: address === urlAddressSegment
  })) ?? [], [addressesResponse, unreadCounts, urlAddressSegment]);

  const title = useMemo(() => { 
    const unreadCount = unreadCounts?.map(p => p.unread).reduce((p, q) => p + q, 0) ?? 0;
    return `NovusMail${unreadCount > 0 ? ` (${unreadCount})` : ''}`;
  }, [unreadCounts]);

  const drawer = (
    <>
      <Toolbar />
      <Divider />
      <List>
        {mailboxes.map((mailbox) => (
          <ListItem key={mailbox.address} disablePadding>
            <ListItemButton
              onClick={() => {
                if (mobileOpen) {
                  handleDrawerToggle();
                }
                navigate('/inbox/' + mailbox.address);
              }}
              selected={mailbox.selected}
            >
              <ListItemIcon sx={{ minWidth: '40px' }}>
                <Badge badgeContent={mailbox.unreadcount} color="primary">
                  {mailbox.selected ? <DraftsIcon /> : <MailIcon />}
                </Badge>
              </ListItemIcon>
              <ListItemText primary={mailbox.address} sx={{ mr: 1, overflow: 'hidden', textOverflow: 'ellipsis' }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <ListItem disablePadding>
        <ListItemButton onClick={() => {
          if (mobileOpen) {
            handleDrawerToggle();
          }
          navigate('/manage');
        }}
          selected={location.pathname === '/manage'}
        >
          <ListItemIcon sx={{ minWidth: '40px' }}>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary={"Settings"} />
        </ListItemButton>
      </ListItem>
    </>
  );

  if (addressIsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <title>{title}</title>
      <Box sx={{ display: 'flex', height: "10" }}>
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            {topBarChildren && topBarChildren}

          </Toolbar>
        </AppBar>
        <Box
          component="nav"
          sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
          aria-label="mailbox folders"
        >
          <Drawer
            //container={container}
            variant="temporary"
            open={mobileOpen}
            onTransitionEnd={handleDrawerTransitionEnd}
            onClose={handleDrawerClose}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: "1 1 auto",
            width: {
              xs: "100%",
              sm: `calc(100% - ${drawerWidth}px)`
            },
          }}
        >

          <Toolbar />
          <Grid flex="1 0 auto" paddingLeft={1} paddingRight={1}>
            {bodyChildren && bodyChildren}
          </Grid>
        </Box>
      </Box>
    </>
  );
}

export default Layout;