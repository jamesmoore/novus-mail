import express from 'express'
import config from './config.js'
import { join } from 'path'
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Database } from 'better-sqlite3';
import cors from 'cors';
import { Server } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const staticContentPath = './front-react/dist';

interface Mail {
	id: string;
	sender: string;
	subject: string;
	read: boolean;
	received: number;
}

export class HttpServer {
	private db: Database;
	private port: number;
	private domainName: string;

	constructor(db: Database, domainName: string, port: number) {
		this.db = db;
		this.port = port;
		this.domainName = domainName;
	}

	public start(): Server {

		const app = express();

		app.use(express.json());

		app.use((req, res, next) => {
			res.set('Referrer-Policy', 'no-referrer');
			next();
		});

		app.use(express.static(staticContentPath));

		if (process.env.CORS_ALLOW_ALL_ORIGINS == "true") {
			console.info("CORS: Allowing all origins");
			app.use(cors());
		}

		app.get('/', (_req, res) => {

			res.redirect('/index.html');

		})

		// app.use(function(req,res,next){setTimeout(next,1000)});

		const refreshInterval = config.getConfig("MailRefreshInterval");
		app.post('/addresses', (_req, res) => {

			try {

				const rows = this.db.prepare("SELECT addr FROM address").all();
				res.json({ addresses: rows, refreshInterval: refreshInterval });

			} catch (err) {

				console.error("DB get addresses fail")
				console.error(err)
				res.status(500).send('Failed to get addresses');
			}

		})

		app.post('/domain', (req, res) => {

			if (this.domainName) {

				res.status(200).send(this.domainName);

			} else {

				res.status(200).send(req.headers.host?.split(':')[0] || 'unknown');

			}

		});

		app.post('/getAddress', (req, res) => {
			const json = req.body;
			try {
				const address = json.address.toLowerCase();
				const rows = this.db.prepare("SELECT addr FROM address WHERE addr = ?").all(address);
				if (rows.length > 0) {
					res.status(200).send((rows[0] as { addr: string }).addr);
				}
				else {
					res.status(200).send('');
				}
			} catch (err) {
				console.error("DB get addresses fail")
				console.error(err)
				res.status(500).send('Failed to get address');
			}
		})

		app.post('/addAddress', (req, res) => {

			const json = req.body;

			try {

				const address = json.address.toLowerCase();
				const rows = this.db.prepare("SELECT addr FROM address WHERE addr = ?").all(address);
				if (rows.length > 0) {

					res.status(200).send("exist");

				} else {
					this.db.prepare("INSERT INTO address (addr) VALUES (?)").run(address);
					res.status(200).send("done");
				}

			} catch (err) {

				console.error("DB add addresses fail")
				console.error(err)
				res.status(500).json({ error: "Failed to add address" });
			}
		})

		app.post('/deleteAddress', (req, res) => {

			const json = req.body;

			try {

				this.db.prepare("DELETE FROM address WHERE addr = ?").run(json.address);
				this.db.prepare("DELETE FROM mail WHERE recipient = ?").run(json.address);

				res.status(200).send("done");

			} catch (err) {
				console.error("DB delete address fail");
				console.error(err)
				res.status(500).send('Failed to delete address');
			}

		})

		app.post('/mails', (req, res) => {
			// Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1110);

			const json = req.body as {
				cursorId: string,
				addr: string,
				deleted: boolean
			};

			try {
				const perPage = Number(config.getConfig('MailCountPerPage'));

				const directionDursorId = (json.cursorId as string) || 'lt';
				const direction = directionDursorId.substring(0, 2);
				const cursorId = directionDursorId.substring(2);

				const params = {
					recipient: json.addr,
					cursorId: cursorId,
					mailCount: perPage
				};

				const comparisonOperator = direction === 'lt' ? '<' : '>';
				const whereClause =
					(json.deleted ? ` deleted = 1 ` : ' deleted <> 1 ') +
					(cursorId ? ` AND Id ${comparisonOperator} @cursorId` : '') +
					(json.addr ? ` AND recipient = @recipient` : '')

				const sortOrder = direction === 'lt' ? 'DESC' : 'ASC';

				const sql = `
				  SELECT id, sender, subject, read, received 
				  FROM mail 
				  WHERE ${whereClause}
				  ORDER BY id ${sortOrder} 
				  LIMIT @mailCount
				`;

				let rows = this.db.prepare(sql).all(params) as Mail[];

				if (direction === 'gt') {
					rows = rows.sort((a, b) => b.id > a.id ? 1 : -1);
				}

				res.json({
					data: rows,
					nextId: (rows.length === 0 || rows.length < perPage) ? null : 'lt' + rows[rows.length - 1].id,
					previousId: rows.length === 0 ? null : 'gt' + rows[0].id,
				});

			} catch (err) {
				console.error("DB get mails fail");
				console.error(err);
				res.status(500).json({ error: "Failed to get mails" });
			}

		});

		app.post('/mailData', (req, res) => {

			const json = req.body;

			try {

				const rows = this.db.prepare("SELECT recipient, sender, subject, content, read, received FROM mail WHERE id = ?").all(json.id);
				res.json(rows[0])

			} catch (err) {

				console.error("DB get mail data fail")
				console.error(err)
				res.status(500).json({ error: "Failed to delete mails" });
			}

		});

		app.post('/deleteMail', (req, res) => {

			const json = req.body;

			try {

				const mail = this.db.prepare("SELECT deleted FROM mail WHERE id = ?").get(json.id);
				const isDeleted = mail as unknown as { deleted: boolean };

				if (isDeleted.deleted) {
					this.db.prepare("DELETE FROM mail WHERE id = ?").run(json.id);
				}
				else {
					this.db.prepare("UPDATE mail SET deleted = 1 WHERE id = ?").run(json.id);
				}
				res.status(200).send();

			} catch (err) {

				console.error("DB delete mail fail")
				console.error(err)
				res.status(500).json({ error: "Failed to delete mail" });
			}

		})

		app.post('/deleteMails', (req, res) => {
			const json = req.body;
			try {
				this.db.prepare("UPDATE mail SET deleted = 1 WHERE recipient = ? and deleted = 0").run(json.address);
				res.status(200).send();
			} catch (err) {
				console.error("DB delete mails fail")
				console.error(err)
				res.status(500).json({ error: "Failed to delete mails" });
			}
		})

		app.post('/emptyDeletedMails', (req, res) => {
			try {
				this.db.prepare("DELETE FROM mail WHERE deleted = 1").run();
				res.status(200).send();
			} catch (err) {
				console.error("DB empty deleted mails fail")
				console.error(err)
				res.status(500).json({ error: "Failed to empty deleted mails" });
			}
		})

		app.post('/readMail', (req, res) => {

			const json = req.body;

			try {
				this.db.prepare("UPDATE mail SET read = 1 where id = ?").run(json.id);
				res.status(200).send();
			} catch (err) {
				console.error("DB update mail fail")
				console.error(err)
				res.status(500).json({ error: "Failed to update mail as read" });
			}
		})

		app.post('/readAllMail', (req, res) => {

			const json = req.body;
			try {
				this.db.prepare("UPDATE mail SET read = 1 where recipient = ? and read = 0").run(json.address);
				res.status(200).send();
			} catch (err) {
				console.error("DB read all mail fail")
				console.error(err)
				res.status(500).json({ error: "Failed to mark all mails as read" });
			}
		})

		app.post('/unreadCounts', (req, res) => {

			try {
				const unread = this.db.prepare(`
					SELECT recipient, count(*) as unread
					from mail
					where read = 0 and deleted = 0
					group by recipient
					`).all();
				res.json(unread);
			} catch (err) {
				console.error("unread counts select fail");
				console.error(err)
				res.status(500).json({ error: "Failed to get unread counts" });
			}
		})

		app.post('/status', (req, res) => {
			const unread = this.db.prepare('SELECT count(*) as unread from mail where read = 0').get();
			const addresses = this.db.prepare('SELECT count(*) as addresses from address').get();
			res.json({
				unread: (unread as { unread: number }).unread,
				addresses: (addresses as { addresses: number }).addresses,
			});
		});

		// catch-all handler for react router
		app.get('*', (_req, res) => {
			res.sendFile(join(__dirname, staticContentPath, 'index.html'), (err) => {
				if (err) {
					res.status(500).send(err)
				}
			});
		})

		const server = app.listen(this.port, () => {
			console.log('http server listening at port: ' + this.port);
		})

		return server;
	}

}
