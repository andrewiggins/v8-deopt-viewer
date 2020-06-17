import * as path from "path";
import { fileURLToPath } from "url";
import { readFile } from "fs/promises";

import { edgeToString } from "../src/mapUtils.js";

// @ts-ignore
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @param {Array<import('..').ICEntry>} ics
 * @returns {number[]}
 */
function getMapsFromICs(ics) {
	/** @type {Set<number>} */
	const mapIds = new Set([]);
	for (const entry of ics) {
		for (const update of entry.updates) {
			mapIds.add(update.map);
		}
	}

	return Array.from(mapIds);
}

/**
 * @param {import('..').MapEntry | import('..').MapEdge} mapOrEdge
 * @returns {string | number | undefined}
 */
function getParentId(mapOrEdge) {
	if (mapOrEdge.type == "MapEntry") {
		return mapOrEdge.edge;
	} else {
		return mapOrEdge.from;
	}
}

/**
 * @param {import('..').MapData} data
 * @param {import('..').MapEntry | import('..').MapEdge} mapOrEdge
 */
function getParent(data, mapOrEdge) {
	if (mapOrEdge.type == "MapEntry") {
		if (mapOrEdge.edge) {
			return data.edges[mapOrEdge.edge];
		}
	} else {
		if (mapOrEdge.from) {
			return data.nodes[mapOrEdge.from];
		}
	}
}

/**
 * @param {import('..').MapData} data
 * @param {import('..').MapEntry | import('..').MapEdge} mapOrEdge
 * @returns {import('..').MapEntry | import('..').MapEdge}
 */
function getRoot(data, mapOrEdge) {
	/** @type {import('..').MapEntry | import('..').MapEdge} */
	let current = mapOrEdge;
	while (current && getParentId(current)) {
		current = getParent(data, current);
	}

	// if (current.type == "MapEntry") {
	// 	console.log("LOOK HERE:", mapOrEdge.id);
	// }

	return current;
}

const CROSS = " ├─";
const CORNER = " └─";
const VERTICAL = " │ ";
const SPACE = "   ";

/**
 * @param {import('..').MapData} data
 * @param {import('..').MapEntry} node
 * @param {string} [indent]
 * @param {boolean} [isLast]
 */
function printMapTree(data, node, indent = "", isLast = true) {
	let line = indent;

	if (isLast) {
		line += CORNER;
		indent += SPACE;
	} else {
		line += CROSS;
		indent += VERTICAL;
	}

	if (node.edge) {
		const edge = data.edges[node.edge];
		line += edgeToString(edge);
	} else {
		line += node.id;
	}
	console.log(line);

	const children = node.children.map(
		(edgeId) => data.nodes[data.edges[edgeId].to]
	);
	for (const child of children) {
		printMapTree(data, child, indent, children[children.length - 1] == child);
	}
}

async function main() {
	const dataPath = path.join(__dirname, "snapshots/html-inline.traceMaps.json");

	/** @type {import('..').V8DeoptInfo} */
	const v8DeoptInfo = JSON.parse(await readFile(dataPath, "utf-8"));
	const mapData = v8DeoptInfo.maps;

	const icMapIds = getMapsFromICs(v8DeoptInfo.ics);
	console.log("Interesting index:", icMapIds.indexOf(1005159202561));

	const rootEdge = getRoot(mapData, mapData.nodes[icMapIds[0]]);
	const rootMap = getRoot(mapData, mapData.nodes[icMapIds[25]]);
	console.log("Root Edge:", rootEdge);
	console.log("Root Map :", rootMap);

	const allRoots = Array.from(
		new Set(icMapIds.map((mapId) => getRoot(mapData, mapData.nodes[mapId])))
	);
	console.log(
		"Root IDs:",
		allRoots.map((root) => root.id)
	);
	console.log("Root count:", allRoots.length);

	// console.log();
	// printMapTree(mapData, mapData.nodes["1005159187241"]);
	// console.log();

	for (let root of allRoots) {
		if (root.type == "MapEdge") {
			root = mapData.nodes[root.to];
		}

		console.log();
		printMapTree(mapData, root);
		console.log();
	}

	// Learnings:
	// - It seems array literals have maps that are directly created (no initial edge)
	// - Each array literal creation gets its own map (i.e. MapOf([]) !== MapOf([]) )
	// - Object literals transition off of a common map? first from a ReplaceDescriptors?

	// TODO:
	// 1. Consider defining the root as always the map that map.edge == undefined
	//    or .edge.from == undefined
	// 1. Optionally filter out unnecessary maps and edges in DeoptLogReader base
	//    on keepInternals flag

	console.log("IC Map ID count :", icMapIds.length);
	console.log("Total Map count :", Object.keys(v8DeoptInfo.maps.nodes).length);
	console.log("Total Edge count:", Object.keys(v8DeoptInfo.maps.edges).length);
}

main();
