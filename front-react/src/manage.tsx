import { useEffect, useMemo, useState } from 'react';
import { addAddress, deleteAddress, getAddress, updateAddress } from './api-client';
import useAddressResponse from './use-address-response';
import useDomain from './use-domain';
import { Button } from './components/ui/button';
import { CircleAlert, Moon, Plus, Sun, SunMoon, Trash } from 'lucide-react';
import { Input } from './components/ui/input';
import { Switch } from './components/ui/switch';
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
import { ImportForm } from './import-form';
import { ExportButton } from './export-button';

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

    async function addAddressClicked() {
        if (addressExists) {
            toast.error('Address already exists');
        }
        else if (newAddressText !== '') {
            const result = await addAddress(newAddressText);
            if (result) {
                toast.success('Added ' + newAddressText);
                setNewAddressText("");
                await refreshAddresses();
            }
            else {
                toast.error('Failed to add address');
            }
        }
    }

    async function confirmDeleteClicked(addr: string) {
        const success = await deleteAddress(addr);
        if (success) {
            toast.success('Deleted ' + addr);
            await refreshAddresses();
        }
        else {
            toast.error('Failed to delete ' + addr);
        }
    }

    async function setVisibility(addr: string, makePrivate: boolean) {
        const success = await updateAddress(addr, makePrivate);
        if (success) {
            await refreshAddresses();
            toast.success(addr + (makePrivate ? ' made private 🔒' : ' made public 🔓'));
        }
        else {
            toast.error('Failed to update ' + addr);
        }
    }

    const addressIsInvalid = useMemo(() => newAddressText !== '' && (isValidAddress === false || addressExists),
        [newAddressText, isValidAddress, addressExists]);

    if (error) {
        return <div>{error.message}</div>;
    }

    const paperClassName = "rounded-sm bg-sidebar shadow-sm";

    return (
        <>
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
                        <Button disabled={newAddressText === '' || addressIsInvalid} onClick={addAddressClicked}>
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

            <div className={paperClassName}>
                <div className="flex flex-wrap items-center m-1 ml-2 p-1">
                    <div className='w-full md:w-3/12'>
                        Export
                    </div>
                    <div className='mt-2 md:mt-0' >
                        <ExportButton/>
                    </div>
                </div>
            </div>

            <div className={paperClassName}>
                <div className="flex flex-wrap items-center m-1 ml-2 p-1">
                    <div className='w-full md:w-3/12'>
                        Import
                    </div>
                    <div className='mt-2 md:mt-0'>
                        <ImportForm/>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Manage;

