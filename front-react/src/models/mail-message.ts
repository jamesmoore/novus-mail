export interface MailMessage {
    sender: string;
    recipient: string;
    subject: string;
    content: string;
    read: boolean;
    received: number;
}