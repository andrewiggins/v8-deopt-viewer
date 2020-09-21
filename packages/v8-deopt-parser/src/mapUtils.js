/**
 * @param {Iterable<import('..').ICEntry>} ics
 * @returns {Set<string>}
 */
export function getMapIdsFromICs(ics) {
	/** @type {Set<string>} */
	const mapIds = new Set();
	for (const entry of ics) {
		for (const update of entry.updates) {
			mapIds.add(update.map);
		}
	}

	return mapIds;
}

/**
 * @param {import('./').MapEdge} edge
 */
export function getEdgeSymbol(edge) {
	switch (edge.subtype) {
		case "Transition":
			return "+";
		case "Normalize": // FastToSlow
			return "⊡";
		case "SlowToFast":
			return "⊛";
		case "ReplaceDescriptors":
			return edge.name ? "+" : "∥";
		default:
			return "";
	}
}

/**
 * @param {import('./').MapEdge} edge
 */
export function edgeToString(edge) {
	let s = getEdgeSymbol(edge);
	switch (edge.subtype) {
		case "Transition":
			return s + edge.name;
		case "SlowToFast":
			return s + edge.reason;
		case "CopyAsPrototype":
			return s + "Copy as Prototype";
		case "OptimizeAsPrototype":
			return s + "Optimize as Prototype";
		default:
			if (edge.subtype == "ReplaceDescriptors" && edge.name) {
				return edge.subtype + " " + getEdgeSymbol(edge) + edge.name;
			} else {
				return `${edge.subtype} ${edge?.reason ?? ""} ${edge?.name ?? ""}`;
			}
	}
}
