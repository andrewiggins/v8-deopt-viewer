import { generateV8Log } from "../src/index.js";

const options = { logFilePath: "v8.log" };

// generateV8Log("..\\..\\..\\examples\\simple\\adders.js", options);
generateV8Log("..\\..\\..\\examples\\html-inline\\adders.html", options);
