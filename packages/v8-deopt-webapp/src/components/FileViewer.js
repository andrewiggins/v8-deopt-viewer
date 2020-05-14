import { createElement } from "preact";
import { DeoptsList } from "./DeoptsList";
import { CodePanel } from "./CodePanel";

/**
 * @param {{ fileDeoptInfo: import('..').V8DeoptInfoWithSources }} props
 */
export function FileViewer({ fileDeoptInfo }) {
	return (
		<div>
			<CodePanel fileDeoptInfo={fileDeoptInfo} />
			<DeoptsList fileDeoptInfo={fileDeoptInfo} />
		</div>
	);
}
