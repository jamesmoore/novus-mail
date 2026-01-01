export interface MailMessageDto {
    sender: string;
    sendername: string;
    recipient: string;
    subject: string;
    content: string;
    read: boolean;
    received: string;
}