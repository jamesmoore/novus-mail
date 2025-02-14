"use strict";
import express from 'express'
import config from './config.js'
import { join } from 'path'
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Database } from 'better-sqlite3';
import cors from 'cors';

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


const mod = {

	start: function (db: Database, domainName: string, port: number) {

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

				const rows = db.prepare("SELECT addr FROM address").all();
				res.json({ addresses: rows, refreshInterval: refreshInterval });

			} catch (err) {

				console.log("DB get addresses fail")
				console.log(err)

			}

		})

		app.post('/domain', (req, res) => {

			if (domainName) {

				res.status(200).send(domainName);

			} else {

				res.status(200).send(req.headers.host?.split(':')[0] || 'unknown');

			}

		});

		app.post('/addAddress', (req, res) => {

			const json = req.body;

			try {

				const rows = db.prepare("SELECT addr FROM address WHERE addr = ?").all(json.address);
				if (rows.length > 0) {

					res.status(200).send("exist");

				}

				db.prepare("INSERT INTO address (addr) VALUES (?)").run(json.address);
				res.status(200).send("done");

			} catch (err) {

				console.log("DB add addresses fail")
				console.log(err)
			}

		})

		app.post('/deleteAddress', (req, res) => {

			const json = req.body;

			try {

				db.prepare("DELETE FROM address WHERE addr = ?").run(json.address);
				db.prepare("DELETE FROM mail WHERE recipient = ?").run(json.address);

				res.status(200).send("done");

			} catch (err) {

				console.log("DB delete address fail")
				console.log(err)
			}

		})

		app.post('/mails', (req, res) => {

			const json = req.body;

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
				const whereClause = cursorId ? `AND Id ${comparisonOperator} @cursorId` : '';
				const sortOrder = direction === 'lt' ? 'DESC' : 'ASC';

				const sql = `
				  SELECT id, sender, subject, read, received 
				  FROM mail 
				  WHERE recipient = @recipient ${whereClause}
				  ORDER BY id ${sortOrder} 
				  LIMIT @mailCount
				`;

				var rows = db.prepare(sql).all(params) as Mail[];

				if (direction === 'gt') {
					rows = rows.sort((a, b) => b.id > a.id ? 1 : -1);
				}

				res.json({
					data: rows,
					nextId: (rows.length === 0 || rows.length < perPage) ? null : 'lt' + rows[rows.length - 1].id,
					previousId: rows.length === 0 ? null : 'gt' + rows[0].id,
				});

			} catch (err) {

				console.log("DB get mails fail")
				console.log(err)

			}

		});

		app.post('/mailData', (req, res) => {

			const json = req.body;

			try {

				const rows = db.prepare("SELECT sender, subject, content, read, received FROM mail WHERE id = ?").all(json.id);
				res.json(rows[0])

			} catch (err) {

				console.log("DB get mail data fail")
				console.log(err)

			}

		});

		app.post('/deleteMail', (req, res) => {

			const json = req.body;

			try {

				db.prepare("DELETE FROM mail WHERE id = ?").run(json.id);
				res.status(200).send();

			} catch (err) {

				console.log("DB delete mail fail")
				console.log(err)

			}

		})

		app.post('/readMail', (req, res) => {

			const json = req.body;

			try {
				db.prepare("UPDATE mail SET read = 1 where id = ?").run(json.id);
				res.status(200).send();
			} catch (err) {
				console.error("DB update mail fail")
				console.error(err)
			}
		})

		// catch-all handler for react router
		app.get('*', (_req, res) => {
			res.sendFile(join(__dirname, staticContentPath, 'index.html'), (err) => {
				if (err) {
					res.status(500).send(err)
				}
			});
		})

		app.listen(port, () => {
			console.log('http server listening at port: ' + port);
		})

	}

}


export default mod;
