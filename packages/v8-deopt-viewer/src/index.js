import * as path from "path";
import { readFile, writeFile } from "fs/promises";
import { fileURLToPath } from "url";
import open from "open";
import { get } from "httpie/dist/httpie.mjs";
import { generateV8Log } from "v8-deopt-generate-log";
import { parseV8Log, groupByFile } from "v8-deopt-parser";
import { determineCommonRoot } from "./determineCommonRoot.js";

/**
 * @param {import('v8-deopt-parser').PerFileV8DeoptInfo} deoptInfo
 * @returns {Promise<Record<string, import('./').V8DeoptInfoWithSources>>}
 */
async function addSources(deoptInfo) {
	const files = Object.keys(deoptInfo);
	const root = determineCommonRoot(files);
	console.log(root);

	/** @type {Record<string, import('v8-deopt-webapp').V8DeoptInfoWithSources>} */
	const result = Object.create(null);
	for (let file of files) {
		let srcPath;

		let src, error;
		if (file.startsWith("https://")) {
			try {
				srcPath = file;
				const { data } = await get(file);
				src = data;
			} catch (e) {
				error = e;
			}
		} else {
			let filePath = file.startsWith("file://") ? fileURLToPath(file) : file;
			if (path.isAbsolute(filePath)) {
				try {
					srcPath = filePath;
					src = await readFile(filePath, "utf8");
				} catch (e) {
					error = e;
				}
			} else {
				error = new Error("File path is not absolute");
			}
		}

		const relativePath = root ? file.slice(root.length) : file;
		if (error) {
			result[file] = {
				...deoptInfo[file],
				relativePath,
				srcPath,
				error,
			};
		} else {
			result[file] = {
				...deoptInfo[file],
				relativePath,
				srcPath,
				src,
			};
		}
	}

	return result;
}

/**
 * @param {string} srcFile
 * @param {import('.').Options} options
 */
export default async function run(srcFile, options) {
	let logFilePath;
	if (srcFile) {
		if (srcFile.startsWith("http://")) {
			throw new Error(
				"Please use an https URL. This script runs websites without a sandbox and untrusted URLs could compromise your machine."
			);
		}

		console.log("Running and generating log...");
		logFilePath = await generateV8Log(srcFile, {
			logFilePath: path.join(options.out, "v8.log"),
			browserTimeoutMs: options.timeout,
		});
	} else if (options.input) {
		logFilePath = path.isAbsolute(options.input)
			? options.input
			: path.join(process.cwd(), options.input);
	} else {
		throw new Error(
			'Either a file/url to generate a log or the "--input" flag pointing to a v8.log must be provided'
		);
	}

	console.log("Parsing log...");
	const logContents = await readFile(logFilePath, "utf8");
	const rawDeoptInfo = await parseV8Log(logContents, {
		keepInternals: options["keep-internals"],
	});

	console.log("Adding sources...");
	const deoptInfo = await addSources(groupByFile(rawDeoptInfo));
	await writeFile(
		path.join(options.out, "v8.json"),
		JSON.stringify(deoptInfo, null, 2),
		"utf8"
	);

	console.log("Generating webapp...");
	const indexPath = "";
	// TODO: Generate webapp

	if (options.open) {
		await open(indexPath, { url: true });
		console.log(
			`Done! Opening ${path.join(options.out, "index.html")} in your browser...`
		);
	} else {
		console.log(
			`Done! Open ${path.join(options.out, "index.html")} in your browser.`
		);
	}
}
