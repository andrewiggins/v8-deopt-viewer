import { createElement, Fragment } from "preact";
import {
	CodeTableHeaders,
	SeverityTableHeaders,
	SeverityTableSummary,
} from "./SummaryTable";
import spectre from "../spectre.scss";
import styles from "./SummaryList.scss";

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
			<div class={styles.globalHeaders}></div>
			<ul class={styles.summaryList}>
				{Object.keys(perFileStats).map((fileName) => {
					const summaryInfo = perFileStats[fileName];

					return (
						<li>
							<div>
								<a>{deoptInfo[fileName].relativePath}</a>
							</div>
							<InlineSeverityTable
								class={styles.codes}
								caption="Optimizations"
								severities={summaryInfo.codes}
								header={<CodeTableHeaders />}
							/>
							<InlineSeverityTable
								class={styles.deopts}
								caption="Deoptimizations"
								severities={summaryInfo.deopts}
								header={<SeverityTableHeaders />}
							/>
							<InlineSeverityTable
								class={styles.ics}
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
		<table class={[props.class, styles.severityTable, spectre.table].join(" ")}>
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
