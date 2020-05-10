import nodeResolve from "@rollup/plugin-node-resolve";
import sucrase from "@rollup/plugin-sucrase";

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
			transforms: ["jsx"],
			jsxPragma: "createElement",
		}),
	],
};

export default config;
