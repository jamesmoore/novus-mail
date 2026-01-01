import { MailDto } from "./mail-dto";

export interface MailResponseDto {
    mails: MailDto[],
    previousId?: string,
    nextId?: string
}