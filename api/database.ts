import Database from 'better-sqlite3';
import type { Database as BetterSqlite3Database } from 'better-sqlite3';
import fs from 'fs';
import { Address } from './models/address.js';
import { Mail } from './models/mail.js';
import { ulid } from 'ulid';
const v1DatabaseFileName = './data/data.db';
const v2DatabaseFileName = './data/data2.db';

export default function dbinit() {
	try {

		const db1 = fs.existsSync(v1DatabaseFileName) ? getV1Database() : undefined;

		const db2 = getV2Database();

		if (db1 && db2) {
			console.log("Migrating schema v1 to v2");
			const migrate = db2.transaction(() => {
				migrateV1toV2(db1, db2);
			});

			migrate();

			db1.close();
			fs.renameSync(v1DatabaseFileName, v1DatabaseFileName + ".bak");
			console.log("Migrating schema v1 to v2 Completed");
		}

		return db2;
	}
	catch (err) {
		console.error("DB init fail")
		console.error(err);
		process.exit();
	}
}

function getV1Database() {
	const db = Database(v1DatabaseFileName);
	db.exec("CREATE TABLE IF NOT EXISTS address (addr TEXT NOT NULL)");

	db.exec("CREATE TABLE IF NOT EXISTS mail (id TEXT NOT NULL, recipient TEXT NOT NULL, sender TEXT NOT NULL, subject TEXT NOT NULL, content TEXT NOT NULL)");

	try {
		db.exec("ALTER TABLE mail ADD COLUMN read INTEGER default 0");
	} catch {
		console.log("mail.read column already exists");
	}

	try {
		db.exec("ALTER TABLE mail ADD COLUMN received INTEGER default 0");
	} catch {
		console.log("mail.received column already exists");
	}

	try {
		db.exec("ALTER TABLE mail ADD COLUMN deleted INTEGER default 0");
	} catch {
		console.log("mail.deleted column already exists");
	}

	try {
		db.exec("ALTER TABLE address ADD COLUMN owner TEXT");
	} catch {
		console.log("address.owner column already exists");
	}

	try {
		db.exec("ALTER TABLE mail ADD COLUMN sendername TEXT");
	} catch {
		console.log("mail.sendername column already exists");
	}

	return db;
}

function getV2Database() {
	const db = Database(v2DatabaseFileName);
	db.exec("PRAGMA foreign_keys = ON");

	db.exec(`CREATE TABLE IF NOT EXISTS address (
		addr TEXT NOT NULL PRIMARY KEY,
		owner TEXT
		)`);

	db.exec(`CREATE TABLE IF NOT EXISTS mail (
		id TEXT NOT NULL PRIMARY KEY,
		recipient TEXT NOT NULL,
		sender TEXT NOT NULL,
		subject TEXT NOT NULL,
		content TEXT NOT NULL,
		read INTEGER NOT NULL default 0,
		received INTEGER NOT NULL default 0,
		deleted INTEGER NOT NULL default 0,
		sendername TEXT,
		FOREIGN KEY(recipient) REFERENCES address(addr)
		)`);

	db.exec(`CREATE TABLE IF NOT EXISTS meta (
  		key TEXT PRIMARY KEY,
  		value TEXT NOT NULL
		)`);

	db.prepare("INSERT OR IGNORE INTO meta (key,value) VALUES (?,?)").run('schemaVersion', '2');
	return db;
}

function migrateV1toV2(db1: BetterSqlite3Database, db2: BetterSqlite3Database) {
	const insertAddress = db2.prepare(
		"INSERT OR IGNORE INTO address (addr, owner) VALUES (?, ?)"
	);
	const insertMail = db2.prepare(
		"INSERT OR IGNORE INTO mail (id, recipient, sender, subject, content, read, received, deleted, sendername) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
	);

	for (const row of db1.prepare("SELECT addr, owner FROM address").iterate()) {
		const address = row as Address;
		insertAddress.run(address.addr, address.owner ?? null);
	}

	for (const row of db1.prepare("SELECT id, recipient, sender, subject, content, read, received, deleted, sendername FROM mail").iterate()) {
		const mail = row as Mail;

		const idPrefix = mail.id.slice(0, 13);
		let timeSeed: number | undefined;
		if (idPrefix.length === 13) {
			let isNumeric = true;
			for (let i = 0; i < 13; i++) {
				const code = idPrefix.charCodeAt(i);
				if (code < 48 || code > 57) {
					isNumeric = false;
					break;
				}
			}
			if (isNumeric) {
				timeSeed = Number(idPrefix);
			}
		}

		insertMail.run(
			timeSeed === undefined ? ulid() : ulid(timeSeed),
			mail.recipient,
			mail.sender,
			mail.subject,
			mail.content,
			mail.read,
			mail.received,
			mail.deleted,
			mail.sendername ?? null
		);
	}

}
