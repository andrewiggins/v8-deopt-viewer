/**
 * @param {import('v8-deopt-parser').FileV8DeoptInfo} deoptInfo
 * @param {string} entryId
 * @returns {import('v8-deopt-parser').Entry}
 */
export function findEntry(deoptInfo, entryId) {
	if (!entryId) {
		return null;
	}

	/** @type {Array<keyof import('v8-deopt-parser').FileV8DeoptInfo>} */
	const kinds = ["codes", "deopts", "ics"];
	for (let kind of kinds) {
		for (let entry of deoptInfo[kind]) {
			if (entry.id == entryId) {
				return entry;
			}
		}
	}
}
