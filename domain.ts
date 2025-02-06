"use strict";
import { readdirSync, readFileSync } from 'fs'
import { extname } from 'path'
import { X509Certificate } from 'crypto'

let mod = {

	getDomainName: function () {

		let cert = "";

		try {

			const files = readdirSync("./data");
			for (let fileName of files) {

				let ext = extname(fileName);
				if (ext != ".db" && ext != ".json") {

					let content = readFileSync("./data/" + fileName, 'utf8');

					if (content.includes("BEGIN CERTIFICATE")) {
						cert = content;
					}

				}

			}

		} catch (err) {

			console.log("read directory fail");
			console.log(err);

		}

		if (cert) {

			let extract = new X509Certificate(cert).subject;
			let res = extract.match(/CN=(?:\*\.)?([^\s\/]+)/);
			return res ? res[1] || "" : "";

		} else {

			return "";

		}

	}

}

export default mod;
