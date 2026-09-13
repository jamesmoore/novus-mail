export interface ApiKey {
    id: string;
    name: string;
    accessMode: 'owner' | 'global';
    owner: string | null;
    keyPrefix: string;
    createdAt: string;
    expiresAt: string | null;
    revokedAt: string | null;
    lastUsedAt: string | null;
}

export interface CreatedApiKey {
    key: string;
    apiKey: ApiKey;
}
