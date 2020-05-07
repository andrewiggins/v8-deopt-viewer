import { fileURLToPath } from "url";
import * as path from "path";
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { parseV8Log } from "../src/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
	const getSrc = () => Promise.resolve(null);

	const logFileNames = readdirSync(path.join(__dirname, "logs"));
	for (let fileName of logFileNames) {
		const logPath = path.join(__dirname, "logs", fileName);
		const result = await parseV8Log(readFileSync(logPath, "utf8"), getSrc);

		const outFileName = fileName.replace(".v8.log", ".json");
		const outPath = path.join(__dirname, "snapshots", outFileName);
		writeFileSync(outPath, JSON.stringify(result, null, 2), "utf8");
	}
}

main();
