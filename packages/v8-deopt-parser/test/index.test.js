import * as fs from "fs";
import { pathToFileURL } from "url";
import { pkgRoot } from "./helpers.js";

const {
	promises: { readdir },
} = fs;

async function main() {
	const dirContents = await readdir(pkgRoot("test"));
	const testFiles = dirContents.filter(
		(name) => name.endsWith(".test.js") && name !== "index.test.js"
	);

	for (let testFile of testFiles) {
		await import(pathToFileURL(pkgRoot("test", testFile)).toString());
	}
}

main();
