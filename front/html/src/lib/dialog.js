let dialogConfString = `
<div style="width: 100%; height: 100%; position: absolute; display: flex; justify-content: center; align-items: center;">

	<div id="dialogBox" style="width: min(300px, calc(100% - 40px)); box-sizing: border-box; padding: 10px; min-height: 50px; display: flex; flex-direction: column; align-items: center; gap: 10px">

		<span id="dialogBoxText"></span>

		<div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px">
			<button id="dialogBoxYesButton" onclick="dialogConfirmYesClicked()" style="width: 100px" tabindex="0">Yes</button>
			<button onclick="dialogConfirmNoClicked()" style="width: 100px" tabindex="0">No</button>
		</div>

	</div>

</div>
`

let dialogAlertString = `
<div style="width: 100%; height: 100%; position: absolute; display: flex; justify-content: center; align-items: center;">

	<div id="dialogBox" style="width: min(300px, calc(100% - 40px)); box-sizing: border-box; padding: 10px; min-height: 50px; display: flex; flex-direction: column; align-items: center; gap: 10px">

		<span id="dialogBoxText"></span>

		<div>
			<button id="dialogBoxOkButton" onclick="dialogAlertOkClicked()" style="width: 100px" tabindex="0">OK</button>
		</div>

	</div>

</div>
`

let callbackFunc;
function dialogConfirmYesClicked(){
	
	callbackFunc(true)
	document.getElementById("dialogRoot").remove();

}

function dialogConfirmNoClicked(){
	
	callbackFunc(false)
	document.getElementById("dialogRoot").remove();

}

function dialogAlertOkClicked(){
	
	document.getElementById("dialogRoot").remove();

}

function conf(text, callback){
	
	callbackFunc = callback;
	let div = document.createElement("div");
	div.id = "dialogRoot";
	div.style.width = "100%";
	div.style.height = "100%";
	div.style.position = "absolute";
	div.style.top = "0";
	div.style.left = "0";
	div.innerHTML = dialogConfString;

	document.getElementsByTagName("body")[0].appendChild(div);
	document.getElementById("dialogBoxText").innerHTML = text;
	document.getElementById("dialogBoxYesButton").focus();
	

}

function alrt(text, callback){
	
	callbackFunc = callback;
	let div = document.createElement("div");
	div.id = "dialogRoot";
	div.style.width = "100%";
	div.style.height = "100%";
	div.style.position = "absolute";
	div.style.top = "0";
	div.style.left = "0";
	div.innerHTML = dialogAlertString;

	document.getElementsByTagName("body")[0].appendChild(div);
	document.getElementById("dialogBoxText").innerHTML = text;
	document.getElementById("dialogBoxOkButton").focus();

}

function init(){

	window.dialogConfirmNoClicked = dialogConfirmNoClicked;
	window.dialogConfirmYesClicked = dialogConfirmYesClicked;
	window.dialogAlertOkClicked = dialogAlertOkClicked;
}

export default {conf, alrt, init}
