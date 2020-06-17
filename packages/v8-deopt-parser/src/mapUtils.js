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

// TODO: Implement these if necessary

/**
 * @param {import('./').MapEntry} map
 * @returns {boolean}
 */
export function isRoot(map) {
	return map.edge === undefined || map.edge.from === undefined;
}

/**
 * @param {import('./').MapEntry} map
 */
export function getTransitions(map) {
	let transitions = Object.create(null);
	let current = map;
	while (current) {
		let edge = current.edge;
		if (edge && edge.isTransition()) {
			transitions[edge.name] = edge;
		}
		current = current.parent();
	}
	return transitions;
}

/**
 * @param {import('./').MapEntry} map
 */
export function getParent(map) {
	return map.edge?.from;
}

/**
 * @param {import('./').MapEntry} map
 */
export function getParentChain(map) {
	let parents = [];
	let current = map.parent();
	while (current) {
		parents.push(current);
		current = current.parent();
	}
	return parents;
}

/**
 * @param {import('./').MapEntry} map
 */
export function getType(map) {
	return map.edge?.type ?? "new";
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
