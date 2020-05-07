import { readFileSync, writeFileSync } from "fs";
import { parseV8Log } from "../src/index.js";

async function main() {
	const getSrc = () => Promise.resolve(null);
	const result = await parseV8Log(
		readFileSync("./logs/html-external.v8.log", "utf8"),
		getSrc
	);

	writeFileSync("results.json", JSON.stringify(result, null, 2), "utf8");
}

main();
