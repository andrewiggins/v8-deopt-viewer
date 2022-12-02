import { Fragment } from "preact";
import {
	CodeTableHeaders,
	SeverityTableHeaders,
	SeverityTableSummary,
} from "./SummaryTable.jsx";
import { table } from "../spectre.module.scss";
import {
	globalHeaders,
	summaryList,
	codes,
	deopts,
	ics,
	severityTable,
} from "./SummaryList.module.scss";

// TODO:
// - Consider putting each file into a Spectre Panel.
// - Consider using Panel tabs for each of the classifications. Maybe make the list a two column "field: value" list
//   but current header text is too big for Panel tabs

/**
 * @param {import('./Summary').SummaryProps} props
 */
export function SummaryList({ deoptInfo, perFileStats }) {
	return (
		<Fragment>
			<div class={globalHeaders}></div>
			<ul class={summaryList}>
				{Object.keys(perFileStats).map((fileName, i) => {
					const summaryInfo = perFileStats[fileName];

					return (
						<li key={fileName}>
							<div>
								<a href={`#/file/${i}`}>{deoptInfo[fileName].relativePath}</a>
							</div>
							<InlineSeverityTable
								class={codes}
								caption="Optimizations"
								severities={summaryInfo.codes}
								header={<CodeTableHeaders />}
							/>
							<InlineSeverityTable
								class={deopts}
								caption="Deoptimizations"
								severities={summaryInfo.deopts}
								header={<SeverityTableHeaders />}
							/>
							<InlineSeverityTable
								class={ics}
								caption="Inline Caches"
								severities={summaryInfo.ics}
								header={<SeverityTableHeaders />}
							/>
						</li>
					);
				})}
			</ul>
		</Fragment>
	);
}

function InlineSeverityTable(props) {
	return (
		<table class={[props.class, severityTable, table].join(" ")}>
			<caption>{props.caption}</caption>
			<thead>
				<tr>{props.header}</tr>
			</thead>
			<tbody>
				<tr>
					<SeverityTableSummary severities={props.severities} />
				</tr>
			</tbody>
		</table>
	);
}
