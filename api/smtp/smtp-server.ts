import { SMTPServerOptions, SMTPServer as ssrv } from 'smtp-server'
import { readFileSync, readdirSync } from 'fs';
import { extname } from 'path';
import { MailHandler } from './mail-handler.js';

export class SMTPServer {
	private mailHandler: MailHandler;
	private port: number;

	constructor(mailHandler: MailHandler, port: number) {
		this.mailHandler = mailHandler;
		this.port = port;
	}

	public start(): void {
		const mailHandler = this.mailHandler;
		const opt: SMTPServerOptions = {
			async onData(stream, _session, callback) {
				try {
					await mailHandler.handleIncomingMail(stream, _session);
					callback(null);
				} catch (err) {
					console.log("Processing email error", err);
					const error = new Error("Temporary failure.") as Error & { responseCode?: number };
					error.responseCode = 451;
					callback(error);
				}
			},
			authOptional: true,
			onConnect(_session, callback) {
				return callback();
			},
		};
		
		try {
			//automatically detect public / private key
			const files = readdirSync("./data");
			for (const fileName of files) {

				const ext = extname(fileName);
				if (ext != ".db" && ext != ".json") {
					const fileWithPath = "./data/" + fileName;
					const content = readFileSync(fileWithPath, 'utf8');
					if (content.includes("PRIVATE KEY")) {
						console.log("Using key: ", fileWithPath);
						opt.key = content;
					}

					if (content.includes("BEGIN CERTIFICATE")) {
						console.log("Using cert: ", fileWithPath);
						opt.cert = content;
					}
				}
			}

		} catch (err) {
			console.log("read directory fail", err);
		}

		const server = new ssrv(opt);
		server.on('error', (err) => {
			console.log("SMTP server error", err);
		});

		server.listen(this.port, () => {
			console.log('smtp server running at port: ', this.port);
		});
	}
}


