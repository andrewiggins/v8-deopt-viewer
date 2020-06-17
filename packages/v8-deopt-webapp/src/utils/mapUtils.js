/**
 * @param {number} mapId
 * @returns {string}
 */
export function formatMapId(mapId) {
	return "0x" + mapId.toString(16).padStart(12, "0");
}
