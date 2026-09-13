import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, KeyRound, Plus, Trash } from 'lucide-react';
import { createApiKey, fetchApiKeys, revokeApiKey } from './api-client';
import { CreatedApiKey } from './models/api-key';
import useUser from './use-user';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Badge } from './components/ui/badge';
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
import { toast } from 'sonner';

const queryKey = ['api-keys'];

export function ApiKeyManagement() {
    const { data: user } = useUser();
    const queryClient = useQueryClient();
    const [name, setName] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [createdKey, setCreatedKey] = useState<CreatedApiKey | null>(null);
    const enabled = !!user?.requiresAuth && !!user.isAuthenticated;

    const keys = useQuery({
        queryKey,
        queryFn: fetchApiKeys,
        enabled,
    });

    const createKey = useMutation({
        mutationFn: () => createApiKey(
            name.trim(),
            expiresAt ? new Date(expiresAt).toISOString() : null,
        ),
        onSuccess: async (created) => {
            setCreatedKey(created);
            setName('');
            setExpiresAt('');
            await queryClient.invalidateQueries({ queryKey });
        },
        onError: (error) => toast.error(error.message),
    });

    const revokeKey = useMutation({
        mutationFn: revokeApiKey,
        onSuccess: async () => {
            toast.success('API key revoked');
            await queryClient.invalidateQueries({ queryKey });
        },
        onError: (error) => toast.error(error.message),
    });

    if (!enabled) {
        return null;
    }

    async function copyCreatedKey() {
        if (!createdKey) return;
        try {
            await navigator.clipboard.writeText(createdKey.key);
            toast.success('API key copied');
        } catch {
            toast.error('Could not copy API key');
        }
    }

    return (
        <div className="rounded-sm bg-sidebar shadow-sm">
            <div className="m-1 ml-2 p-1">
                <div className="flex flex-col gap-4 md:flex-row">
                    <div className="w-full md:w-3/12">
                        <div className="flex items-center gap-2"><KeyRound className="size-4" />API keys</div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Authenticate status checks without an interactive login.
                        </p>
                    </div>

                    <div className="flex w-full flex-col gap-4 md:w-3/4">
                        <form
                            className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
                            onSubmit={(event) => {
                                event.preventDefault();
                                createKey.mutate();
                            }}
                        >
                            <div className="grid gap-1.5">
                                <Label htmlFor="api-key-name">Name</Label>
                                <Input
                                    id="api-key-name"
                                    value={name}
                                    maxLength={100}
                                    placeholder="Uptime monitor"
                                    onChange={(event) => setName(event.target.value)}
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="api-key-expiry">Expires (optional)</Label>
                                <Input
                                    id="api-key-expiry"
                                    type="datetime-local"
                                    value={expiresAt}
                                    min={toLocalDateTimeInput(new Date())}
                                    onChange={(event) => setExpiresAt(event.target.value)}
                                />
                            </div>
                            <Button type="submit" disabled={!name.trim() || createKey.isPending}>
                                <Plus />{createKey.isPending ? 'Creating…' : 'Create'}
                            </Button>
                        </form>

                        {keys.isError && <p className="text-sm text-destructive">Could not load API keys.</p>}
                        {keys.isLoading && <p className="text-sm text-muted-foreground">Loading API keys…</p>}
                        {keys.data?.length === 0 && (
                            <p className="text-sm text-muted-foreground">No API keys have been created.</p>
                        )}

                        <div className="flex flex-col gap-2">
                            {keys.data?.map((apiKey) => {
                                const expired = !!apiKey.expiresAt && new Date(apiKey.expiresAt) <= new Date();
                                const inactive = !!apiKey.revokedAt || expired;
                                return (
                                    <div key={apiKey.id} className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-medium">{apiKey.name}</span>
                                                <Badge variant={inactive ? 'secondary' : 'default'}>
                                                    {apiKey.revokedAt ? 'Revoked' : expired ? 'Expired' : 'Active'}
                                                </Badge>
                                            </div>
                                            <div className="mt-1 text-xs text-muted-foreground">
                                                <span className="font-mono">nvm_{apiKey.keyPrefix}_…</span>
                                                <span> · Created {formatDate(apiKey.createdAt)}</span>
                                                {apiKey.expiresAt && <span> · Expires {formatDate(apiKey.expiresAt)}</span>}
                                                {apiKey.lastUsedAt && <span> · Last used {formatDate(apiKey.lastUsedAt)}</span>}
                                            </div>
                                        </div>

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="outline" size="icon" aria-label={`Revoke ${apiKey.name}`} disabled={inactive || revokeKey.isPending}>
                                                    <Trash />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Revoke API key?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        “{apiKey.name}” will immediately stop authenticating status requests. This cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => revokeKey.mutate(apiKey.id)}>Revoke</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <AlertDialog open={createdKey !== null} onOpenChange={(open) => !open && setCreatedKey(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>API key created</AlertDialogTitle>
                        <AlertDialogDescription>
                            Copy this key now. It is stored as a hash and cannot be shown again.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
                        <code className="min-w-0 flex-1 break-all text-sm">{createdKey?.key}</code>
                        <Button type="button" variant="outline" size="icon" aria-label="Copy API key" onClick={copyCreatedKey}>
                            <Copy />
                        </Button>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setCreatedKey(null)}>I’ve saved it</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function toLocalDateTimeInput(value: Date) {
    const offset = value.getTimezoneOffset() * 60_000;
    return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}
