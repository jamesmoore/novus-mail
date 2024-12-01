"use strict";
import fs from 'fs'

let mod = {

	configs: {},

	getConfig: function(key){

		return this.configs[key];

	},

	init: function(){

		try {

            const data = fs.readFileSync('./data/config.json', 'utf8');
            this.configs = JSON.parse(data);

        } catch (err) {

            console.log('Error reading data.json');
            console.log(err);
            process.exit();

        }

	}

}

export default mod;
