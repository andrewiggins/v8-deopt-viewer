import { generateV8Log } from "../src/index.js";

const options = { logFilePath: "v8.log" };

const remoteUrl =
	// "https://js-framework-tachometer.netlify.app/frameworks/keyed/preact/benches/03_update10th1k_x16.html";
	// "https://js-framework-tachometer.netlify.app/frameworks/keyed/preact/benches/02_replace1k.html";
	"https://preactjs.com/";

// generateV8Log("..\\..\\..\\examples\\simple\\adders.js", options);
// generateV8Log("..\\..\\..\\examples\\html-inline\\adders.html", options);
generateV8Log(remoteUrl, options);
// generateV8Log(remoteUrl, { ...options, browserTimeoutMs: 20e3 });
