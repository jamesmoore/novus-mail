export interface MailMessage {
    sender: string;
    sendername: string;
    recipient: string;
    subject: string;
    content: string;
    read: boolean;
    received: number;
}