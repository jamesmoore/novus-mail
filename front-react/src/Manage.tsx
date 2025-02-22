import { useState } from 'react';
import { addAddress as apiAddAddress, deleteAddress as apiDeleteAddress } from './api-client';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl, IconButton, Paper, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import useAddressResponse from './useAddressResponse';
import useDomain from './useDomain';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

function Manage() {
    const [newAddressText, setNewAddressText] = useState('');
    const [selectedAddress, setSelectedAddress] = useState('');
    const [deleteAddress, setDeleteAddress] = useState('');
    const [alertText, setAlertText] = useState<string | null>(null);
    const [alertVisible, setAlertVisible] = useState(false);
    const [deleteConfirm, setdeleteConfirm] = useState(false);

    const { data: domainName } = useDomain();

    const { data: addressesResponse, error, refetch: refreshAddresses } = useAddressResponse();

    function addAddress() {
        const regex = /^(?!\.)(?!.*\.\.)(?!.*\.$)[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]{1,64}$/;
        if (regex.test(newAddressText)) {
            apiAddAddress(newAddressText)
                .then((data: string) => {
                    if (data == "exist") {
                        setAlertText("address already exist");
                        setAlertVisible(true);
                    }

                    if (data == "done") {
                        setNewAddressText("");
                        refreshAddresses();
                    }
                }
                );
        } else {
            setAlertText("Invalid email address");
            setAlertVisible(true);
        }
    }

    function deleteClicked(addr: string) {
        setDeleteAddress(addr);
        setdeleteConfirm(true);
    }

    function deleteYes() {
        apiDeleteAddress(deleteAddress)
            .then((data: string) => {
                if (data === 'done') {
                    setDeleteAddress('');
                    setdeleteConfirm(false);
                    refreshAddresses();
                }
            });
    }

    function deleteNo() {
        setdeleteConfirm(false);
    }

    function alertOk() {
        setAlertVisible(false);
    }

    if (error) {
        return <div>{error.message}</div>;
    }

    return (
        <>
            <Paper >
                <Grid container m={1} p={1}>
                    <Grid mt={2} mb={2} size={{ xs: 12, md: 3 }}>
                        <Typography>New address</Typography>
                    </Grid>
                    <Grid container size={{ xs: 12, md: 9 }} flexDirection={'row'}>
                        <Grid container direction="row" alignItems={'center'} flex="0 0 auto" size={{ xs: 12, md: 10 }}>
                            <FormControl>
                                <TextField type="text" onChange={event => setNewAddressText(event.target.value)} value={newAddressText} placeholder="New address" style={{ flex: 1 }} />
                            </FormControl>
                            <FormControl sx={{ m: 1 }}>
                                @{domainName}
                            </FormControl>
                        </Grid>
                        <Grid display={'flex'} size={{ xs: 12, md: 2 }} justifyContent={'right'} sx={{
                            mt: { xs: 2, md: 0 }
                        }}>
                            <Button fullWidth={true} onClick={addAddress} startIcon={<AddIcon />} >Add</Button>
                        </Grid>
                    </Grid>
                </Grid>
            </Paper>
            {(addressesResponse?.addresses?.length ?? 0) > 0 &&
                <Paper>
                    <Grid container m={1} p={1} >
                        <Grid container mt={2} mb={2} size={{ xs: 12, md: 3 }} >
                            <Typography>Manage addresses</Typography>
                        </Grid>
                        <Grid container size={{ xs: 12, md: 9 }} flexDirection={'column'}>
                            {
                                addressesResponse && addressesResponse.addresses.map((address) => address.addr).map((address) => (
                                    <Grid
                                        container
                                        pt={1}
                                        pb={1}
                                        flexDirection={'row'}
                                        onPointerEnter={() => { setSelectedAddress(address) }}
                                        onPointerLeave={() => { setSelectedAddress('') }}
                                    >
                                        <Grid display={'flex'} size={{ xs: 10 }} alignItems={'center'}>
                                            <Typography component={'span'}>{address}</Typography>
                                            <Typography component={'span'} sx={{ opacity: 0.3 }}>@{domainName}</Typography>
                                        </Grid>
                                        <Grid display={'flex'} size={{ xs: 2 }} justifyContent={'right'} >
                                            <IconButton aria-label="delete" onClick={() => deleteClicked(address)} >
                                                {!(selectedAddress === address) && <DeleteOutlineIcon color="action" opacity={0.3} />}
                                                {selectedAddress === address && <DeleteIcon color="error" />}
                                            </IconButton>
                                        </Grid>
                                    </Grid>
                                ))
                            }
                        </Grid>
                    </Grid>
                </Paper>
            }

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
                        delete this address ?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={deleteNo}>No</Button>
                    <Button onClick={deleteYes} autoFocus>
                        Yes
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={alertVisible}
                onClose={alertOk}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    Alert
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        {alertText}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={alertOk} autoFocus>
                        Ok
                    </Button>
                </DialogActions>
            </Dialog>

        </>
    );
}

export default Manage;