import { Address } from "./models/address.js";
import { Mail } from "./models/mail.js";
import { UnreadCount } from "./models/unread-count.js";

export interface DatabaseFacade {
    // Address
    addAddress(address: string): Promise<void>;
    getAddresses(sub: string | undefined): Promise<Address[]>;
    getAddress(address: string): Promise<Address | undefined>;
    updateAddressOwner(address: string, owner: string | null | undefined): Promise<void>;
    deleteAddress(address: string): Promise<void>;
    getAddressCount(): Promise<number>;

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
    getUnreadMailsCount(): Promise<number>;

    // Deletions
    softDeleteMail(id: string): Promise<number>;
    deleteMail(id: string): Promise<number>;
    deleteMailsForAddress(addr: string): Promise<number>;
    emptyDeletedMails(owner: string | undefined): Promise<number>;
    restoreDeletedMails(owner: string | undefined): Promise<number>;
}
