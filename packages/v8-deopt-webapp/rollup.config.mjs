import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import sucrase from "@rollup/plugin-sucrase";
import postcss from "rollup-plugin-postcss";
import visualizerPkg from "rollup-plugin-visualizer";
import { terser } from "rollup-plugin-terser";

// @ts-ignore Types are wrong
const visualizer = visualizerPkg.default;

/**
 * @param {string} outputFile
 * @param {any[]} customPlugins
 * @returns {import('rollup').RollupOptions}
 */
function getConfig(outputFile, customPlugins) {
	return {
		input: "./src/index.js",
		output: {
			file: outputFile,
			format: "umd",
			name: "V8DeoptViewer",
		},
		plugins: [
			nodeResolve(),
			sucrase({
				include: [/.js$/],
				production: true,
				transforms: ["jsx"],
				jsxPragma: "createElement",
			}),
			postcss({
				extract: true,
				modules: true,
				minimize: true,
				namedExports(name) {
					return name.replace(/-/g, "_");
				},
			}),
			commonjs(),
			...customPlugins,
		],
		watch: {
			clearScreen: false,
		},
	};
}

export default [
	getConfig("dist/index.debug.js", []),
	getConfig("dist/index.js", [
		terser(),
		visualizer({
			filename: "dist/stats.html",
			gzipSize: true,
			// brotliSize: true,
		}),
	]),
];
