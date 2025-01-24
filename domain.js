"use strict";
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

let mod = {

	getDomainName: function(){

		let cert = "";

		try {

			const files = fs.readdirSync("./data");
			for(let fileName of files){

				let ext = path.extname(fileName);
				if(ext != ".db" && ext != ".json"){

					let content = fs.readFileSync("./data/" + fileName, 'utf8');

					if(content.includes("BEGIN CERTIFICATE")){
						cert = content;
					}

				}

			}

		} catch (err) {

			console.log("read directory fail");
			console.log(err);

		}

		if(cert){

			let extract = new crypto.X509Certificate(cert).subject;
			let res = extract.match(/CN=(?:\*\.)?([^\s\/]+)/);
			return res[1] || "";

		}else{

			return "";

		}

	}

}

export default mod;
