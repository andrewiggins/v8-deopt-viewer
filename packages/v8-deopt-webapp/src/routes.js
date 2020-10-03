/** @type {import('./').Route<[]>} */
export const summaryRoute = {
	id: "summary",
	route: "/",
	getHref() {
		return "#" + this.route;
	},
};

/** @type {import('./').Route<[number]>} */
export const fileRoute = {
	id: "file",
	route: "/file/:fileId/:path*",
	getHref(fileId = null) {
		return `#/file/${fileId ? fileId : ""}`;
	},
};

/** @type {import('./').Route<[number, string?]>} */
export const codeRoute = {
	id: "codes",
	title: "Optimizations",
	route: "/file/:fileId/codes/:entryId?",
	getHref(fileId, entryId = "") {
		return `#/file/${fileId}/codes/${entryId}`;
	},
};

/** @type {import('./').Route<[number, string?]>} */
export const deoptsRoute = {
	id: "deopts",
	title: "Deoptimizations",
	route: "/file/:fileId/deopts/:entryId?",
	getHref(fileId, entryId = "") {
		return `#/file/${fileId}/deopts/${entryId}`;
	},
};

/** @type {import('./').Route<[number, string?]>} */
export const icsRoute = {
	id: "ics",
	title: "Inline Caches",
	route: "/file/:fileId/ics/:entryId?",
	getHref(fileId, entryId = "") {
		return `#/file/${fileId}/ics/${entryId}`;
	},
};

/** @type {import('./').Route<[number, string?, string?, string?]>} */
export const mapsRoute = {
	id: "maps",
	title: "Map Explorer",
	route: "/file/:fileId/maps/:grouping?/:groupValue?/:mapId?",
	getHref(fileId, grouping = null, groupValue = null, mapId = null) {
		let url = `#/file/${fileId}/maps/`;
		// Only add subsequent paths if parent path is provided
		if (grouping) {
			url += encodeURIComponent(grouping) + "/";

			if (groupValue) {
				url += encodeURIComponent(groupValue) + "/";

				if (mapId) {
					url += encodeURIComponent(mapId);
				}
			}
		}

		return url;
	},
};
