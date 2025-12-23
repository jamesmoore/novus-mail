export interface Mail {
    id: string;
    sender: string;
    sendername?: string;
    recipient: string;
    subject: string;
    read: number;
    received: number;
    deleted: number;
    content?: string;
}