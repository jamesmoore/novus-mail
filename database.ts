"use strict"
import Database from 'better-sqlite3';

const database = {

	init: function () {

		try {

			const db = Database('./data/data.db');
			db.exec("CREATE TABLE IF NOT EXISTS address (addr TEXT NOT NULL)");
			const res = db.prepare("SELECT COUNT(*) as count FROM address").get();

			if ((res as { count: number }).count == 0) {

				//generate random username
				const letters = 'abcdefghijklmnopqrstuvwxyz';
				let uname = '';
				for (let i = 0; i < 3; i++) {
					const randomIndex = Math.floor(Math.random() * letters.length);
					uname += letters[randomIndex];
				}
				uname += Math.floor(Math.random() * 10).toString();
				uname += Math.floor(Math.random() * 10).toString();

				db.prepare("INSERT INTO address (addr) VALUES (?)").run(uname);

			}

			db.exec("CREATE TABLE IF NOT EXISTS mail (id TEXT NOT NULL, recipient TEXT NOT NULL, sender TEXT NOT NULL, subject TEXT NOT NULL, content TEXT NOT NULL)");


			try {
				db.exec("ALTER TABLE mail ADD COLUMN read INTEGER default 0");
			} catch {
				console.log("read column already exists");
			}

			try {
				db.exec("ALTER TABLE mail ADD COLUMN received INTEGER default 0");
			} catch {
				console.log("received column already exists");
			}
			
			try {
				db.exec("ALTER TABLE mail ADD COLUMN deleted INTEGER default 0");
			} catch {
				console.log("received column already exists");
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
