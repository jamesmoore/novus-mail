export type ApiKeyAccessMode = 'owner' | 'global';

export interface ApiKeyRecord {
    id: string;
    name: string;
    accessMode: ApiKeyAccessMode;
    owner: string | null;
    keyPrefix: string;
    secretHash: string;
    createdAt: Date;
    expiresAt: Date | null;
    revokedAt: Date | null;
    lastUsedAt: Date | null;
}

export type ApiKeyMetadata = Omit<ApiKeyRecord, 'secretHash'>;

export interface NewApiKeyRecord {
    id: string;
    name: string;
    accessMode: ApiKeyAccessMode;
    owner: string | null;
    keyPrefix: string;
    secretHash: string;
    createdAt: Date;
    expiresAt: Date | null;
}
