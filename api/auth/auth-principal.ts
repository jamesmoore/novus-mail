export type AuthPrincipal = {
    authType: 'oidc' | 'api-key' | 'anonymous';
    accessMode: 'owner' | 'global';
    owner?: string;
    apiKeyId?: string;
};
