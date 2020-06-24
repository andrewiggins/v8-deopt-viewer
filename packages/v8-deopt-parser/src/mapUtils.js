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
 * @param {(mapId: number) => import('..').MapEntry} getMap
 * @param {(edgeId: string) => import('..').MapEdge} getEdge
 * @param {import('..').MapEntry} map
 * @returns {import('..').MapEntry}
 */
export function getRootMap(getMap, getEdge, map) {
	let parentMapId = map.edge ? getEdge(map.edge)?.from : null;
	while (parentMapId) {
		map = getMap(parentMapId);
		parentMapId = map.edge ? getEdge(map.edge)?.from : null;
	}

	return map;
}

/**
 * @param {import('..').MapEntry} map
 * @param {(mapId: number) => import('..').MapEntry} getMap
 * @param {(edgeId: string) => import('..').MapEdge} getEdge
 * @param {(map: import('..').MapEntry) => void} visitor
 */
export function visitAllMaps(map, getMap, getEdge, visitor) {
	// TODO: It appears maps can be circular (e.g. TypeScript deopt logs).
	// Efficiently handle that

	const stack = [map.id];
	while (stack.length) {
		const mapId = stack.pop();
		const map = getMap(mapId);

		visitor(map);

		if (map.children) {
			// Add children to stack in reverse order to preserve left-to-right depth
			// first traversal
			let i = map.children.length;
			while (i--) {
				const edge = getEdge(map.children[i]);
				stack.push(edge.to);
			}
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
