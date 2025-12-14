import { useEffect, useMemo, useState } from 'react';
import { addAddress as apiAddAddress, deleteAddress as apiDeleteAddress, getAddress, logout, updateAddress } from './api-client';
import { Paper } from '@mui/material';
import Grid from '@mui/material/Grid';
import useAddressResponse from './useAddressResponse';
import useDomain from './useDomain';
import { enqueueSnackbar, SnackbarProvider } from 'notistack';
import useUser from './useUser';
import { Button } from './components/ui/button';
import { LogOut, Plus, Trash, User, X } from 'lucide-react';
import { Input } from './components/ui/input';
import { Switch } from './components/ui/switch';
import { Avatar, AvatarImage } from './components/ui/avatar';

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

    const doLogout = async () => {
        const logoutResponse = await logout();
        if (logoutResponse.logoutUrl) {
            window.location.href = logoutResponse.logoutUrl;
        }
        else {
            window.location.href = "/";
        }
    };

    if (error) {
        return <div>{error.message}</div>;
    }

    return (
        <Grid>
            {/*
            <h1 className="text-3xl font-bold underline">
                Hello world!
            </h1>
            */}
            <SnackbarProvider />
            {
                user && <Paper>
                    <Grid container mb={1} ml={1} mr={1} p={1}>
                        <Grid size={{ xs: 12, md: 3 }} display={'flex'} alignItems={'center'} sx={{
                            mb: { xs: 1, md: 0 }
                        }} >
                            User
                        </Grid>
                        <Grid container size={{ xs: 12, md: 9 }} flexDirection={'row'} >
                            <Grid container direction="row" alignItems={'center'} flex="0 0 auto" size={{ xs: 12, md: 10 }} columnGap={1}>
                                {user.picture ?
                                    <Avatar>
                                        <AvatarImage
                                            src={user.picture}
                                            alt={user.email}
                                        />
                                    </Avatar>
                                    : <User />}
                                {user.email ?? 'Anon'} ({user.strategy})
                            </Grid>
                            <Grid display={'flex'} size={{ xs: 12, md: 2 }} justifyContent={'right'} sx={{
                                mt: { xs: 2, md: 0 }
                            }}>
                                <Button disabled={!user.requiresAuth} onClick={doLogout}>
                                    <LogOut />Logout
                                </Button>
                            </Grid>
                        </Grid>
                    </Grid>
                </Paper>
            }
            <Paper>
                <Grid container m={1} p={1}>
                    <Grid size={{ xs: 12, md: 3 }}>
                        New address
                    </Grid>
                    <Grid container size={{ xs: 12, md: 9 }} flexDirection={'row'}>
                        <Grid container direction="row" alignItems={'center'} flex="0 0 auto" size={{ xs: 12, md: 10 }}>
                            <Input
                                type="text"
                                onChange={event => setNewAddressText(event.target.value)}
                                value={newAddressText}
                                placeholder="New address"
                                style={{ flex: 1 }}
                                aria-invalid={newAddressText !== '' && (isValidAddress === false || addressExists)}
                            />
                            {newAddressText !== '' && isValidAddress === false && <p className='text-muted-foreground text-red-700 text-xs'>This email is invalid.</p>}
                            {newAddressText !== '' && addressExists && <p className='text-muted-foreground text-red-700 text-xs'>Address exists.</p>}
                            @{domainName}
                        </Grid>
                        <Grid display={'flex'} size={{ xs: 12, md: 2 }} justifyContent={'right'} sx={{
                            mt: { xs: 2, md: 0 }
                        }}>
                            <Button disabled={newAddressText === '' || isValidAddress === false || addressExists} onClick={addAddress}>
                                <Plus />Add
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>
            </Paper>
            {
                (addressesResponse?.addresses?.length ?? 0) > 0 &&
                <Paper>
                    <Grid container m={1} p={1} >
                        <Grid container mt={2} mb={2} size={{ xs: 12, md: 3 }} >
                            Manage addresses
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
                                            <span>{addr}</span>
                                            <span style={{ opacity: 0.3 }}>@{domainName}</span>
                                        </Grid>
                                        <Grid display={'flex'} sx={{ marginLeft: 'auto' }} justifyContent={'right'} alignItems={'center'}>
                                            {deleteAddress !== addr &&
                                                <>
                                                    {owner ? 'Private' : 'Public'}
                                                    <Switch
                                                        checked={!!owner}
                                                        onCheckedChange={(checked: boolean) => setVisibility(addr, checked)}
                                                    />
                                                    <Button
                                                        aria-label="delete"
                                                        onClick={() => deleteClicked(addr)}
                                                        variant={selectedAddress === addr ? "destructive" : "secondary"}>
                                                        <Trash />
                                                    </Button>
                                                </>
                                            }
                                            {deleteAddress === addr &&
                                                <>
                                                    <span style={{ color: "red" }}>Confirm delete?</span>
                                                    <Button variant="destructive" onPointerUp={() => confirmDeleteClicked(addr)}>
                                                        <X />
                                                    </Button>
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

        </Grid >



    );
}

export default Manage;