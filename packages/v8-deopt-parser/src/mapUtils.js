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
