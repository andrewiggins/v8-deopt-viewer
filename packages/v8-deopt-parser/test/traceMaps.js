import * as path from "path";
import { fileURLToPath } from "url";
import { readFile } from "fs/promises";

import { edgeToString, getMapIdsFromICs } from "../src/mapUtils.js";

// @ts-ignore
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @param {import('..').MapData} data
 * @param {import('..').MapEntry} map
 * @returns {import('..').MapEntry}
 */
function getRootMap(data, map) {
	let parentMapId = map.edge ? data.edges[map.edge]?.from : null;
	while (parentMapId) {
		map = data.nodes[parentMapId];
		parentMapId = map.edge ? data.edges[map.edge]?.from : null;
	}

	return map;
}

let edgeCount = 0;
let mapCount = 0;

const CROSS = " ├─";
const CORNER = " └─";
const VERTICAL = " │ ";
const SPACE = "   ";

/**
 * @param {import('..').MapData} data
 * @param {import('..').MapEntry} map
 * @param {string} [indent]
 * @param {boolean} [isLast]
 */
function printMapTree(data, map, indent = "", isLast = true) {
	mapCount += 1;

	let line = indent;
	if (isLast) {
		line += CORNER;
		indent += SPACE;
	} else {
		line += CROSS;
		indent += VERTICAL;
	}

	if (map.edge) {
		edgeCount += 1;
		const edge = data.edges[map.edge];
		line += edgeToString(edge) + `\t[${map.id}]`;
	} else {
		line += map.id;
	}
	console.log(line);

	const children = map.children.map(
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

	const icMapIds = Array.from(getMapIdsFromICs(v8DeoptInfo.ics));
	const rootMap = getRootMap(mapData, mapData.nodes[icMapIds[0]]);
	console.log("Root Map :", rootMap);

	const allRootMaps = Array.from(
		new Set(icMapIds.map((mapId) => getRootMap(mapData, mapData.nodes[mapId])))
	);
	console.log(
		"Root IDs:",
		allRootMaps.map((root) => root.id)
	);
	console.log("Root count:", allRootMaps.length);

	// console.log();
	// printMapTree(mapData, mapData.nodes["1005159187241"]);
	// console.log();

	mapCount = 0;
	edgeCount = 0;

	for (let root of allRootMaps) {
		console.log();
		printMapTree(mapData, root);
	}

	console.log();
	console.log("mapCount:", mapCount); // Expected 46 for html-inline log
	console.log("edgeCount:", edgeCount); // Expected 43 for html-inline log
	console.log();

	// Learnings:
	// - It seems array literals have maps that are directly created (no initial edge)
	// - Each array literal creation gets its own map (i.e. MapOf([]) !== MapOf([]) )
	// - Object literals transition off of a common map? first from a ReplaceDescriptors?

	console.log("IC Map ID count :", icMapIds.length);
	console.log("Total Map count :", Object.keys(v8DeoptInfo.maps.nodes).length);
	console.log("Total Edge count:", Object.keys(v8DeoptInfo.maps.edges).length);
}

main();
