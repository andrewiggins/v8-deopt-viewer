import preact from "@preact/preset-vite";
import visualizer from "rollup-plugin-visualizer";
import { defineConfig } from "vite";
import { generateTestData } from "./test/generateTestData.mjs";

export default defineConfig({
	plugins: [
		preact(),
		// @ts-ignore Types are wrong
		visualizer.default({
			filename: "stats.html",
			gzipSize: true,
			// brotliSize: true,
		}),
		{
			name: "v8-deopt-webapp:generate-test-data",
			async buildEnd() {
				await generateTestData();
			},
		},
	],
	css: {
		modules: {
			// @ts-expect-error Vite types are wrong
			localsConvention(name) {
				return name.replace(/-/g, "_");
			},
		},
	},
	build: {
		lib: {
			entry: "src/index.jsx",
			name: "V8DeoptViewer",
		},
	},
	json: {
		stringify: true,
	},
});
