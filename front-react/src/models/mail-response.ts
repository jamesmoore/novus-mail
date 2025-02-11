import { Mail } from "./mail";

export interface MailResponse {
    data: Mail[],
    previousId?: string,
    nextId?: string
}