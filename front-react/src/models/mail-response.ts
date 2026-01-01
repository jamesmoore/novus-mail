import { Mail } from "./mail";

export interface MailResponse {
    mails: Mail[],
    previousId?: string,
    nextId?: string
}