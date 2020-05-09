import { readdir } from "fs/promises";
import { pathToFileURL } from "url";
import { pkgRoot } from "./helpers.js";

async function main() {
	const dirContents = await readdir(pkgRoot("test"));
	const testFiles = dirContents.filter(
		(name) => name.endsWith(".test.js") && name !== "index.test.js"
	);

	for (let testFile of testFiles) {
		try {
			await import(pathToFileURL(pkgRoot("test", testFile)).toString());
		} catch (e) {
			console.error(e);
			process.exit(1);
		}
	}
}

main();
