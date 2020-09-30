/**
 * @param {string} mapId
 * @returns {string}
 */
export function formatMapId(mapId) {
	// return "0x" + mapId.padStart(12, "0");
	return mapId; // Don't do any formatting for now
}

/**
 * @param {import('v8-deopt-parser').MapData} mapData
 */
export function hasMapData(mapData) {
	return (
		Object.keys(mapData.nodes).length > 0 &&
		Object.keys(mapData.edges).length > 0
	);
}
