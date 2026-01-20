import { simpleParser, AddressObject } from 'mailparser';
import EventEmitter from 'events';
import { SMTPServerDataStream, SMTPServerSession } from 'smtp-server';
import { ulid } from 'ulid';
import { DatabaseFacade } from './database-facade.js';
import { Mail } from './models/mail.js';


export class MailHandler {
	private notifier: EventEmitter;
	private databaseFacade: DatabaseFacade;

	constructor(databaseFacade: DatabaseFacade, notifier: EventEmitter) {
		this.notifier = notifier;
		this.databaseFacade = databaseFacade;
	}

	public async handleIncomingMail(stream: SMTPServerDataStream, _session: SMTPServerSession): Promise<boolean> {
		const mail = await simpleParser(stream);

		const senderAddress = mail.from?.value?.at(0);

		const senderName = senderAddress?.name;

		const sender = senderAddress?.address ?? senderAddress?.name ?? 'unknown sender';
		const subject = mail.subject ?? 'No Subject';
		const content = mail.html ? mail.html : mail.textAsHtml;

		try {

			const mailToAddresses = (mail.to as AddressObject)?.value?.filter(p => p.address).map(p => p.address!) ?? [];
			const smtpRcptAddresses = _session.envelope.rcptTo.map(p => p.address);

			for (const recipient of mailToAddresses.concat(smtpRcptAddresses).map(p => p.toLowerCase())) {

				const recipientName = recipient.substring(0, recipient.lastIndexOf("@"));
				const res = await this.databaseFacade.getAddress(recipientName);

				if (res) {
					const id = ulid();
					const dateTime = mail.date?.getTime() ?? 0;

					const newMail: Mail = {
						deleted: false,
						id: id,
						read: false,
						received: new Date(dateTime),
						recipient: recipientName,
						sender: sender,
						subject: subject,
						sendername: senderName,
						content: content ?? ''
					};

					await this.databaseFacade.addMail(newMail);
					this.notifier.emit('received', recipientName);
					break;
				}
				else {
					console.log("No address matched for: " + recipient);
				}
			}

		} catch (err) {
			console.log("Inbound email error");
			console.log(err);
		}

		return true;
	}
}
