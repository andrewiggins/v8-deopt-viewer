import { Fragment } from "preact";
import { useMemo } from "preact/hooks";
// import { SummaryList } from "./SummaryList.jsx";
import { SummaryTable } from "./SummaryTable.jsx";

/**
 * @typedef {[number, number, number]} SeveritySummary
 * @typedef {{ codes: SeveritySummary; deopts: SeveritySummary; ics: SeveritySummary }} FileSeverities
 * @typedef {Record<string, FileSeverities>} PerFileStats
 * @param {import('..').AppProps["deoptInfo"]} deoptInfo
 * @returns {PerFileStats}
 */
function getPerFileStats(deoptInfo) {
	/** @type {PerFileStats} */
	const results = {};

	const files = Object.keys(deoptInfo.files);
	for (let fileName of files) {
		const fileDepotInfo = deoptInfo.files[fileName];
		results[fileName] = {
			codes: [0, 0, 0],
			deopts: [0, 0, 0],
			ics: [0, 0, 0],
		};

		for (let kind of ["codes", "deopts", "ics"]) {
			const entries = fileDepotInfo[kind];
			for (let entry of entries) {
				results[fileName][kind][entry.severity - 1]++;
			}
		}
	}

	return results;
}

/**
 * @typedef {{ deoptInfo: import('..').PerFileDeoptInfoWithSources; perFileStats: PerFileStats }} SummaryProps
 * @param {import('..').AppProps} props
 */
export function Summary({ deoptInfo }) {
	const perFileStats = useMemo(() => getPerFileStats(deoptInfo), [deoptInfo]);

	return (
		<Fragment>
			{/* <SummaryList deoptInfo={deoptInfo} perFileStats={perFileStats} /> */}
			<SummaryTable deoptInfo={deoptInfo} perFileStats={perFileStats} />
		</Fragment>
	);
}
