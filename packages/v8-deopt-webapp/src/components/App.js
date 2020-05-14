import { createElement } from "preact";
import { SummaryTable } from "./SummaryTable";

/**
 * @param {import('..').AppProps} props
 */
export function App({ deoptInfo }) {
	return <SummaryTable deoptInfo={deoptInfo} />;
}
