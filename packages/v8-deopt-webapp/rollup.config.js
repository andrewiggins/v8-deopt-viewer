import nodeResolve from "@rollup/plugin-node-resolve";
import sucrase from "@rollup/plugin-sucrase";
import postcss from "rollup-plugin-postcss";

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
		}),
	],
};

export default config;
