export interface Mail {
    id: string;
    sender: string;
    sendername?: string;
    recipient: string;
    subject: string;
    read: boolean;
    received: number;
    deleted: boolean;
    content?: string;
}