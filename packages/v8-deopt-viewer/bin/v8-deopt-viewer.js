#!/usr/bin/env node

import * as path from "path";
import sade from "sade";
import run from "../src/index.js";

sade("v8-deopt-viewer [file]", true)
	.describe(
		"Generate and view deoptimizations in JavaScript code running in V8"
	)
	.example("examples/simple/adder.js")
	.example("examples/html-inline/adders.html -o /tmp/directory")
	.example("https://google.com")
	.example("-i v8.log")
	.example("-i v8.log -o /tmp/directory")
	.option("-i --input", "Path to an already generated v8.log file")
	.option(
		"-o --out",
		"The directory to output files too",
		path.join(process.cwd(), "v8-deopt-viewer")
	)
	.option(
		"-t --timeout",
		"How long in milliseconds to keep the browser open while the webpage runs",
		5e3
	)
	.option(
		"--keep-internals",
		"Don't remove NodeJS internals from the log",
		false
	)
	.option("--skip-maps", "Skip tracing internal maps of V8", false)
	.option("--open", "Open the resulting webapp in a web browser", false)
	.action(run)
	.parse(process.argv);
