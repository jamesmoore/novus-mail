import { simpleParser, AddressObject, ParsedMail } from 'mailparser';
import EventEmitter from 'events';
import { SMTPServerDataStream, SMTPServerSession } from 'smtp-server';
import { ulid } from 'ulid';
import { DatabaseFacade } from '../db/database-facade.js';
import { Mail } from '../models/mail.js';
import { Address } from '../models/address.js';


export class MailHandler {
	private notifier: EventEmitter;
	private databaseFacade: DatabaseFacade;

	constructor(databaseFacade: DatabaseFacade, notifier: EventEmitter) {
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
		
		const mailToAddresses = (mail.to as AddressObject)?.value?.filter(p => p.address).map(p => p.address!) ?? [];
		const smtpRcptAddresses = session.envelope.rcptTo.map(p => p.address);
		const allAddresses = mailToAddresses.concat(smtpRcptAddresses);

		if (allAddresses.length === 0) {
			console.log(`No recipients found for mail from ${sender}`);
			return;
		}
		
		const combinedRecipientAddresses = [...new Set(allAddresses.map(a => normalizeEmailUsername(a)))];
		

		let found = false;
		for (const recipient of combinedRecipientAddresses) {
			const matchedRecipient = await this.databaseFacade.getAddress(recipient);
			if (matchedRecipient) {
				found = true;
				const newMail: Mail = createMail(mail, matchedRecipient, sender, senderName);
				await this.databaseFacade.addMail(newMail);
				this.notifier.emit('received', matchedRecipient.addr);
			}
		}

		if (!found) {
			console.log(`No matching recipient found for mail from ${sender} to ${allAddresses.join(", ")}`);
		}
	}
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

function normalizeEmailUsername(p: string): string {
	const atIndex = p.lastIndexOf("@");
	return atIndex !== -1 ? p.substring(0, atIndex).toLowerCase() : p.toLowerCase();
}

