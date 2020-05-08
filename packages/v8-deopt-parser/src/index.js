import { DeoptLogReader } from "./DeoptLogReader.js";

/**
 * @param {string} v8LogContent
 * @returns {Promise<import('.').V8DeoptInfo>}
 */
export async function parseV8Log(v8LogContent) {
	v8LogContent = v8LogContent.replace(/\r\n/g, "\n");

	const logReader = new DeoptLogReader();
	logReader.processLogChunk(v8LogContent);
	return logReader.toJSON();
}
