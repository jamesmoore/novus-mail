import { useEffect, useState } from 'react';
import { addAddress as apiAddAddress, deleteAddress as apiDeleteAddress } from './api-client';
import { Button, Container, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl, MenuItem, Select, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import useAddressResponse from './useAddressResponse';
import useDomain from './useDomain';

function Manage() {
    const [newAddressText, setNewAddressText] = useState('');
    const [selectedAddress, setSelectedAddress] = useState('');
    const [alertText, setAlertText] = useState<string | null>(null);
    const [alertVisible, setAlertVisible] = useState(false);
    const [deleteConfirm, setdeleteConfirm] = useState(false);

    const { data: domainName } = useDomain();

    const { data: addressesResponse, error, refetch: refreshAddresses } = useAddressResponse();

    useEffect(
        () => {
            if (addressesResponse && addressesResponse.addresses.length > 0) {
                const addresses = addressesResponse.addresses;
                setSelectedAddress(addresses[addresses.length - 1].addr);
            }
            else {
                setSelectedAddress('');
            }
        },
        [addressesResponse]
    );

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

    function deleteAddress() {
        setdeleteConfirm(true);
    }

    function deleteYes() {
        setSelectedAddress('');
        apiDeleteAddress(selectedAddress)
            .then((data: string) => {
                if (data === 'done') {
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
        <Container sx={{ display: "flex", flexDirection: "column", flex: "1 0 auto" }}>
            <Grid container direction="column" justifyContent="center" alignItems="center" >
                <Grid>
                    <Typography sx={{ m: 1 }} variant="h5" gutterBottom >New mail address</Typography>
                </Grid>
                <Grid container direction="row" justifyContent="center" alignItems="center" flex="0 0 auto">
                    <FormControl>
                        <TextField type="text" onChange={event => setNewAddressText(event.target.value)} value={newAddressText} placeholder="New address" style={{ flex: 1 }} />
                    </FormControl>
                    <FormControl sx={{ m: 1 }}>
                        @{domainName}
                    </FormControl>
                </Grid>
                <Grid >
                    <Button sx={{ m: 1 }} variant="contained" onClick={addAddress}>Add this address</Button>
                </Grid>
            </Grid>
            {(addressesResponse?.addresses?.length ?? 0) > 0 &&
                <Grid container direction="column" justifyContent="center" alignItems="center" >
                    {/*List of existing addresses*/}
                    <Grid sx={{ m: 1 }}>
                        <Typography variant="h5" gutterBottom>Manage addresses</Typography>
                    </Grid>
                    <Grid container direction="row" justifyContent="center" alignItems="center" >
                        <FormControl sx={{ minWidth: 210 }}>
                            <Select value={selectedAddress} onChange={(e) => setSelectedAddress(e.target.value)}>
                                {addressesResponse && addressesResponse.addresses.map((address, index) => (
                                    <MenuItem key={index} value={address.addr} >
                                        {address.addr}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl sx={{ m: 1 }}>
                            @{domainName}
                        </FormControl>
                    </Grid>
                    {/*Delete selected address*/}
                    <Button sx={{ m: 1 }} variant="contained" disabled={addressesResponse === undefined || addressesResponse.addresses.length == 0} onClick={deleteAddress}>Delete this address</Button>
                </Grid>
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

        </Container>
    );
}

export default Manage;