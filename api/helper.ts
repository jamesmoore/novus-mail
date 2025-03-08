"use strict";
const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

const helper = {

	randomID: function(){
			
		let resultStr = "";
		for (let i=0; i<10; i++){
				
			resultStr += chars[Math.floor(Math.random() * chars.length)]; 

		}

		return new Date().getTime() + resultStr;

	}

}

export default helper;
