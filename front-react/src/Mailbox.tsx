import { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AddressContext from './AddressContext';
import { AppBar, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Drawer, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Tooltip, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import ContentCopy from '@mui/icons-material/ContentCopy';
import { InfiniteData, useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAddress, fetchDomain, fetchMails, deleteMail, readMail, fetchUnreadCounts } from './api-client';

import SettingsIcon from '@mui/icons-material/Settings';

import MailIcon from '@mui/icons-material/Mail';
import MenuIcon from '@mui/icons-material/Menu';
import DraftsIcon from '@mui/icons-material/Drafts';
import MailboxItem from './MailboxItem';
import { useInView } from 'react-intersection-observer';
import { MailResponse } from './models/mail-response';
import { Mail } from './models/mail';

const handleCopy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

function Mailbox() {
  const { selectedAddress, setSelectedAddress } = useContext(AddressContext);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteItemKey, setDeleteItemKey] = useState<string | null>(null);
  const navigate = useNavigate();

  const { ref, inView } = useInView();

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

  async function copyClicked() {
    await handleCopy(getFullAddress());
  }

  async function onMailItemSelect(mail: Mail) {
    await readMail(mail.id);
    mail.read = true;
    navigate('/mail/' + mail.id);
  }

  async function onMailItemDelete(itemKey: string) {
    deleteMailEvent(itemKey);
  }

  async function deleteMailEvent(itemKey: string) {
    setDeleteItemKey(itemKey);
    setDeleteConfirm(true);
  }

  const queryClient = useQueryClient();

  const queryKey = useMemo(() => ['mail', selectedAddress], [selectedAddress]);

  function getFullAddress() {
    return `${selectedAddress}@${domainName}`;
  }

  async function deleteYes() {
    try {
      await deleteMail(deleteItemKey!);
      setDeleteConfirm(false);

      const newPagesArray =
        mails?.pages.map((page) =>
        ({
          data: page.data.filter((mail) => mail.id !== deleteItemKey),
          previousId: page.previousId,
          nextId: page.nextId
        } as MailResponse)
        ) ?? [];

      queryClient.setQueryData(queryKey, (data: InfiniteData<MailResponse, string[]>) =>
      (
        {
          pages: newPagesArray,
          pageParams: data.pageParams,
        }
      )
      );

      await refetchUnread();
    }
    catch (error) {
      console.error('Failed to delete mail ' + error);
    };
  }

  async function deleteNo() {
    setDeleteConfirm(false);
  }


  const { data: domainName } = useQuery(
    {
      queryKey: ["domain"],
      queryFn: fetchDomain
    }
  );

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

  const {
    data: mails,
    error,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
    isRefetching
  } = useInfiniteQuery({
    queryKey: queryKey,
    queryFn: async ({
      pageParam,
    }): Promise<MailResponse> => fetchMails(selectedAddress, pageParam),
    initialPageParam: '',
    getPreviousPageParam: (firstPage) => firstPage.previousId,
    getNextPageParam: (lastPage) => lastPage.nextId,
    enabled: !!selectedAddress,
  });

  useEffect(() => {

    const newMailCheck = () => {
      if (mails && mails.pages.length > 0 && mails.pages[0].previousId) {
        const previousId = mails.pages[0].previousId;
        fetchMails(selectedAddress, previousId).then(
          (p) => {
            if (p.data.length > 0) {
              refetch();
            }
          }
        );
      }
    };

    if (addressesResponse?.refreshInterval) {
      const interval = setInterval(newMailCheck, addressesResponse?.refreshInterval * 1000);
      return () => {
        clearInterval(interval);
      };
    }
  }, [addressesResponse?.refreshInterval, selectedAddress, mails, refetch]);

  useEffect(() => {
    if (inView) {
      fetchNextPage()
    }
  }, [fetchNextPage, inView])

  if (addressIsLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="error">{error.message}</div>;
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
              <ListItemIcon>
                {address.addr === selectedAddress ? <DraftsIcon /> : <MailIcon />}
              </ListItemIcon>
              <ListItemText primary={address.addr} />
              <ListItemText sx={{ ml: "auto", textAlign: "right" }} primary={unreadCounts?.filter(p => p.recipient === address.addr).at(0)?.unread} primaryTypographyProps={{ color: "primary" }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <ListItem disablePadding>
        <ListItemButton onClick={(_e) => { navigate('/manage'); }}>
          <ListItemIcon>
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
          <Typography variant="h6" noWrap component="div">
            {getFullAddress()}
          </Typography>
          <Tooltip title="Copy">
            <IconButton onClick={copyClicked}>
              <ContentCopy />
            </IconButton>
          </Tooltip>
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
          {isFetching && !isRefetching && (<>Loading...</>)}
          {mails && mails.pages && mails.pages.map((mailPage) => {
            return mailPage.data.map((mail) =>
            (
              <MailboxItem key={mail.id} mail={mail} onDelete={onMailItemDelete} onSelect={() => onMailItemSelect(mail)} />
            ))
          }
          )
          }

          <Box ref={ref} mt={3} mb={3} flex="0 0 auto" display="flex" justifyContent={'center'}>
            {isFetching && !isFetchingNextPage && <CircularProgress color="primary" />}
            {isFetchingNextPage && <CircularProgress />}
            {!hasNextPage && !isFetching && <Divider component="div" sx={{ width: "100%" }}><Typography variant='body1'>No more mail</Typography></Divider>}
          </Box>
        </Grid>
      </Box>

      <Dialog
        open={deleteConfirm}
        onClose={deleteNo}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Confirm
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            delete?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={deleteNo}>No</Button>
          <Button onClick={deleteYes} autoFocus>
            Yes
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

export default Mailbox;