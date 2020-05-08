/**
 * @param {import('.').CodeEntry | import('.').DeoptEntry | import('.').ICEntry} entry
 */
export function locationKey(entry) {
	return `${entry.functionName}:${entry.line}:${entry.column}`;
}

/**
 * @param {string} key
 * @returns {[string, number, number]}
 */
export function parseLocationKey(key) {
	const parts = key.split(":");
	if (parts.length !== 3) {
		throw new Error(`Invalid location key: ${key}`);
	}

	return [parts[0], parseInt(parts[1], 10), parseInt(parts[2], 10)];
}

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

/**
 * @param {import('.').V8DeoptInfo} rawDeoptInfo
 * @returns {import('.').PerFilePerLocationV8DeoptInfo}
 */
export function groupByFileAndLocation(rawDeoptInfo) {
	/** @type {import('.').PerFilePerLocationV8DeoptInfo} */
	const files = Object.create(null);

	/** @type {Array<keyof import('./index').V8DeoptInfo>} */
	// @ts-ignore
	const kinds = Object.keys(rawDeoptInfo);
	for (const kind of kinds) {
		for (const entry of rawDeoptInfo[kind]) {
			if (!(entry.file in files)) {
				files[entry.file] = Object.create(null);
			}

			const key = locationKey(entry);
			if (!(key in files[entry.file])) {
				files[entry.file][key] = { ics: [], deopts: [], codes: [] };
			}

			// @ts-ignore
			files[entry.file][key][kind].push(entry);
		}
	}

	return files;
}
