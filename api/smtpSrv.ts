import { SMTPServerOptions, SMTPServer as ssrv } from 'smtp-server'
import { AddressObject, simpleParser } from 'mailparser'
import { readFileSync, readdirSync } from 'fs';
import { extname } from 'path';
import EventEmitter from 'events';
import { DatabaseFacade } from './databaseFacade.js';
import { Mail } from './models/mail.js';
import { ulid } from 'ulid';

export class SMTPServer {
	private port: number;
	private notifier: EventEmitter;
	private databaseFacade: DatabaseFacade;

	constructor(databaseFacade: DatabaseFacade, port: number, notifier: EventEmitter) {
		this.port = port;
		this.notifier = notifier;
		this.databaseFacade = databaseFacade;
	}

	public start(): void {
		const databaseFacade = this.databaseFacade;
		const notifier = this.notifier;
		const opt: SMTPServerOptions = {

			async onData(stream, _session, callback) {

				try {

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
							const res = databaseFacade.getAddress(recipientName);

							if (res) {
								const id = ulid();
								const dateTime = mail.date?.getTime() ?? 0;

								const newMail: Mail = {
									deleted: 0,
									id: id,
									read: 0,
									received: dateTime,
									recipient: recipientName,
									sender: sender,
									subject: subject,
									sendername: senderName,
									content: content
								}

								databaseFacade.addMail(newMail);
								notifier.emit('received', recipientName);
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

				} catch (err) {

					console.log("Processing email error");
					console.log(err);

				}

				callback(null);


			},

			authOptional: true,

			onConnect(_session, callback) {

				return callback();

			},

		}

		try {

			//automatically detect public / private key
			const files = readdirSync("./data");
			for (const fileName of files) {

				const ext = extname(fileName);
				if (ext != ".db" && ext != ".json") {

					const content = readFileSync("./data/" + fileName, 'utf8');
					if (content.includes("PRIVATE KEY")) {
						opt.key = content;
					}

					if (content.includes("BEGIN CERTIFICATE")) {
						opt.cert = content;
					}

				}

			}

		} catch (err) {

			console.log("read directory fail");
			console.log(err);

		}

		const server = new ssrv(opt);
		server.on('error', (err) => {

			console.log("SMTP server error");
			console.log(err);

		});

		server.listen(this.port, () => {

			console.log('smtp server running at port: ' + this.port);

		});

	}

}

