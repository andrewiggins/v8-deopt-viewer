import { Fragment } from "preact";
import {
	table,
	table_scroll,
	table_striped,
	table_hover,
} from "../spectre.module.scss";
import {
	summaryTable,
	grid,
	headers,
	codes,
	deopts,
	ics,
	subheaders,
	fileName as fileNameClass,
	sev1,
	sev2,
	sev3,
} from "./SummaryTable.module.scss";

/**
 * @param {import('./Summary').SummaryProps} props
 */
export function SummaryTable({ deoptInfo, perFileStats }) {
	return (
		<table
			class={[
				summaryTable,
				grid,
				table,
				table_scroll,
				table_striped,
				table_hover,
			].join(" ")}
		>
			<thead>
				<tr class={headers}>
					<th>File</th>
					<th class={codes} colSpan={3}>
						Optimizations
					</th>
					<th class={deopts} colSpan={3}>
						Deoptimizations
					</th>
					<th class={ics} colSpan={3}>
						Inline Caches
					</th>
				</tr>
				<tr class={subheaders}>
					<th></th>
					<CodeTableHeaders class={codes} />
					<SeverityTableHeaders class={deopts} />
					<SeverityTableHeaders class={ics} />
				</tr>
			</thead>
			<tbody>
				{Object.keys(perFileStats).map((fileName, i) => {
					const summaryInfo = perFileStats[fileName];

					return (
						<tr key={fileName}>
							<td class={fileNameClass}>
								<a href={`#/file/${i}/codes`} title={fileName}>
									{deoptInfo.files[fileName].relativePath}
								</a>
							</td>
							<SeverityTableSummary
								class={codes}
								severities={summaryInfo.codes}
							/>
							<SeverityTableSummary
								class={deopts}
								severities={summaryInfo.deopts}
							/>
							<SeverityTableSummary class={ics} severities={summaryInfo.ics} />
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
