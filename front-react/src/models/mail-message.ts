export interface MailMessage {
    sender: string;
    subject: string;
    content: string;
    read: boolean;
    received: number;
}