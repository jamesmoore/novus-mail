<script>

	import { onMount } from 'svelte';
	import f from './helper.js'
	import dialog from './lib/dialog.js'
	dialog.init();

	let hostName = '@' + window.location.host;
	let addresses = [];

	let selectedAddress = null;
	let newAddressText = "";

	function refreshAddress(){

		f.fetchPost('/addresses', {}, (data) => {

			addresses = data.addresses;
			if (data.addresses.length > 0){

				selectedAddress = data.addresses[data.addresses.length-1].addr;

			}

		});

	}

	function refreshHostName() {
		f.fetchPost('/domain', {}, (data) => {
			hostName = '@' + data;
		});
	}

	function addAddress(){

		const regex = /^(?!\.)(?!.*\.\.)(?!.*\.$)[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]{1,64}$/;
		if(regex.test(newAddressText)){

			f.fetchPost('/addAddress', {address: newAddressText}, (data) => {

				if(data == "exist"){

					dialog.alrt("address already exist");

				}

				if(data == "done"){

					newAddressText = "";
					refreshAddress();

				}

			});

		}else{

			dialog.alrt("Invalid email address");

		}

	}

	function deleteAddress(){

		dialog.conf("Delete this address ?", (res) => {

			if(res){

				f.fetchPost('./deleteAddress', {address: selectedAddress}, (data) => {

					if(data == "done"){

						refreshAddress();

					}

				});

			}

		})

	}

	onMount(() => {
		refreshAddress();
		refreshHostName();
	});


</script>

<main>

	<div class="adaptWidth flexCenterCol fillHeight gap">

		<div></div>

		<!--New mails-->
		<span>New mail address</span>
		<div class="adaptWidthSmall" style="display: flex; flex-wrap: wrap">

			<input bind:value={newAddressText} placeholder="New address" style="flex: 1">
			<span>{hostName}</span>

		</div>
		<button on:click={addAddress} class="adaptWidthSmall">Add this address</button>

		<div style="height: 30px;"></div>

		<!--List of existing addresses-->
		<span>Manage addresses</span>
		<div class="adaptWidthSmall" style="display: flex; flex-wrap: wrap">

			<select bind:value={selectedAddress} style="flex: 1">

				{#each addresses as address}

					<option value={address.addr}>{address.addr}</option>

				{/each}

			</select>

			<span>{hostName}</span>

		</div>

		<!--Delete selected address-->
		<button disabled={addresses.length == 0} on:click={deleteAddress} class="adaptWidthSmall">Delete this address</button>
		<div style="flex: 1"></div>

			<button on:click={()=>{window.location.replace('/')}} class="adaptWidthSmall" style="justify-content: flex-end">Back</button>

		<div></div>

	</div>

</main>
