import { simpleParser, AddressObject, ParsedMail } from 'mailparser';
import { NotificationEmitter } from '../events/notification-emitter.js';
import { SMTPServerAddress, SMTPServerDataStream, SMTPServerSession } from 'smtp-server';
import { ulid } from 'ulid';
import { DatabaseFacade } from '../db/database-facade.js';
import { Mail } from '../models/mail.js';
import { Address } from '../models/address.js';


export class MailHandler {
	private notifier: NotificationEmitter;
	private databaseFacade: DatabaseFacade;

	constructor(databaseFacade: DatabaseFacade, notifier: NotificationEmitter) {
		this.notifier = notifier;
		this.databaseFacade = databaseFacade;
	}

	public async handleIncomingMail(stream: SMTPServerDataStream, session: SMTPServerSession): Promise<void> {
		const mail = await simpleParser(stream);

		const senderAddress = mail.from?.value?.at(0);
		const senderName = senderAddress?.name;

		const sender = senderAddress?.address ?? senderAddress?.name ?? 'unknown sender';
		
		if (session.secure === false) {
			console.warn(`WARN: Insecure session from ${senderName}/${sender}`)
		}
		
		const allRecipientAddresses = getUniqueRecipientAddresses(mail.to, session.envelope.rcptTo);

		if (allRecipientAddresses.length === 0) {
			console.log(`No recipients present in mail from ${sender}`);
			return;
		}
		
		const combinedRecipientAddresses = [...new Set(allRecipientAddresses.map(a => normalizeEmailUsername(a)))];

		let found = false;
		for (const recipient of combinedRecipientAddresses) {
			const matchedRecipient = await this.databaseFacade.getAddress(recipient);
			if (matchedRecipient) {
				found = true;
				const newMail = createMail(mail, matchedRecipient, sender, senderName);
				await this.databaseFacade.addMail(newMail);
				this.notifier.emit('received', matchedRecipient.addr);
			}
		}

		if (!found) {
			console.log(`No matching recipient found for mail from ${sender} to ${allRecipientAddresses.join(", ")}`);
		}
	}
}

function getUniqueRecipientAddresses(to: AddressObject | AddressObject[] | undefined, rcptTo : SMTPServerAddress[]) {
	const mailToAddresses = (Array.isArray(to) ? to : [to])
		.flatMap(addressObj => addressObj?.value?.filter(p => p.address).map(p => p.address!) ?? []);
	const smtpRcptAddresses = rcptTo.map(p => p.address);
	return [...new Set(mailToAddresses.concat(smtpRcptAddresses))];
}

function createMail(mail: ParsedMail, recipientAddress: Address, sender: string, senderName: string | undefined) {
	const id = ulid();
	const dateTime = mail.date?.getTime() ?? 0;
	const content = mail.html ? mail.html : mail.textAsHtml;
	const subject = mail.subject ?? 'No Subject';

	const newMail: Mail = {
		deleted: false,
		id: id,
		read: false,
		received: new Date(dateTime),
		recipient: recipientAddress.addr,
		sender: sender,
		subject: subject,
		sendername: senderName,
		content: content ?? ''
	};
	return newMail;
}

function normalizeEmailUsername(email: string): string {
	const atIndex = email.lastIndexOf("@");
	return atIndex !== -1 ? email.substring(0, atIndex).toLowerCase() : email.toLowerCase();
}

