/**
 * @param {Iterable<import('..').ICEntry>} ics
 * @returns {Set<number>}
 */
export function getMapIdsFromICs(ics) {
	/** @type {Set<number>} */
	const mapIds = new Set();
	for (const entry of ics) {
		for (const update of entry.updates) {
			mapIds.add(update.map);
		}
	}

	return mapIds;
}

/**
 * @param {Map<number, import('..').MapEntry>} maps
 * @param {Map<string, import('..').MapEdge>} edges
 * @param {import('..').MapEntry} map
 * @returns {import('..').MapEntry}
 */
export function getRootMap(maps, edges, map) {
	let parentMapId = map.edge ? edges.get(map.edge)?.from : null;
	while (parentMapId) {
		map = maps.get(parentMapId);
		parentMapId = map.edge ? edges.get(map.edge)?.from : null;
	}

	return map;
}

/**
 * @param {Map<number, import('..').MapEntry>} allMaps
 * @param {Map<string, import('..').MapEdge>} allEdges
 * @param {import('..').MapEntry} map
 * @param {(map: import('..').MapEntry) => void} visitor
 */
export function visitAllMaps(allMaps, allEdges, map, visitor) {
	visitor(map);
	if (map.children) {
		for (const edgeId of map.children) {
			const edge = allEdges.get(edgeId);
			const nextMap = allMaps.get(edge.to);
			visitAllMaps(allMaps, allEdges, nextMap, visitor);
		}
	}
}

/**
 * @param {import('./').MapEdge} edge
 */
export function getEdgeSymbol(edge) {
	switch (edge.subtype) {
		case "Transition":
			return "+";
		case "Normalize":
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
