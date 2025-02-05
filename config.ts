"use strict";
import { readFileSync } from 'fs';

let mod = {

	configs: {},

	getConfig: function(key: string){

		return (this.configs as any)[key] as string;

	},

	init: function(){

		try {

            const data = readFileSync('./data/config.json', 'utf8');
            this.configs = JSON.parse(data);

        } catch (err) {

            console.log('Error reading data.json');
            console.log(err);
            process.exit();

        }

	}

}

export default mod;
