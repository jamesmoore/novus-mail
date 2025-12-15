import { useEffect, useMemo, useState } from 'react';
import { addAddress as apiAddAddress, deleteAddress as apiDeleteAddress, getAddress, logout, updateAddress } from './api-client';
import useAddressResponse from './useAddressResponse';
import useDomain from './useDomain';
import { enqueueSnackbar, SnackbarProvider } from 'notistack';
import useUser from './useUser';
import { Button } from './components/ui/button';
import { CircleAlert, LogOut, Plus, Trash, User, X } from 'lucide-react';
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

    const addressIsInvalid = useMemo(() => newAddressText !== '' && (isValidAddress === false || addressExists),
        [newAddressText, isValidAddress, addressExists]);

    if (error) {
        return <div>{error.message}</div>;
    }

    const paperClassName = "rounded-sm paper-background shadow-sm";

    return (
        <>
            <SnackbarProvider />
            {
                user && <div className={paperClassName}>
                    <div className='flex flex-wrap m-1 ml-2 p-1'>
                        <div className='flex items-center w-full md:w-3/12'>
                            User
                        </div>
                        <div className='flex items-center w-7/12 gap-1 mt-2 md:mt-0' >
                            {user.picture ?
                                <Avatar>
                                    <AvatarImage
                                        src={user.picture}
                                        alt={user.email}
                                    />
                                </Avatar>
                                : <User />}
                            {user.email ?? 'Anon'}&nbsp;{`(${user.strategy})`}
                        </div>
                        <div className='flex ml-auto w-2/12 justify-end' >
                            <Button disabled={!user.requiresAuth} onClick={doLogout}>
                                <LogOut />Logout
                            </Button>
                        </div>
                    </div>
                </div>
            }
            <div className={paperClassName}>
                <div className="flex flex-wrap m-1 ml-2 p-1">
                    <div className='flex items-center w-full md:w-3/12'>
                        New address
                    </div>
                    <div className='flex flex-col mt-2 w-6/12 md:w-3/12 md:mt-0'>
                        <Input
                            type="text"
                            onChange={event => setNewAddressText(event.target.value)}
                            value={newAddressText}
                            placeholder="New address"
                            aria-invalid={addressIsInvalid}
                        />
                        {addressIsInvalid &&
                            <div className='flex flex-row items-center text-red-700 text-sm mt-1 w-full whitespace-nowrap'>
                                <CircleAlert />&nbsp;{addressExists ? 'Address exists.' : 'This email is invalid.'}
                            </div>
                        }
                    </div>
                    <div className='flex items-center mt-2 md:mt-0'>
                        @{domainName}
                    </div>
                    <div className='flex ml-auto sm:w-2/12 justify-end mt-2 md:mt-0' >
                        <Button disabled={newAddressText === '' || addressIsInvalid} onClick={addAddress}>
                            <Plus />Add
                        </Button>
                    </div>
                </div>
            </div>
            {
                (addressesResponse?.addresses?.length ?? 0) > 0 &&
                <div className={paperClassName}>
                    <div className="flex flex-wrap m-1 ml-2 p-1 ">
                        <div className='w-full md:w-3/12 mt-1'>
                            Manage addresses
                        </div>
                        <div className='flex flex-col w-full md:w-9/12'>
                            {
                                addressesResponse && addressesResponse.addresses.map(({ addr, owner }) => (
                                    <div
                                        key={addr}
                                        className='flex flex-row pb-1'
                                        onPointerEnter={() => { setSelectedAddress(addr) }}
                                        onPointerLeave={() => { setSelectedAddress(''); setDeleteAddress(''); }}
                                    >
                                        <div className='flex items-center' >
                                            <span>{addr}</span>
                                            <span style={{ opacity: 0.3 }}>@{domainName}</span>
                                        </div>
                                        <div className='flex items-center justify-end ml-auto gap-2' >
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
                                                    <span className='text-red-700'>Confirm delete?</span>
                                                    <Button variant="destructive" onPointerUp={() => confirmDeleteClicked(addr)}>
                                                        <X />
                                                    </Button>
                                                </>
                                            }
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            }
        </ >
    );
}

export default Manage;