"use strict"
import Database from 'better-sqlite3';

const database = {

	init: function () {

		try {

			const db = Database('./data/data.db');
			db.exec("CREATE TABLE IF NOT EXISTS address (addr TEXT NOT NULL)");
			const res = db.prepare("SELECT COUNT(*) as count FROM address").get();

			if ((res as any).count == 0) {

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

			return db;

		} catch (err) {

			console.log("DB init fail")
			console.log(err);
			process.exit();

		}

	}

}

export default database;
