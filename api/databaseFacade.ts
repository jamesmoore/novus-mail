import { Address } from "./models/address.js";
import { Mail } from "./models/mail.js";

export interface DatabaseFacade {
    // Address
    addAddress(address: string): void;
    getAddresses(sub: string | undefined): Address[];
    getAddress(address: string): Address;
    updateAddressOwner(owner: string | null | undefined, address: string): void;
    deleteAddress(address: string): void;
    getAddressCount(): { addresses: number; };

    // Mails
    addMail(mail: Mail): void;
    getMail(id: string): Mail;
    getMails(
        addr: string,
        deleted: boolean,
        cursorId: string,
        perPage: number,
        owner: string | undefined,
        direction: string
    ): Mail[];

    // Unread
    getUnread(owner: string | undefined): Array<{ recipient: string; unread: number; }>;
    markMailAsRead(mailId: string): number;
    markAllAsRead(addr: string): number;
    getUnreadMailsCount(): { unread: number; };

    // Deletions
    softDeleteMail(id: string): number;
    deleteMail(id: string): number;
    deleteMailsForAddress(addr: string): number;
    emptyDeletedMails(owner: string | undefined): number;
    restoreDeletedMails(owner: string | undefined): number;
}
