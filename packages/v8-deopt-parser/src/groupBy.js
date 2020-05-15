/**
 * @param {import('.').V8DeoptInfo} rawDeoptInfo
 * @returns {import('.').PerFileV8DeoptInfo}
 */
export function groupByFile(rawDeoptInfo) {
	/** @type {import('.').PerFileV8DeoptInfo} */
	const files = Object.create(null);

	/** @type {Array<keyof import('./index').V8DeoptInfo>} */
	// @ts-ignore
	const kinds = Object.keys(rawDeoptInfo);
	for (const kind of kinds) {
		for (const entry of rawDeoptInfo[kind]) {
			if (!(entry.file in files)) {
				files[entry.file] = { ics: [], deopts: [], codes: [] };
			}

			// @ts-ignore
			files[entry.file][kind].push(entry);
		}
	}

	return files;
}
