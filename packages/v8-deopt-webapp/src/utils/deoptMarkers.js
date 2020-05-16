import Prism from "prismjs";
import { sortEntries } from "v8-deopt-parser/src/sortEntries";
import { deoptMarker, sev1, sev2, sev3 } from "./deoptMarkers.scss";

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

		return element ? element.nextSibling : null;
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
 * @param {Markers} markers
 * @param {number} curLine
 * @param {number} curColumn
 */
function locHasMarker(markers, curLine, curColumn) {
	const nextMarker = markers[0];
	return (
		markers.length > 0 &&
		curLine == nextMarker.line &&
		curColumn >= nextMarker.column
	);
}

/**
 * @param {import('v8-deopt-parser').Entry} marker
 * @returns {HTMLElement}
 */
function createMarkerElement(fileId, marker) {
	const mark = document.createElement("mark");
	mark.textContent = getIcon(marker.type);

	const link = document.createElement("a");
	const linkId = `/file/${fileId}/${marker.id}`;
	const classes = [deoptMarker, severityClass(marker.severity)];
	if (location.hash == "#" + linkId) {
		classes.push("active");
		setTimeout(() => link.scrollIntoView(), 0);
	}

	link.id = linkId;
	link.href = "#" + link.id;
	link.className = classes.join(" ");
	link.appendChild(mark);

	return link;
}

/**
 * @param {Node} element
 * @param {Markers} markers
 * @param {number} curLine
 * @param {number} curColumn
 */
function consumeMarkers(element, fileId, markers, curLine, curColumn) {
	let refChild = element;
	while (locHasMarker(markers, curLine, curColumn)) {
		const marker = markers.shift();
		const lastMark = createMarkerElement(fileId, marker);

		element.parentNode.insertBefore(lastMark, refChild.nextSibling);
		refChild = lastMark;
	}

	return refChild;
}

/**
 * @typedef {Array<import('v8-deopt-parser').Entry>} Markers
 * @param {import('..').V8DeoptInfoWithSources} deoptInfo
 * @returns {Markers}
 */
function getMarkers(deoptInfo) {
	return sortEntries([
		...deoptInfo.codes,
		...deoptInfo.deopts,
		...deoptInfo.ics,
	]);
}

/**
 * @param {HTMLElement} root
 * @param {string} fileId
 * @param {import('..').V8DeoptInfoWithSources} deoptInfo
 */
export function addDeoptMarkers(root, fileId, deoptInfo) {
	const markers = getMarkers(deoptInfo);

	/** @type {Node} */
	let element = root.firstChild;
	let curLine = 1;
	let curColumn = 1;
	while (element) {
		if (element.nodeType == 3 /* TEXT_NODE */) {
			// @ts-ignore
			const text = element.data;

			// Handle of text node contains multiple lines
			// Inserting markers in the middle of a text node doesn't work since that would
			// require parsing the text into tokens, which is what we assume has already happened
			const lines = text.split("\n");
			for (let i = 0; i < lines.length; i++) {
				if (i > 0) {
					curLine += 1;
					curColumn = 1;
				}

				const line = lines[i];
				curColumn += line.length;

				if (locHasMarker(markers, curLine, curColumn)) {
					const lastMark = consumeMarkers(
						element,
						fileId,
						markers,
						curLine,
						curColumn
					);

					element = nextElement(lastMark, root);
				}
			}
		}

		element = nextElement(element, root);
	}
}

function severityClass(severity) {
	if (severity == 1) {
		return sev1;
	} else if (severity == 2) {
		return sev2;
	} else {
		return sev3;
	}
}
