import { useEffect, useMemo, useState } from 'react';
import { addAddress as apiAddAddress, deleteAddress as apiDeleteAddress, getAddress, logout, updateAddress } from './api-client';
import useAddressResponse from './useAddressResponse';
import useDomain from './useDomain';
import useUser from './useUser';
import { Button } from './components/ui/button';
import { CircleAlert, LogOut, Moon, Plus, Sun, SunMoon, Trash, User } from 'lucide-react';
import { Input } from './components/ui/input';
import { Switch } from './components/ui/switch';
import { Avatar, AvatarImage } from './components/ui/avatar';
import { useTheme } from './components/theme-provider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from './components/ui/alert-dialog';
import { Label } from './components/ui/label';
import { toast } from 'sonner';

function Manage() {
    const [newAddressText, setNewAddressText] = useState('');
    const [selectedAddress, setSelectedAddress] = useState('');

    const { data: domainName } = useDomain();

    const { data: addressesResponse, error, refetch: refreshAddresses } = useAddressResponse();

    const isValidAddress = useMemo(() => {
        const regex = /^(?!\.)(?!.*\.\.)(?!.*\.$)[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]{1,64}$/;
        return regex.test(newAddressText);
    }, [newAddressText]);

    const [addressExists, setAddressExists] = useState(false);

    const { data: user } = useUser();

    const { theme, setTheme } = useTheme();

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
            toast.error('Address already exists');
        }
        else if (newAddressText !== '') {
            apiAddAddress(newAddressText)
                .then((success: boolean) => {
                    if (success) {
                        toast.success('Added ' + newAddressText);
                        setNewAddressText("");
                        refreshAddresses();
                    }
                    else {
                        toast.error('Failed to add address');
                    }
                }
                );
        }
    }

    function confirmDeleteClicked(addr: string) {
        apiDeleteAddress(addr)
            .then((success: boolean) => {
                if (success) {
                    toast.success('Deleted ' + addr);
                    refreshAddresses();
                }
                else {
                    toast.error('Failed to delete ' + addr);
                }
            });
    }

    function setVisibility(addr: string, makePrivate: boolean) {
        updateAddress(addr, makePrivate).then(
            (success: boolean) => {
                if (success) {
                    refreshAddresses();
                    toast.success(addr + (makePrivate ? ' made private 🔒' : ' made public 🔓'));
                }
                else {
                    toast.error('Failed to update ' + addr);
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

    const paperClassName = "rounded-sm bg-sidebar shadow-sm";

    const avatar = user && user.picture ?
        <Avatar>
            <AvatarImage src={user.picture} />
        </Avatar>
        : <User />;

    return (
        <>
            {
                user && <div className={paperClassName}>
                    <div className='flex flex-wrap items-center m-1 ml-2 p-1'>
                        <div className='w-full md:w-3/12'>
                            User
                        </div>
                        <div className='flex items-center gap-1 mt-2 md:mt-0 md:flex-1' >
                            {avatar}
                            {user.name ?? user.email ?? 'Anon'}   &nbsp;{`(${user.strategy})`}
                        </div>
                        <div className='ml-auto' >
                            <Button disabled={!user.requiresAuth} onClick={doLogout}>
                                <LogOut />Logout
                            </Button>
                        </div>
                    </div>
                </div>
            }
            <div className={paperClassName}>
                <div className="flex flex-wrap items-center m-1 ml-2 p-1">
                    <div className='w-full md:w-3/12'>
                        New address
                    </div>
                    <div className='flex flex-col mt-2 w-1/2 md:w-1/4 md:mt-0'>
                        <Input
                            type="text"
                            onChange={event => setNewAddressText(event.target.value)}
                            value={newAddressText}
                            placeholder="New address"
                            aria-invalid={addressIsInvalid}
                        />
                        {addressIsInvalid &&
                            <div className='flex items-center text-red-700 text-sm mt-1 w-full whitespace-nowrap'>
                                <CircleAlert />&nbsp;{addressExists ? 'Address exists.' : 'This email is invalid.'}
                            </div>
                        }
                    </div>
                    <div className='mt-2 md:mt-0'>
                        @{domainName}
                    </div>
                    <div className='ml-auto mt-2 md:mt-0' >
                        <Button disabled={newAddressText === '' || addressIsInvalid} onClick={addAddress}>
                            <Plus />Add
                        </Button>
                    </div>
                </div>
            </div>
            {
                (addressesResponse?.addresses?.length ?? 0) > 0 &&
                <div className={paperClassName}>
                    <div className="flex flex-wrap m-1 ml-2 p-1">
                        <div className='w-full md:w-3/12 mt-1'>
                            Manage addresses
                        </div>
                        <div className='flex flex-col w-full md:w-3/4'>
                            {
                                addressesResponse && addressesResponse.addresses.map(({ addr, owner }) => (
                                    <div
                                        key={addr}
                                        className='flex pb-1'
                                        onPointerEnter={() => { setSelectedAddress(addr) }}
                                        onPointerLeave={() => { setSelectedAddress(''); }}
                                    >
                                        <div className='flex items-center' >
                                            <span>{addr}</span>
                                            <span style={{ opacity: 0.3 }}>@{domainName}</span>
                                        </div>
                                        <div className='ml-auto flex items-center gap-2' >
                                            <Label htmlFor={"switch-" + addr}>{owner ? 'Private' : 'Public'}</Label>
                                            <Switch
                                                id={"switch-" + addr}
                                                checked={!!owner}
                                                onCheckedChange={(checked: boolean) => setVisibility(addr, checked)}
                                            />
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        aria-label="delete"
                                                        variant={selectedAddress === addr ? "destructive" : "secondary"}>
                                                        <Trash />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete address?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will permanently delete {addr}@{domainName}.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => confirmDeleteClicked(addr)}>
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            }
            <div className={paperClassName}>
                <div className="flex flex-wrap items-center m-1 ml-2 p-1">
                    <div className='w-full md:w-3/12'>
                        Theme
                    </div>
                    <div className='mt-2 md:mt-0' >
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" >
                                    {theme === 'light' && <><Sun />Light</>}
                                    {theme === 'dark' && <><Moon />Dark</>}
                                    {theme === 'system' && <><SunMoon />System</>}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuItem onClick={() => setTheme("light")}>
                                    <Sun />Light
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme("dark")}>
                                    <Moon />Dark
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme("system")}>
                                    <SunMoon />System
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Manage;

