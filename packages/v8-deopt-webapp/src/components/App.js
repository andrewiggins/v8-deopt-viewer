import { createElement, Fragment } from "preact";
import { Router, Route, useRoute } from "wouter-preact";
import { Summary } from "./Summary";
import { useHashLocation } from "../utils/useHashLocation";
import { FileViewer } from "./FileViewer";
import spectre from "../spectre.scss";
import styles from "./App.scss";

/**
 * @param {import('..').AppProps} props
 */
export function App({ deoptInfo }) {
	const files = Object.keys(deoptInfo);

	return (
		<Fragment>
			<Router hook={useHashLocation}>
				<Header />
				<Route path="/">
					<Summary deoptInfo={deoptInfo} />
				</Route>
				<Route path="/file/:fileId?/:entryId?">
					{(params) => (
						<FileViewer
							routeParams={{
								fileId: params.fileId || "0",
								entryId: params.entryId || null,
							}}
							fileDeoptInfo={deoptInfo[files[params.fileId || 0]]}
						/>
					)}
				</Route>
			</Router>
		</Fragment>
	);
}

function Header() {
	const [isRootRoute] = useRoute("/");

	return (
		<div
			class={[
				styles.pageHeader,
				(!isRootRoute && styles.subRoute) || null,
			].join(" ")}
		>
			<a href="#/" class={[spectre.btn, styles.backButton].join(" ")}>
				<i class={[spectre.icon, spectre["icon-back"]].join(" ")}></i>
			</a>
			<h1 class={styles.pageTitle}>V8 Deopt Viewer</h1>
		</div>
	);
}
