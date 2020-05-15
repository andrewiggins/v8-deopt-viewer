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

// TODO: Consider rewriting v8-tools-core to be tree-shakeable
export { groupByFile } from "./groupBy.js";
export { findEntry } from "./findEntry.js";
export { sortEntries } from "./sortEntries.js";
export { severityIcState } from "./propertyICParsers.js";
