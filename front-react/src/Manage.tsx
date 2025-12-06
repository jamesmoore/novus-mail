import { useEffect, useMemo, useState } from 'react';
import { addAddress as apiAddAddress, deleteAddress as apiDeleteAddress, getAddress, updateAddress } from './api-client';
import { Avatar, Button, FormControl, FormControlLabel, IconButton, Paper, Switch, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import useAddressResponse from './useAddressResponse';
import useDomain from './useDomain';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteForever from '@mui/icons-material/DeleteForever';
import AddIcon from '@mui/icons-material/Add';
import { enqueueSnackbar, SnackbarProvider } from 'notistack';
import useUser from './useUser';

function Manage() {
    const [newAddressText, setNewAddressText] = useState('');
    const [selectedAddress, setSelectedAddress] = useState('');
    const [deleteAddress, setDeleteAddress] = useState('');

    const { data: domainName } = useDomain();

    const { data: addressesResponse, error, refetch: refreshAddresses } = useAddressResponse();

    const isValidAddress = useMemo(() => {
        const regex = /^(?!\.)(?!.*\.\.)(?!.*\.$)[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]{1,64}$/;
        return regex.test(newAddressText);
    }, [newAddressText]);

    const [addressExists, setAddressExists] = useState(false);

    const { data: user } = useUser();

    useEffect(() => {
        let cancelled = false;
        async function checkAddress() {
            if (newAddressText.trim() === '') {
                setAddressExists((prev) => prev ? false : prev);
                return;
            }

            const result = await getAddress(newAddressText);
            if (!cancelled) {
                setAddressExists(result !== '');
            }
        }

        checkAddress();

        return () => { cancelled = true; };
    }, [newAddressText]);

    function addAddress() {
        if (addressExists) {
            enqueueSnackbar('Address already exists', { variant: 'error' });
        }
        else if (newAddressText !== '') {
            apiAddAddress(newAddressText)
                .then((success: boolean) => {
                    if (success) {
                        enqueueSnackbar('Added ' + newAddressText, { variant: 'success' });
                        setNewAddressText("");
                        refreshAddresses();
                    }
                    else {
                        enqueueSnackbar('Failed to add address', { variant: 'error' });
                    }
                }
                );
        }
    }

    function deleteClicked(addr: string) {
        setDeleteAddress(addr);
    }

    function confirmDeleteClicked(addr: string) {
        apiDeleteAddress(addr)
            .then((success: boolean) => {
                if (success) {
                    enqueueSnackbar('Deleted ' + addr, { variant: 'success' });
                    setDeleteAddress('');
                    refreshAddresses();
                }
                else {
                    enqueueSnackbar('Failed to delete ' + addr, { variant: 'error' });
                }
            });
    }

    function setVisibility(addr: string, makePrivate: boolean) {
        updateAddress(addr, makePrivate).then(
            (success: boolean) => {
                if (success) {
                    refreshAddresses();
                    enqueueSnackbar(addr + (makePrivate ? ' made private 🔒' : ' made public 🔓'), { variant: 'success' });
                }
                else {
                    enqueueSnackbar('Failed to update ' + addr, { variant: 'error' });
                }
            }
        )
    }

    if (error) {
        return <div>{error.message}</div>;
    }

    return (
        <Grid>
            <SnackbarProvider />
            {
                user && <Paper>
                    <Grid container mb={1} ml={1} mr={1} p={1}>
                        <Grid size={{ xs: 12, md: 3 }} display={'flex'} alignItems={'center'} sx={{
                            mb: { xs: 1, md: 0 }
                        }} >
                            <Typography>User</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 9 }} display={'flex'} flexDirection={'row'} alignItems={'center'} columnGap={1}>
                            <Avatar src={user.picture} />
                            <Typography>{user.email ?? 'Anon'} ({user.strategy})</Typography>
                        </Grid>
                    </Grid>
                </Paper>
            }
            <Paper>
                <Grid container m={1} p={1}>
                    <Grid mt={2} mb={2} size={{ xs: 12, md: 3 }}>
                        <Typography>New address</Typography>
                    </Grid>
                    <Grid container size={{ xs: 12, md: 9 }} flexDirection={'row'}>
                        <Grid container direction="row" alignItems={'center'} flex="0 0 auto" size={{ xs: 12, md: 10 }}>
                            <FormControl>
                                <TextField
                                    type="text"
                                    onChange={event => setNewAddressText(event.target.value)}
                                    value={newAddressText}
                                    placeholder="New address"
                                    style={{ flex: 1 }}
                                    error={newAddressText !== '' && (isValidAddress === false || addressExists)}
                                    helperText={newAddressText !== '' && isValidAddress === false ? 'Invalid email address' :
                                        addressExists ? 'Address exists' : ''
                                    }

                                />
                            </FormControl>
                            <FormControl sx={{ m: 1 }}>
                                @{domainName}
                            </FormControl>
                        </Grid>
                        <Grid display={'flex'} size={{ xs: 12, md: 2 }} justifyContent={'right'} sx={{
                            mt: { xs: 2, md: 0 }
                        }}>

                            <Button fullWidth={true} disabled={newAddressText === '' || isValidAddress === false || addressExists} onClick={addAddress} startIcon={<AddIcon />} >Add</Button>
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
                                addressesResponse && addressesResponse.addresses.map(({ addr, owner }) => (
                                    <Grid
                                        key={addr}
                                        container
                                        pt={1}
                                        pb={1}
                                        flexDirection={'row'}
                                        onPointerEnter={() => { setSelectedAddress(addr) }}
                                        onPointerLeave={() => { setSelectedAddress(''); setDeleteAddress(''); }}
                                    >
                                        <Grid display={'flex'} alignItems={'center'}>
                                            <Typography component={'span'}>{addr}</Typography>
                                            <Typography component={'span'} sx={{ opacity: 0.3 }}>@{domainName}</Typography>
                                        </Grid>
                                        <Grid display={'flex'} sx={{ marginLeft: 'auto' }} justifyContent={'right'} alignItems={'center'}>
                                            {deleteAddress !== addr &&
                                                <>
                                                    <FormControlLabel
                                                        control={<Switch
                                                            checked={!!owner}
                                                            onChange={(_event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => setVisibility(addr, checked)}
                                                        />}
                                                        label={owner ? 'Private' : 'Public'}
                                                        labelPlacement='start'
                                                    />
                                                    <IconButton aria-label="delete" onClick={() => deleteClicked(addr)}>
                                                        {!(selectedAddress === addr) && <DeleteOutlineIcon color="action" opacity={0.3} />}
                                                        {selectedAddress === addr && <DeleteIcon color="error" />}
                                                    </IconButton>
                                                </>
                                            }
                                            {deleteAddress === addr &&
                                                <>
                                                    <Typography color='error'>Confirm delete?</Typography>
                                                    <IconButton onPointerUp={() => confirmDeleteClicked(addr)}>
                                                        <DeleteForever color="error" />
                                                    </IconButton>
                                                </>
                                            }
                                        </Grid>
                                    </Grid>
                                ))
                            }
                        </Grid>
                    </Grid>
                </Paper>
            }

        </Grid>
    );
}

export default Manage;