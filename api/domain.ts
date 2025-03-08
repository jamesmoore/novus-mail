"use strict";
import { readdirSync, readFileSync } from 'fs'
import { extname } from 'path'
import { X509Certificate } from 'crypto'

const mod = {

	getDomainName: function () {

		let cert = "";

		try {

			const files = readdirSync("./data");
			for (const fileName of files) {

				const ext = extname(fileName);
				if (ext != ".db" && ext != ".json") {

					const content = readFileSync("./data/" + fileName, 'utf8');

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

			const extract = new X509Certificate(cert).subject;
			const res = extract.match(/CN=(?:\*\.)?([^\s/]+)/);
			return res ? res[1] || "" : "";

		} else {

			return "";

		}

	}

}

export default mod;
