import { Address } from "../models/address.js";
import { Mail } from "../models/mail.js";
import { UnreadCount } from "../models/unread-count.js";
import { ApiKeyMetadata, ApiKeyRecord, NewApiKeyRecord } from "../models/api-key.js";

export interface DatabaseFacade {
    // Address
    addAddress(address: string): Promise<void>;
    getAddresses(sub: string | undefined): Promise<Address[]>;
    getAddress(address: string): Promise<Address | undefined>;
    updateAddressOwner(address: string, owner: string | null | undefined): Promise<void>;
    deleteAddress(address: string): Promise<void>;
    getAddressCount(owner: string | undefined): Promise<number>;

    // Mails
    addMail(mail: Mail): Promise<void>;
    getMail(id: string): Promise<Mail | undefined>;
    getMails(
        addr: string,
        deleted: boolean,
        cursorId: string,
        perPage: number,
        owner: string | undefined,
        direction: string
    ): Promise<Mail[]>;
    getAllMails(owner: string | undefined): Promise<Mail[]>;

    // Unread
    getUnread(owner: string | undefined): Promise<UnreadCount[]>;
    markMailAsRead(mailId: string): Promise<number>;
    markAllAsRead(addr: string): Promise<number>;
    getUnreadMailsCount(owner: string | undefined): Promise<number>;

    // API keys
    createApiKey(apiKey: NewApiKeyRecord): Promise<void>;
    getApiKeyByPrefix(prefix: string): Promise<ApiKeyRecord | undefined>;
    listApiKeys(owner: string): Promise<ApiKeyMetadata[]>;
    listGlobalApiKeys(): Promise<ApiKeyMetadata[]>;
    touchApiKeyLastUsed(id: string, usedAt: Date): Promise<void>;
    revokeApiKey(id: string, owner: string): Promise<number>;
    revokeGlobalApiKey(id: string): Promise<number>;

    // Deletions
    softDeleteMail(id: string): Promise<number>;
    deleteMail(id: string): Promise<number>;
    deleteMailsForAddress(addr: string): Promise<number>;
    emptyDeletedMails(owner: string | undefined): Promise<number>;
    restoreDeletedMails(owner: string | undefined): Promise<number>;
}
