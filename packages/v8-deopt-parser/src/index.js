import { DeoptLogReader } from "./DeoptLogReader.js";

/**
 * @param {string} v8LogContent
 * @param {import('.').Options} [options]
 * @returns {Promise<import('.').V8DeoptInfo>}
 */
export async function parseV8Log(v8LogContent, options = {}) {
	v8LogContent = v8LogContent.replace(/\r\n/g, "\n");

	const logReader = new DeoptLogReader(options);
	logReader.processLogChunk(v8LogContent);
	return logReader.toJSON();
}

/**
 * @param {Generator<string>} v8LogStream
 * @param {import('.').Options} [options]
 * @returns {Promise<import('.').V8DeoptInfo>}
 */
export async function parseV8LogStream(v8LogStream, options = {}) {
	const logReader = new DeoptLogReader(options);

	// we receive chunks of strings, but chunks split at random places, not \n
	// so, lets keep leftovers from previous steps and concat them with current block
	let leftOver = '';
	for await (const chunk of v8LogStream) {
		const actualChunk = (leftOver + chunk).replace(/\r\n/g, "\n");

		const lastLineBreak = actualChunk.lastIndexOf('\n');
		if (lastLineBreak !== -1) {
			logReader.processLogChunk(actualChunk.slice(0, lastLineBreak));
			leftOver = actualChunk.slice(lastLineBreak + 1); // skip \n
		} else {
			leftOver = actualChunk; // nothing processed at this step, save for later processing
		}
	}

	if (leftOver.length > 0) {
		logReader.processLogChunk(leftOver);
	}
	return logReader.toJSON();
}

// TODO: Consider rewriting v8-tools-core to be tree-shakeable
export { groupByFile } from "./groupBy.js";
export { findEntry } from "./findEntry.js";
export { sortEntries } from "./sortEntries.js";
export { severityIcState } from "./propertyICParsers.js";
export { MIN_SEVERITY, UNKNOWN_SEVERITY } from "./utils.js";
