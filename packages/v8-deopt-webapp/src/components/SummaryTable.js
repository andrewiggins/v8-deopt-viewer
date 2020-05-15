import { createElement, Fragment } from "preact";
import {
	table,
	table_scroll,
	table_striped,
	table_hover,
} from "../spectre.scss";
import styles from "./SummaryTable.scss";

/**
 * @param {import('./Summary').SummaryProps} props
 */
export function SummaryTable({ deoptInfo, perFileStats }) {
	return (
		<table
			class={[
				styles.summaryTable,
				styles.grid,
				table,
				table_scroll,
				table_striped,
				table_hover,
			].join(" ")}
		>
			<thead>
				<tr class={styles.headers}>
					<th>File</th>
					<th class={styles.codes} colspan="3">
						Optimizations
					</th>
					<th class={styles.deopts} colspan="3">
						Deoptimizations
					</th>
					<th class={styles.ics} colspan="3">
						Inline Caches
					</th>
				</tr>
				<tr class={styles.subheaders}>
					<th></th>
					<CodeTableHeaders class={styles.codes} />
					<SeverityTableHeaders class={styles.deopts} />
					<SeverityTableHeaders class={styles.ics} />
				</tr>
			</thead>
			<tbody>
				{Object.keys(perFileStats).map((fileName, i) => {
					const summaryInfo = perFileStats[fileName];

					return (
						<tr class={styles.fileRow} key={fileName}>
							<td class={styles.fileName}>
								<a href={`#/file/${i}`}>{deoptInfo[fileName].relativePath}</a>
							</td>
							<SeverityTableSummary
								class={styles.codes}
								severities={summaryInfo.codes}
							/>
							<SeverityTableSummary
								class={styles.deopts}
								severities={summaryInfo.deopts}
							/>
							<SeverityTableSummary
								class={styles.ics}
								severities={summaryInfo.ics}
							/>
						</tr>
					);
				})}
			</tbody>
		</table>
	);
}

export function CodeTableHeaders(props) {
	return (
		<Fragment>
			<th class={props.class}>Optimized</th>
			<th class={props.class}>Optimizable</th>
			<th class={props.class}>Sev 3</th>
		</Fragment>
	);
}

export function SeverityTableHeaders(props) {
	return (
		<Fragment>
			<th class={props.class}>Sev 1</th>
			<th class={props.class}>Sev 2</th>
			<th class={props.class}>Sev 3</th>
		</Fragment>
	);
}

export function SeverityTableSummary(props) {
	return (
		<Fragment>
			{props.severities.map((severityCount, i) => {
				return (
					<td
						class={[
							props.class,
							severityCount > 0 ? severityClass(i + 1) : null,
						].join(" ")}
					>
						{severityCount}
					</td>
				);
			})}
		</Fragment>
	);
}

function severityClass(severity) {
	if (severity == 1) {
		return styles.sev1;
	} else if (severity == 2) {
		return styles.sev2;
	} else {
		return styles.sev3;
	}
}
