import { readdir } from "fs/promises";
import { pkgRoot, runParser, writeSnapshot } from "./helpers.js";
import { validateMapData, writeMapSnapshot } from "./traceMapsHelpers.js";

// This file is used to run v8-deopt-viewer on v8-deopt-parser itself :)

const t = {
	/**
	 * @param {any} actual
	 * @param {any} expected
	 * @param {string} [message]
	 */
	equal(actual, expected, message) {
		if (actual !== expected) {
			const errorMessage = `${message}: Actual (${actual}) does not equal expected (${expected}).`;
			console.error(errorMessage);
			// throw new Error(errorMessage);
		}
	},
};

async function main() {
	// const logFileNames = await readdir(pkgRoot("test/logs"));
	// for (let logFileName of logFileNames) {
	// 	await runParser(t, logFileName);
	// }

	// const logFileName = "html-inline.traceMaps.v8.log";
	// const logFileName = "v8-deopt-parser.v8.log";
	const logFileName = "adders.traceMaps.v8.log";
	const results = await runParser(t, logFileName);
	await writeSnapshot(logFileName, results);
	await writeMapSnapshot(logFileName, results);
	validateMapData(t, results);
}

main();
