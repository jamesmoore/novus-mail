import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({

	root: './html',
	server: {
		watch: {
			usePolling: true,
			interval: 250,
		}
	},
	plugins: [svelte()],
	build: {

		rollupOptions: {
			
			input: {
				
				main: './html/index.html',
				manage: './html/manage.html',

			},

		},

		outDir: './dist',
		emptyOutDir: true,

	}

})

