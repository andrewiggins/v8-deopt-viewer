/**
 * @param {import('.').V8DeoptInfo} rawDeoptInfo
 * @returns {import('.').PerFileV8DeoptInfo}
 */
export function groupByFile(rawDeoptInfo) {
	/** @type {Record<string, import('.').V8DeoptInfo>} */
	const files = Object.create(null);

	/** @type {Array<"codes" | "deopts" | "ics">} */
	// @ts-ignore
	const kinds = ["codes", "deopts", "ics"];
	for (const kind of kinds) {
		for (const entry of rawDeoptInfo[kind]) {
			if (!(entry.file in files)) {
				files[entry.file] = { id: entry.file, ics: [], deopts: [], codes: [] };
			}

			// @ts-ignore
			files[entry.file][kind].push(entry);
		}
	}

	return {
		files,
		maps: rawDeoptInfo.maps,
	};
}
