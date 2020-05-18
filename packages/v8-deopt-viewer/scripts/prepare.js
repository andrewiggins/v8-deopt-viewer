import * as path from "path";
import { fileURLToPath } from "url";
import { copyFile } from "fs/promises";

// @ts-ignore
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = (...args) => path.join(__dirname, "..", "..", "..", ...args);

async function prepare() {
	await copyFile(
		repoRoot("README.md"),
		repoRoot("packages/v8-deopt-viewer/README.md")
	);
}

prepare();
