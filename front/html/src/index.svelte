<script>

	import { onMount } from 'svelte';
	import f from './helper.js'
	import dialog from './lib/dialog.js'
	dialog.init();

	let domainName = "";
	let addresses = [];
	let selectedAddress = null;

	let mails = [];
	let page = 1;
	let viewType = "mails";

	let mailDataSender;
	let mailDataSubject;

	function refreshMails(){

		f.fetchPost('/mails', {addr: selectedAddress, page: page}, (data) => {

			mails = data;

		});

	}

	function selectedAddressChange(){
		
		page = 1;
		refreshMails();

	}

	function copyClicked(){
		
		f.copyToClipboard(selectedAddress + domainName);

	}

	function waitForElement(selector) {

		return new Promise((resolve) => {
			
			const observer = new MutationObserver((mutationsList, observer) => {

				for (let mutation of mutationsList) {
					
					if (mutation.type === 'childList' && document.querySelector(selector)) {

						observer.disconnect();
						resolve(document.querySelector(selector));
						return;

					}

				}

			});

			observer.observe(document.body, { childList: true, subtree: true });

		});

	}

	function mailClicked(event){

		if((event.type == 'keypress' && event.key == 'Enter') || (event.type == 'click' && event.button == 0)){

			let closest = event.target.closest(".clickable");
			f.fetchPost('/mailData', {id: closest.dataset.id}, (data) => {

				mailDataSender = data.sender;
				mailDataSubject = data.subject;

				viewType = 'mailData';

				waitForElement("#mailData").then((element)=>{

					const shadowRoot = element.attachShadow({ mode: 'open' });
					shadowRoot.innerHTML = data.content;

				})

			});
			
		}

	}

	function deleteClicked(event){
		
		if((event.type == 'keydown' && event.key == 'Enter') || (event.type == 'click' && event.button == 0)){

			dialog.conf("delete?", (res) => {
				
				if(res){

					f.fetchPost('/deleteMail', {id: event.target.dataset.id}, () => {

						refreshMails();
				
					});

				}

			})

		}

		event.stopPropagation();

	}

	function backClicked(){
		
		//cleanup
		mailDataSender = null;
		mailDataSubject = null;
		viewType = "mails"

	}

	function nextPage(){

		if(mails.length > 0){
			page += 1;
			refreshMails();
		}
	}

	function prevPage(){
		
		if(page > 1){

			page -= 1;
			refreshMails();
	
		}

	}

	onMount(() => {

		f.fetchPost('/addresses', {}, (data) => {

			addresses = data.addresses;
			if (data.addresses.length > 0){

				selectedAddress = data.addresses[data.addresses.length-1].addr;
				refreshMails();

				setInterval(() => {
					
					refreshMails();
				
				}, data.refreshInterval*1000);

			}

		});

		f.fetchPost('/domain', {}, (data) => {

			domainName = '@' + data;

		})

	});

</script>

<main>
	
	<div class="adaptWidth flexCenterCol fillHeight gap">

		<!--Put a div so that there will be a gap from the flex at the top of the page-->
		<div></div>
		
		<div class="adaptWidthSmall" style="display: flex; align-items: center; flex-wrap: wrap">

			<select bind:value={selectedAddress} on:change={selectedAddressChange} style="flex: 1">

					{#each addresses as address}

						<option value={address.addr}>{address.addr}</option>

					{/each}

			</select>

			<span>{domainName}</span>

			<button on:keypress={copyClicked} on:click={copyClicked} style="margin-left: 10px; padding-top: 0px; padding-bottom: 0px">Copy</button>

		</div>

		<div id="mailList" class="fillWidth">
			
			{#if viewType == 'mails'}

				{#each mails as mail}

					<div data-id={mail.id} on:keypress={mailClicked} on:click={mailClicked} role="button" tabindex="0" class="clickable" style="display: flex; align-items: center; justify-content: space-between">

						<div> 

							<span>{mail.sender}</span>
							<div></div>
							<span>{mail.subject}</span>

						</div>

						<input data-id={mail.id} on:keypress={deleteClicked} on:click={deleteClicked} type="image" src="trashIcon.svg" alt="X" style="width: 2rem; height: 2rem; padding: 1rem">

					</div>
					
					<!--hr size inside flex is 0, gotta wrap with div, not sure why-->
					<div>
						<hr>
					</div>

				{/each}

			{/if}

			{#if viewType == 'mailData'}

				<span>{mailDataSender}</span>
				<div></div>
				<span>{mailDataSubject}</span>

				<!--hr size inside flex is 0, gotta wrap with div, not sure why-->
				<div>
					<hr>
				</div>

				<div id="mailData" style="all: initial; background-color: white; overflow: auto; flex: 1">
				</div>

				<div style="height: 10px;"></div>
				<button on:click={backClicked}>Back</button>

			{/if}

		</div>

		<div>
			<button class="counter" on:click={prevPage}>❮</button>
			<span>{page}</span>
			<button class="counter" on:click={nextPage}>❯</button>
		</div>

		<button on:click={()=>{window.location.replace('/manage.html')}} class="adaptWidthSmall">Manage addresses</button>

		<!--Put a div so that there will be a gap from the flex at the top of the page-->
		<div></div>

	</div>
	
</main>
