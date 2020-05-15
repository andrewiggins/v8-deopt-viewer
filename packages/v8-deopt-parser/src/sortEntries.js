const typeOrder = ["code", "deopt", "ics"];

/**
 * @param {import('v8-deopt-parser').Entry[]} entries
 */
export function sortEntries(entries) {
	return entries.sort((entry1, entry2) => {
		if (entry1.line != entry2.line) {
			return entry1.line - entry2.line;
		} else if (entry1.column != entry2.column) {
			return entry1.column - entry2.column;
		} else if (entry1.type != entry2.type) {
			return typeOrder.indexOf(entry1.type) - typeOrder.indexOf(entry2.type);
		} else {
			return 0;
		}
	});
}
