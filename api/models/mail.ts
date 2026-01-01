export interface Mail {
    id: string;
    sender: string;
    sendername?: string;
    recipient: string;
    subject: string;
    read: boolean;
    received: Date;
    deleted: boolean;
    content: string;
}