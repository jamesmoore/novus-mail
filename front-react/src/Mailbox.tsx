import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AddressContext from './AddressContext';
import { AppBar, Box, Divider, Drawer, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useQuery } from '@tanstack/react-query';
import { fetchAddress, fetchUnreadCounts } from './api-client';

import SettingsIcon from '@mui/icons-material/Settings';

import MailIcon from '@mui/icons-material/Mail';
import MenuIcon from '@mui/icons-material/Menu';
import DraftsIcon from '@mui/icons-material/Drafts';
import MailboxItems from './MailboxItems';
import TopBarAddress from './TopBarAddress';

function Mailbox() {
  const { selectedAddress, setSelectedAddress } = useContext(AddressContext);

  const navigate = useNavigate();
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

  const { data: addressesResponse, isLoading: addressIsLoading } = useQuery(
    {
      queryKey: ["addresses"],
      queryFn: fetchAddress
    }
  )

  const { data: unreadCounts, refetch: refetchUnread } = useQuery(
    {
      queryKey: ["unread-counts"],
      queryFn: fetchUnreadCounts,
      refetchInterval: 10000,
    }
  )

  useEffect(
    () => {
      if (addressesResponse && addressesResponse.addresses.length > 0) {
        const addresses = addressesResponse.addresses;
        if (selectedAddress === '' || addresses.every(p => p.addr !== selectedAddress)) {
          setSelectedAddress(addresses[addresses.length - 1].addr);
        }
      }
    },
    [addressesResponse, selectedAddress, setSelectedAddress]
  );

  if (addressIsLoading) {
    return <div>Loading...</div>;
  }

  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        {addressesResponse?.addresses.map((address, _index) => (
          <ListItem key={address.addr} disablePadding>
            <ListItemButton
              onClick={(_e) => {
                setSelectedAddress(address.addr);
                if (mobileOpen) {
                  handleDrawerToggle();
                }
              }}
              selected={address.addr === selectedAddress}
            >
              <ListItemIcon sx={{ minWidth: '40px' }}>
                {address.addr === selectedAddress ? <DraftsIcon /> : <MailIcon />}
              </ListItemIcon>
              <ListItemText primary={address.addr} sx={{ mr: 1, overflow: 'hidden', textOverflow: 'ellipsis' }} />
              <ListItemText sx={{ ml: "auto", textAlign: "right" }} primary={unreadCounts?.filter(p => p.recipient === address.addr).at(0)?.unread} primaryTypographyProps={{ color: "primary" }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <ListItem disablePadding>
        <ListItemButton onClick={(_e) => { navigate('/manage'); }}>
          <ListItemIcon sx={{ minWidth: '40px' }}>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary={"Settings"} />
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

          <TopBarAddress/>

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
          <MailboxItems refreshInterval={addressesResponse?.refreshInterval} onRefreshUnread={async () => { await refetchUnread(); }} />
        </Grid>
      </Box>



    </Box>
  );
}

export default Mailbox;