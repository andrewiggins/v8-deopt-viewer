import { sortEntries } from "v8-deopt-parser/src/sortEntries.js";
import { codeRoute, deoptsRoute, icsRoute } from "../routes.js";
import { deoptMarker, sev1, sev2, sev3 } from "./deoptMarkers.module.scss";

const DEBUG = location.search.includes("debug");

/**
 * @param {Node} element
 * @param {Node} root
 */
function nextElement(element, root) {
	if (element == root) {
		return null;
	} else if (element.firstChild) {
		return element.firstChild;
	} else if (element.nextSibling) {
		return element.nextSibling;
	} else {
		do {
			element = element.parentNode;
		} while (element && element != root && !element.nextSibling);

		return element === root ? null : element.nextSibling;
	}
}

/**
 * @param {import('v8-deopt-parser').Entry["type"]} type
 */
function getIcon(type) {
	if (type == "codes") {
		return "▲";
	} else if (type == "deopts") {
		return "▼";
	} else {
		return "☎";
	}
}

/**
 * @param {Entries} entries
 * @param {number} curLine
 * @param {number} curColumn
 */
function locHasMarker(entries, curLine, curColumn) {
	const nextEntry = entries[0];
	return (
		entries.length > 0 &&
		curLine == nextEntry.line &&
		curColumn >= nextEntry.column
	);
}

/**
 * @param {Entry} entry
 */
export function getMarkerId(entry) {
	return `${entry.type}-${entry.id}`;
}

const routes = {
	codes: codeRoute,
	deopts: deoptsRoute,
	ics: icsRoute,
};

/**
 * @typedef {HTMLAnchorElement} Marker
 * @param {number} fileId
 * @param {import('v8-deopt-parser').Entry} entry
 * @returns {Marker}
 */
function createMarkerElement(fileId, entry) {
	const mark = document.createElement("mark");
	mark.textContent = getIcon(entry.type);

	const marker = document.createElement("a");
	const href = routes[entry.type].getHref(fileId, entry.id);
	const classes = [deoptMarker, severityClass(entry.severity)];
	if (location.hash == href) {
		classes.push("active");
		setTimeout(() => marker.scrollIntoView(), 0);
	}

	marker.id = getMarkerId(entry);
	marker.href = href;
	marker.className = classes.join(" ");
	marker.appendChild(mark);

	return marker;
}

/**
 * @param {Node} element
 * @param {number} fileId
 * @param {Entries} entries
 * @param {Marker[]} markers
 * @param {number} curLine
 * @param {number} curColumn
 */
function consumeEntries(element, fileId, entries, markers, curLine, curColumn) {
	let refChild = element;
	while (locHasMarker(entries, curLine, curColumn)) {
		const entry = entries.shift();
		const lastMark = createMarkerElement(fileId, entry);
		markers.push(lastMark);

		element.parentNode.insertBefore(lastMark, refChild.nextSibling);
		refChild = lastMark;
	}

	return refChild;
}

/**
 * @typedef {import('v8-deopt-parser').Entry} Entry
 * @typedef {Entry[]} Entries
 * @param {import('..').FileV8DeoptInfoWithSources} deoptInfo
 * @returns {Entries}
 */
function getEntries(deoptInfo) {
	return sortEntries([
		...deoptInfo.codes,
		...deoptInfo.deopts,
		...deoptInfo.ics,
	]);
}

/**
 * @param {HTMLElement} root
 * @param {number} fileId
 * @param {import('..').FileV8DeoptInfoWithSources} deoptInfo
 * @returns {Marker[]}
 */
export function addDeoptMarkers(root, fileId, deoptInfo) {
	/** @type {Marker[]} */
	const markers = [];
	const entries = getEntries(deoptInfo);

	let code = "";
	let fullText = DEBUG ? root.textContent : "";

	/** @type {Node} */
	let element = root.firstChild;
	let curLine = 1;
	let curColumn = 1;
	while (element) {
		if (element.nodeType == 3 /* TEXT_NODE */) {
			// @ts-ignore
			const text = element.data;
			if (DEBUG) {
				code += text;
			}

			// Handle of text node contains multiple lines
			// Inserting markers in the middle of a text node doesn't work since that would
			// require parsing the text into tokens, which is what we assume has already happened
			const lines = text.split("\n");
			for (let i = 0; i < lines.length; i++) {
				if (i > 0) {
					// Reached end of line
					if (DEBUG) {
						validateLoc(curLine, curColumn, fullText, element, root);
					}

					curLine += 1;
					curColumn = 1;
				}

				const line = lines[i];
				curColumn += line.length;

				if (locHasMarker(entries, curLine, curColumn)) {
					element = consumeEntries(
						element,
						fileId,
						entries,
						markers,
						curLine,
						curColumn
					);

					// Set element to the deepest last child of the marker
					while (element.lastChild != null) {
						element = element.lastChild;
					}
				}
			}
		}

		element = nextElement(element, root);
	}

	if (DEBUG) {
		console.log("code == fullText:", code == fullText);
	}

	return markers;
}

function severityClass(severity) {
	if (severity < 1) {
		return null;
	} else if (severity == 1) {
		return sev1;
	} else if (severity == 2) {
		return sev2;
	} else {
		return sev3;
	}
}

/**
 * @param {number} lineCount
 * @param {number} columnCount
 * @param {string} fullText
 * @param {Node} element
 * @param {HTMLElement} root
 */
function validateLoc(lineCount, columnCount, fullText, element, root) {
	const lineLengths = fullText.split("\n").map((l) => l.length);
	const expectedColCount = lineLengths[lineCount - 1] + 1;
	if (!root.contains(element)) {
		console.error(
			"Element is not inside root.",
			"Root:",
			root,
			"Element:",
			element
		);
	}

	if (expectedColCount !== columnCount) {
		console.error(`${lineCount}:`, expectedColCount, columnCount);
	}
}
