import { useState, ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AppBar, Box, Divider, Drawer, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar } from '@mui/material';
import Grid from '@mui/material/Grid2';
import useAddressResponse from './useAddressResponse';
import SettingsIcon from '@mui/icons-material/Settings';
import MailIcon from '@mui/icons-material/Mail';
import MenuIcon from '@mui/icons-material/Menu';
import DraftsIcon from '@mui/icons-material/Drafts';
import useUnreadCounts from './useUnreadCounts';

export interface LayoutProps {
  bodyChildren?: ReactNode;
  topBarChildren?: ReactNode;
}

function Layout({ bodyChildren, topBarChildren }: LayoutProps) {

  const navigate = useNavigate();
  const location = useLocation();
  const { address: urlAddressSegment } = useParams();
  const drawerWidth = 240;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);


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

  const { data: unreadCounts } = useUnreadCounts();

  if (addressIsLoading) {
    return <div>Loading...</div>;
  }

  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        {addressesResponse?.addresses.map(p => p.addr).map((address) => (
          <ListItem key={address} disablePadding>
            <ListItemButton
              onClick={() => {
                if (mobileOpen) {
                  handleDrawerToggle();
                }
                navigate('/inbox/' + address);
              }}
              selected={address === urlAddressSegment}
            >
              <ListItemIcon sx={{ minWidth: '40px' }}>
                {address === urlAddressSegment ? <DraftsIcon /> : <MailIcon />}
              </ListItemIcon>
              <ListItemText primary={address} sx={{ mr: 1, overflow: 'hidden', textOverflow: 'ellipsis' }} />
              <ListItemText sx={{ ml: "auto", textAlign: "right" }} primary={unreadCounts?.filter(p => p.recipient === address).at(0)?.unread} slotProps={{ primary: { color: "primary" } }} />
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
          <ListItemText primary={"Settings"}/>
        </ListItemButton>
      </ListItem>
    </div>
  );

  return (
    <Box sx={{ display: 'flex', height: "100dvh" }}>
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
  );
}

export default Layout;