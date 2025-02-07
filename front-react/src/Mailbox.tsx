import { useState, useEffect, useContext, ChangeEvent } from 'react';
import { isEnterKeyUp, isLeftMouseClick } from './Events';
import { useNavigate } from 'react-router-dom';
import AddressContext from './AddressContext';
import { AppBar, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Drawer, Fab, FormControl, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, MenuItem, Pagination, Paper, Select, Toolbar, Tooltip, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import ContentCopy from '@mui/icons-material/ContentCopy';
import { useQuery } from '@tanstack/react-query';
import { fetchAddress, fetchDomain, fetchMails, deleteMail } from './api-client';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';

import MailIcon from '@mui/icons-material/Mail';
import MenuIcon from '@mui/icons-material/Menu';
import InboxIcon from '@mui/icons-material/MoveToInbox';

const handleCopy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

function Mailbox() {
  const [error, setError] = useState<string | null>(null);
  const { selectedAddress, setSelectedAddress } = useContext(AddressContext);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteItemKey, setDeleteItemKey] = useState<string | null>(null);
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




  async function copyClicked() {
    await handleCopy(selectedAddress + domainName);

  }

  async function mailClicked(e: React.MouseEvent<HTMLDivElement>, itemKey: string) {
    if (isLeftMouseClick(e)) {
      navigate('/mail/' + itemKey);
    }
  }

  async function mailKeyUp(e: React.KeyboardEvent<HTMLDivElement>, itemKey: string) {
    if (isEnterKeyUp(e)) {
      navigate('/mail/' + itemKey);
    }
  }

  async function deleteClicked(e: React.MouseEvent<HTMLButtonElement>, itemKey: string) {
    e.stopPropagation();
    if (isLeftMouseClick(e)) {
      await deleteMailEvent(itemKey);
    }
  }

  async function deleteKeyUp(e: React.KeyboardEvent<HTMLButtonElement>, itemKey: string) {
    e.stopPropagation();
    if (isEnterKeyUp(e)) {
      await deleteMailEvent(itemKey);
    }
  }

  async function deleteMailEvent(itemKey: string) {
    setDeleteItemKey(itemKey);
    setDeleteConfirm(true);
  }

  async function deleteYes() {
    deleteMail(deleteItemKey!)
      .then(() => {
        setDeleteConfirm(false);
        refreshMails();
      })
      .catch(error => {
        setError('Failed to delete mail ' + error);
      });
  }

  async function deleteNo() {
    setDeleteConfirm(false);
  }

  function handlePageChange(_: ChangeEvent<unknown>, page: number): void {
    setPage(page);
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

  useEffect(
    () => {
      if (addressesResponse && addressesResponse.addresses.length > 0) {
        const addresses = addressesResponse.addresses;
        if (selectedAddress === '' || addresses.every(p => p.addr !== selectedAddress)) {
          setSelectedAddress(addresses[addresses.length - 1].addr);
        }
      }
    },
    [addressesResponse]
  );

  useEffect(() => {
    setPage(1);
  }, [selectedAddress]);

  const { data: mails, isLoading: mailsLoading, refetch: refreshMails } = useQuery(
    {
      queryKey: ["mail", selectedAddress, page],
      queryFn: () => fetchMails(selectedAddress, page),
      refetchInterval: addressesResponse ? addressesResponse?.refreshInterval * 1000 : false,
    }
  );

  useEffect(() => {
    setPageCount(mails ? mails.length > 0 ? page + 1 : page : 1);
  }, [mails]);

  if (addressIsLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        {['Inbox', 'Starred', 'Send email', 'Drafts'].map((text, index) => (
          <ListItem key={text} disablePadding>
            <ListItemButton>
              <ListItemIcon>
                {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        {['All mail', 'Trash', 'Spam'].map((text, index) => (
          <ListItem key={text} disablePadding>
            <ListItemButton>
              <ListItemIcon>
                {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
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
            Responsive drawer
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
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
        // sx={{ flex: "1 1 auto", flexDirection: 'column', display: "flex", p: 1 }}
        sx={{
          display: "flex",
          flexDirection: "column",
          //flexGrow: 1,
          flex: "1 1 auto",
          p: 1,
          width: { 
            xs: "100%", 
            sm: `calc(100% - ${drawerWidth}px)` }
        }}
      >
        <Grid
          container
          direction="row" justifyContent="center" alignItems="center" flex="0 0 auto"
        >
          <FormControl sx={{ m: 1, minWidth: 180 }}>
            <Select value={selectedAddress} fullWidth={false}
              onChange={(event) => {
                setSelectedAddress(event.target.value);
              }}
            >
              {addressesResponse && addressesResponse.addresses.map((address, index) => (
                <MenuItem key={index} value={address.addr}>
                  {address.addr}
                </MenuItem >
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ m: 1 }} >
            @{domainName}
          </FormControl>
          <FormControl sx={{ m: 1 }} >
            <Tooltip title="Copy">
              <IconButton onClick={copyClicked}>
                <ContentCopy />
              </IconButton>
            </Tooltip>
          </FormControl>
        </Grid>

        <Grid flex="1 0 auto">
          {mailsLoading && (<>Loading...</>)}
          {mails && mails.map((mail) => (
            <Paper sx={{ mt: 1, mb: 1, "&:hover": { cursor: "pointer" } }} elevation={3} tabIndex={1} role="button" onKeyUp={(e) => mailKeyUp(e, mail.id)} onClick={(e) => mailClicked(e, mail.id)}>
              <Grid container sx={{ ml: 1 }}>
                <Grid container size={11} key={mail.id} alignItems='center'>
                  <Grid size={{ xs: 12, md: 4 }} >
                    {mail.sender}
                  </Grid>
                  <Grid
                    size={{ md: 8 }}
                    sx={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                    {mail.subject}
                  </Grid>
                </Grid>
                <Grid container size={1} justifyContent='right' alignItems='center'>
                  <IconButton color="error" aria-label="delete" onKeyUp={(e) => deleteKeyUp(e, mail.id)} onClick={(e) => deleteClicked(e, mail.id)} >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Paper>
          ))
          }
        </Grid>

        <Paper sx={{ p: 1, flex: "0 0 auto" }} elevation={3}>
          <Grid container direction="row" justifyContent="center" alignItems="center">
            <Pagination count={pageCount} page={page} onChange={handlePageChange} />
          </Grid>
        </Paper>

      </Box >

      <Fab size="small" sx={{
        position: 'absolute',
        bottom: 48 + 16,
        right: 16,
      }} onClick={() => { navigate('/manage'); }}>
        <SettingsIcon />
      </Fab>

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