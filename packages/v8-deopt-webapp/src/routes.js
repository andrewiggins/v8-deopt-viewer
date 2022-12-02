/** @type {import('./').Route<"/", []>} */
export const summaryRoute = {
	id: "summary",
	route: "/",
	getHref() {
		return "#" + this.route;
	},
};

/** @type {import('./').Route<"/file/:fileId/:tabId?/:path*", [number?, string?]>} */
export const fileRoute = {
	id: "file",
	route: "/file/:fileId/:tabId?/:path*",
	getHref(fileId, tabId) {
		let url = "#/file/";
		if (fileId) {
			url += fileId + "/";

			if (tabId) {
				url += tabId + "/";
			}
		}

		return url;
	},
};

/** @type {import('./').Route<"/file/:fileId/codes/:entryId?", [number, string?]>} */
export const codeRoute = {
	id: "codes",
	title: "Optimizations",
	route: "/file/:fileId/codes/:entryId?",
	getHref(fileId, entryId = "") {
		return `#/file/${fileId}/codes/${entryId}`;
	},
};

/** @type {import('./').Route<"/file/:fileId/deopts/:entryId?", [number, string?]>} */
export const deoptsRoute = {
	id: "deopts",
	title: "Deoptimizations",
	route: "/file/:fileId/deopts/:entryId?",
	getHref(fileId, entryId = "") {
		return `#/file/${fileId}/deopts/${entryId}`;
	},
};

/** @type {import('./').Route<"/file/:fileId/ics/:entryId?", [number, string?]>} */
export const icsRoute = {
	id: "ics",
	title: "Inline Caches",
	route: "/file/:fileId/ics/:entryId?",
	getHref(fileId, entryId = "") {
		return `#/file/${fileId}/ics/${entryId}`;
	},
};

/** @type {import('./').Route<"/file/:fileId/maps/:grouping?/:groupValue?/:mapId?", [number, string?, string?, string?]>} */
export const mapsRoute = {
	id: "maps",
	title: "Map Explorer",
	route: "/file/:fileId/maps/:grouping?/:groupValue?/:mapId?",
	getHref(fileId, grouping, groupValue, mapId) {
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
