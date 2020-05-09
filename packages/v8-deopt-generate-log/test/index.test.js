import * as path from "path";
import { readFile } from "fs/promises";
import { pathToFileURL, fileURLToPath } from "url";
import test from "tape";
import { generateV8Log } from "../src/index.js";

// @ts-ignore
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgPath = (...args) => path.join(__dirname, "..", ...args);
const repoRoot = (...args) => pkgPath("..", "..", ...args);
const getGHPageUrl = (path) =>
	"https://andrewiggins.github.io/v8-deopt-viewer/examples/" + path;

/**
 * @param {string} srcFilePath
 * @returns {Promise<string>}
 */
async function runGenerateV8Log(srcFilePath) {
	let outputParentDir, outputFileName;
	if (srcFilePath.startsWith("http:") || srcFilePath.startsWith("https:")) {
		const url = new URL(srcFilePath);
		const pathParts = url.pathname.split("/");
		outputParentDir = url.host + "-" + pathParts[pathParts.length - 2];
		outputFileName = pathParts[pathParts.length - 1] + ".v8.log";
	} else {
		outputParentDir = path.basename(path.dirname(srcFilePath));
		outputFileName = path.basename(srcFilePath) + ".v8.log";
	}

	const outputPath = pkgPath("test", "logs", outputParentDir, outputFileName);

	await generateV8Log(srcFilePath, {
		logFilePath: outputPath,
		browserTimeoutMs: 2e3,
	});

	return readFile(outputPath, "utf8");
}

/**
 * @param {import('tape').Test} t
 * @param {string} content
 * @param {string[]} srcFiles
 */
function verifySrcFiles(t, content, srcFiles) {
	for (let srcFile of srcFiles) {
		srcFile = srcFile.replace(/\\/g, "\\\\");
		t.equal(content.includes(srcFile), true, `Content contains ${srcFile}`);
	}
}

test("generateV8Log(simple/adders.js)", async (t) => {
	const srcFilePath = repoRoot("examples/simple/adders.js");
	const logContent = await runGenerateV8Log(srcFilePath);

	verifySrcFiles(t, logContent, [srcFilePath]);
});

test("generateV8Log(two-modules/adders.js)", async (t) => {
	const srcFilePath = repoRoot("examples/two-modules/adders.js");
	const logContent = await runGenerateV8Log(srcFilePath);

	verifySrcFiles(t, logContent, [
		srcFilePath,
		repoRoot("examples/two-modules/objects.js"),
	]);
});

test("generateV8Log(html-inline/adders.html)", async (t) => {
	const srcFilePath = repoRoot("examples/html-inline/adders.html");
	const logContent = await runGenerateV8Log(srcFilePath);

	verifySrcFiles(t, logContent, [pathToFileURL(srcFilePath).toString()]);
});

test("generateV8Log(html-external/index.html)", async (t) => {
	const srcFilePath = repoRoot("examples/html-external/index.html");
	const logContent = await runGenerateV8Log(srcFilePath);

	verifySrcFiles(t, logContent, [
		pathToFileURL(repoRoot("examples/html-external/adders.js")).toString(),
		pathToFileURL(repoRoot("examples/html-external/objects.js")).toString(),
	]);
});

test("generateV8Log(GitHub Pages html-inline/adders.html)", async (t) => {
	const srcFilePath = getGHPageUrl("html-inline/adders.html");
	const logContent = await runGenerateV8Log(srcFilePath);

	verifySrcFiles(t, logContent, [srcFilePath]);
});

test("generateV8Log(GitHub Pages html-external/index.html)", async (t) => {
	const srcFilePath = getGHPageUrl("html-external/index.html");
	const logContent = await runGenerateV8Log(srcFilePath);

	verifySrcFiles(t, logContent, [
		getGHPageUrl("html-external/adders.js"),
		getGHPageUrl("html-external/objects.js"),
	]);
});
