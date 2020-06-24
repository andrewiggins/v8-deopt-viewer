import { readdir } from "fs/promises";
import { pkgRoot, runParser } from "./helpers.js";

// This file is used to run v8-deopt-viewer on v8-deopt-parser itself :)

const t = {
	/**
	 * @param {any} actual
	 * @param {any} expected
	 * @param {string} [message]
	 */
	equal(actual, expected, message) {
		if (actual !== expected) {
			throw new Error(
				`Actual (${actual}) does not equal expected (${expected}). Message: ${message}`
			);
		}
	},
};

async function main() {
	const logFileNames = await readdir(pkgRoot("test/logs"));
	for (let logFileName of logFileNames) {
		await runParser(t, logFileName);
	}
}

main();
