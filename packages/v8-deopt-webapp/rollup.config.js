import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import sucrase from "@rollup/plugin-sucrase";
import postcss from "rollup-plugin-postcss";
import visualizer from "rollup-plugin-visualizer";

/** @type {import('rollup').RollupOptions} */
const config = {
	input: "./src/index.js",
	output: {
		dir: "dist",
		format: "esm",
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
		visualizer({
			filename: "dist/stats.html",
			gzipSize: true,
			// brotliSize: true,
		}),
	],
};

export default config;
