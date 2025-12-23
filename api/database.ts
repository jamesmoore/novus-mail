"use strict"
import Database from 'better-sqlite3';

const database = {

	init: function () {

		try {

			const db = Database('./data/data.db');
			db.exec("CREATE TABLE IF NOT EXISTS address (addr TEXT NOT NULL)");
			const res = db.prepare("SELECT COUNT(*) as count FROM address").get();

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

		} catch (err) {

			console.log("DB init fail")
			console.log(err);
			process.exit();

		}

	}

}

export default database;
