import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'; // Добавь эту строку, если её нет

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: vitePreprocess(), 
    kit: {
        adapter: adapter() 
    }
};

export default config;