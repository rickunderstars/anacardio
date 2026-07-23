import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";
import { resolve } from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
	root: "src",
	base: "/anacardio/",
	plugins: [
		glsl(),
		tailwindcss(),
		{
			name: "cache-busting",
			enforce: "post",
			transformIndexHtml(html) {
				const timestamp = Date.now();
				return html.replace(
					/(<script.*?src=")([^"]+?)(".*?>)/g,
					(match, p1, p2, p3) => {
						const separator = p2.includes("?") ? "&" : "?";
						return `${p1}${p2}${separator}v=${timestamp}${p3}`;
					},
				);
			},
		},
	],
	resolve: {
		alias: {
			"@js": resolve(__dirname, "src/js"),
			"@glsl": resolve(__dirname, "src/glsl"),
			"@css": resolve(__dirname, "src/css"),
			"@assets": resolve(__dirname, "src/assets"),
			"@": resolve(__dirname, "src"),
		},
	},
	build: {
		outDir: "../dist",
		emptyOutDir: true,
	},
	server: {
		port: 3000,
		open: true,
		host: true,
		hmr: false,
	},
	publicDir: "../public",
});
