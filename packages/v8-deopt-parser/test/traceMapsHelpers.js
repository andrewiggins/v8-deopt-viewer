import * as path from "path";
import { fileURLToPath } from "url";
import { writeFile } from "fs/promises";
import { edgeToString, getMapIdsFromICs } from "../src/mapUtils.js";

// @ts-ignore
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @param {import('..').V8DeoptInfo} deoptInfo
 */
export function validateMapData(t, deoptInfo) {
	const mapData = deoptInfo.maps;

	const icMapIds = Array.from(getMapIdsFromICs(deoptInfo.ics));
	const mapEntryIds = Object.keys(mapData.nodes).map((id) => parseInt(id));
	const mapIdsFromEdges = Array.from(getAllMapIdsFromEdges(mapData));

	const edgeEntryIds = Object.keys(mapData.edges);
	const edgeIdsFromMaps = Array.from(getAllEdgeIdsFromMaps(mapData));

	// Ensure all maps referenced in ics exist in map.entries
	let missingMaps = icMapIds.filter((id) => !mapEntryIds.includes(id));
	if (missingMaps.length > 0) {
		console.log("IC Map IDs with no map entry:", missingMaps);
	}
	t.equal(missingMaps.length, 0, "All IC map IDs have map entries");

	// Ensure all maps references in maps.edges exists in maps.entries
	missingMaps = mapIdsFromEdges.filter((id) => !mapEntryIds.includes(id));
	if (missingMaps.length > 0) {
		console.log(
			"Map IDs referenced from an edge without an corresponding map entry:",
			missingMaps
		);
	}
	t.equal(missingMaps.length, 0, "All edge from/to map IDs have map entries");

	// Ensure all edges references in maps.entries exist in maps.edges
	let missingEdges = edgeIdsFromMaps.filter((id) => !edgeEntryIds.includes(id));
	if (missingEdges.length > 0) {
		console.log(
			"Edge IDs referenced from a Map without an edge entry:",
			missingEdges
		);
	}
	t.equal(missingEdges.length, 0, "All map edge references have edge entries");

	// Ensure there are no superfluous maps or edges. Walk the entire map graph
	// and ensure no missing nodes or unused nodes

	/** @type {Set<number>} */
	const allMapIds = new Set([...icMapIds, ...mapIdsFromEdges, ...mapEntryIds]);

	/** @type {Set<string>} */
	const allEdgeIds = new Set([...edgeIdsFromMaps, ...edgeEntryIds]);

	const rootMaps = new Set(
		icMapIds.map((mapId) => getRootMap(mapData, mapData.nodes[mapId]))
	);

	for (const rootMap of rootMaps) {
		visitAllMaps(mapData, rootMap, (map) => {
			allMapIds.delete(map.id);
			allEdgeIds.delete(map.edge);
			map.children.forEach((edgeId) => allEdgeIds.delete(edgeId));
		});
	}

	t.equal(allMapIds.size, 0, "All maps are connected to a root");
	t.equal(allEdgeIds.size, 0, "All edges are connected to a root");
}

/**
 * @param {string} logFileName
 * @param {import('..').V8DeoptInfo} deoptInfo
 */
export async function writeMapSnapshot(logFileName, deoptInfo) {
	const mapData = deoptInfo.maps;
	const icMapIds = Array.from(getMapIdsFromICs(deoptInfo.ics));
	const rootMaps = new Set(
		icMapIds.map((mapId) => getRootMap(mapData, mapData.nodes[mapId]))
	);

	let snapshot = "";
	let totalMapCount = 0;
	let totalEdgeCount = 0;

	for (let rootMap of rootMaps) {
		const { tree, mapCount, edgeCount } = generateMapTree(mapData, rootMap);

		snapshot += tree + "\n";
		totalMapCount += mapCount;
		totalEdgeCount += edgeCount;
	}

	snapshot += "\n\n";
	snapshot += `Total Map Count : ${totalMapCount}\n`;
	snapshot += `Total Edge Count: ${totalEdgeCount}\n`;
	snapshot += "\n";

	const outFileName = logFileName.replace(".v8.log", ".mapTree.txt");
	const outPath = path.join(__dirname, "snapshots", outFileName);
	await writeFile(outPath, snapshot, "utf8");
}

/**
 * @param {import('../src').MapData} data
 * @param {import('../src').MapEntry} map
 * @returns {import('../src').MapEntry}
 */
function getRootMap(data, map) {
	let parentMapId = map.edge ? data.edges[map.edge]?.from : null;
	while (parentMapId) {
		map = data.nodes[parentMapId];
		parentMapId = map.edge ? data.edges[map.edge]?.from : null;
	}

	return map;
}

/**
 * @param {import('../src').MapData} mapData
 * @returns {Iterable<string>}
 */
function getAllEdgeIdsFromMaps(mapData) {
	/** @type {Set<string>} */
	const edgeIds = new Set();
	for (let mapId in mapData.nodes) {
		const map = mapData.nodes[mapId];
		if (map.edge) {
			edgeIds.add(map.edge);
		}

		map.children.forEach((child) => edgeIds.add(child));
	}

	return edgeIds;
}

/**
 * @param {import('../src').MapData} mapData
 * @returns {Iterable<number>}
 */
function getAllMapIdsFromEdges(mapData) {
	/** @type {Set<number>} */
	const mapIds = new Set();
	for (let edgeId in mapData.edges) {
		const edge = mapData.edges[edgeId];
		if (edge.from != null) {
			mapIds.add(edge.from);
		}

		if (edge.to != null) {
			mapIds.add(edge.to);
		}
	}

	return mapIds;
}

const CROSS = " ├─";
const CORNER = " └─";
const VERTICAL = " │ ";
const SPACE = "   ";

/**
 * @typedef {{ tree: string; mapCount: number; edgeCount: number; }} Output
 * @param {import('../src').MapData} data
 * @param {import('../src').MapEntry} map
 * @param {string} [indent]
 * @param {boolean} [isLast]
 * @returns {Output}
 */
function generateMapTree(
	data,
	map,
	output = { tree: "", mapCount: 0, edgeCount: 0 },
	indent = "",
	isLast = true
) {
	output.mapCount += 1;

	let line = indent;
	if (isLast) {
		line += CORNER;
		indent += SPACE;
	} else {
		line += CROSS;
		indent += VERTICAL;
	}

	if (map.edge) {
		output.edgeCount += 1;
		const edge = data.edges[map.edge];
		line += edgeToString(edge) + `\t[${map.id}]`;
	} else {
		line += map.id;
	}
	// console.log(line);
	output.tree += line + "\n";

	const children = map.children.map(
		(edgeId) => data.nodes[data.edges[edgeId].to]
	);
	for (const child of children) {
		generateMapTree(
			data,
			child,
			output,
			indent,
			children[children.length - 1] == child
		);
	}

	return output;
}

/**
 * @param {import('..').MapData} mapData
 * @param {import('..').MapEntry} map
 * @param {(map: import('..').MapEntry) => void} visitor
 */
function visitAllMaps(mapData, map, visitor) {
	visitor(map);
	if (map.children) {
		for (const edgeId of map.children) {
			const edge = mapData.edges[edgeId];
			const nextMap = mapData.nodes[edge.to];
			visitAllMaps(mapData, nextMap, visitor);
		}
	}
}
