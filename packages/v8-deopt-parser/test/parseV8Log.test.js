import test from "tape";
import {
	runParser,
	writeSnapshot,
	validateEntry,
	repoRoot,
	repoFileURL,
} from "./helpers.js";
import { expectedICSLogs } from "./constants.js";

test("runParser(adders.v8.log)", async (t) => {
	const logFileName = "adders.v8.log";
	const result = await runParser(t, logFileName);

	t.equal(result.codes.length, 16, "Number of codes");
	t.equal(result.deopts.length, 7, "Number of deopts");
	t.equal(result.ics.length, 33, "Number of ics");

	validateEntry(t, "Matching ICS Entry", result.ics, expectedICSLogs.adders);

	validateEntry(t, "Matching Deopt entry", result.deopts, {
		type: "deopts",
		id: "331",
		functionName: "addObjects",
		file: repoRoot("examples/simple/adders.js"),
		line: 137,
		column: 28,
		severity: 3,
		updates: [
			{
				timestamp: 496191,
				bailoutType: "eager",
				deoptReason: "wrong call target",
				optimizationState: "optimized",
				inlined: false,
				severity: 3,
				inlinedAt: undefined,
			},
		],
	});

	validateEntry(t, "Matching Code entry", result.codes, {
		type: "codes",
		id: "309",
		functionName: "addNumbers",
		file: repoRoot("examples/simple/adders.js"),
		line: 80,
		column: 20,
		isScript: false,
		severity: 1,
		updates: [
			{
				timestamp: 66399,
				state: "optimizable",
				severity: 2,
			},
			{
				timestamp: 72377,
				state: "optimized",
				severity: 1,
			},
		],
	});

	validateEntry(t, "Matching Sev 3 Code entry", result.codes, {
		type: "codes",
		id: "311",
		functionName: "addAny",
		file: repoRoot("examples/simple/adders.js"),
		line: 90,
		column: 16,
		isScript: false,
		severity: 3,
		updates: [
			{
				timestamp: 66479,
				state: "optimizable",
				severity: 2,
			},
			{
				timestamp: 74392,
				state: "optimized",
				severity: 1,
			},
			{
				timestamp: 336092,
				state: "optimized",
				severity: 1,
			},
			{
				timestamp: 382580,
				state: "optimized",
				severity: 3,
			},
			{
				timestamp: 457017,
				state: "optimized",
				severity: 3,
			},
			{
				timestamp: 497892,
				state: "optimized",
				severity: 3,
			},
			{
				timestamp: 562240,
				state: "optimized",
				severity: 3,
			},
			{
				timestamp: 624110,
				state: "optimized",
				severity: 3,
			},
		],
	});

	await writeSnapshot(logFileName, result);
});

test("runParser(two-modules.v8.log)", async (t) => {
	const logFileName = "two-modules.v8.log";
	const result = await runParser(t, logFileName);

	t.equal(result.codes.length, 16, "Number of codes");
	t.equal(result.deopts.length, 7, "Number of deopts");
	t.equal(result.ics.length, 33, "Number of ics");

	validateEntry(
		t,
		"Matching ICS Entry",
		result.ics,
		expectedICSLogs["two-modules"]
	);

	validateEntry(t, "Matching Deopt entry", result.deopts, {
		type: "deopts",
		id: "337",
		functionName: "addObjects",
		file: repoRoot("examples/two-modules/adders.js"),
		line: 82,
		column: 28,
		severity: 3,
		updates: [
			{
				timestamp: 514196,
				bailoutType: "eager",
				deoptReason: "wrong call target",
				optimizationState: "optimized",
				inlined: false,
				severity: 3,
				inlinedAt: undefined,
			},
		],
	});

	validateEntry(t, "Matching Code entry", result.codes, {
		type: "codes",
		id: "315",
		functionName: "addNumbers",
		file: repoRoot("examples/two-modules/adders.js"),
		line: 25,
		column: 20,
		isScript: false,
		severity: 1,
		updates: [
			{
				timestamp: 64640,
				state: "optimizable",
				severity: 2,
			},
			{
				timestamp: 71657,
				state: "optimized",
				severity: 1,
			},
		],
	});

	await writeSnapshot(logFileName, result);
});

test("runParser(html-inline.v8.log)", async (t) => {
	const logFileName = "html-inline.v8.log";
	const result = await runParser(t, logFileName);

	t.equal(result.codes.length, 15, "Number of codes");
	t.equal(result.deopts.length, 6, "Number of deopts");
	t.equal(result.ics.length, 33, "Number of ics");

	validateEntry(
		t,
		"Matching ICS Entry",
		result.ics,
		expectedICSLogs["html-inline"]
	);

	validateEntry(t, "Matching Deopt entry", result.deopts, {
		type: "deopts",
		id: "26",
		functionName: "addObjects",
		file: repoFileURL("examples/html-inline/adders.html"),
		line: 142,
		column: 34,
		severity: 3,
		updates: [
			{
				timestamp: 645553,
				bailoutType: "eager",
				deoptReason: "wrong call target",
				optimizationState: "optimized",
				inlined: false,
				severity: 3,
				inlinedAt: undefined,
			},
		],
	});

	validateEntry(t, "Matching Code entry", result.codes, {
		type: "codes",
		id: "2",
		functionName: "addNumbers",
		file: repoFileURL("examples/html-inline/adders.html"),
		line: 85,
		column: 26,
		isScript: false,
		severity: 1,
		updates: [
			{
				timestamp: 235580,
				state: "optimizable",
				severity: 2,
			},
			{
				timestamp: 280422,
				state: "optimized",
				severity: 1,
			},
		],
	});

	await writeSnapshot(logFileName, result);
});

test("runParser(html-external.v8.log)", async (t) => {
	const logFileName = "html-external.v8.log";
	const result = await runParser(t, logFileName);

	t.equal(result.codes.length, 16, "Number of codes");
	t.equal(result.deopts.length, 6, "Number of deopts");
	t.equal(result.ics.length, 33, "Number of ics");

	validateEntry(
		t,
		"Matching ICS Entry",
		result.ics,
		expectedICSLogs["html-external"]
	);

	validateEntry(t, "Matching Deopt entry", result.deopts, {
		type: "deopts",
		id: "27",
		functionName: "addObjects",
		file: repoFileURL("examples/html-external/adders.js"),
		line: 82,
		column: 28,
		severity: 3,
		updates: [
			{
				timestamp: 322375,
				bailoutType: "eager",
				deoptReason: "wrong call target",
				optimizationState: "optimized",
				inlined: false,
				severity: 3,
				inlinedAt: undefined,
			},
		],
	});

	validateEntry(t, "Matching Code entry", result.codes, {
		type: "codes",
		id: "4",
		functionName: "addNumbers",
		file: repoFileURL("examples/html-external/adders.js"),
		line: 25,
		column: 20,
		isScript: false,
		severity: 1,
		updates: [
			{
				timestamp: 62089,
				state: "optimizable",
				severity: 2,
			},
			{
				timestamp: 72774,
				state: "optimized",
				severity: 1,
			},
		],
	});

	await writeSnapshot(logFileName, result);
});

test("runParser(adders.v8.log, keepInternals)", async (t) => {
	const logFileName = "adders.v8.log";
	const result = await runParser(t, logFileName, { keepInternals: true });

	t.equal(result.codes.length, 253, "Number of codes");
	t.equal(result.deopts.length, 7, "Number of deopts");
	t.equal(result.ics.length, 182, "Number of ics");
});

test("runParser(adders.node16.v8.log, keepInternals)", async (t) => {
	const logFileName = "adders.node16.v8.log";
	const result = await runParser(t, logFileName, { keepInternals: true });

	t.equal(result.codes.length, 251, "Number of codes");
	t.equal(result.deopts.length, 0, "Number of deopts");
	t.equal(result.ics.length, 112, "Number of ics");
});

test("runParser(two-modules.v8.log, keepInternals)", async (t) => {
	const logFileName = "two-modules.v8.log";
	const result = await runParser(t, logFileName, { keepInternals: true });

	t.equal(result.codes.length, 254, "Number of codes");
	t.equal(result.deopts.length, 7, "Number of deopts");
	t.equal(result.ics.length, 187, "Number of ics");
});

test("runParser(html-inline.v8.log, keepInternals)", async (t) => {
	const logFileName = "html-inline.v8.log";
	const result = await runParser(t, logFileName, { keepInternals: true });

	t.equal(result.codes.length, 15, "Number of codes");
	t.equal(result.deopts.length, 6, "Number of deopts");
	t.equal(result.ics.length, 33, "Number of ics");
});

test("runParser(html-external.v8.log, keepInternals)", async (t) => {
	const logFileName = "html-external.v8.log";
	const result = await runParser(t, logFileName, { keepInternals: true });

	t.equal(result.codes.length, 16, "Number of codes");
	t.equal(result.deopts.length, 6, "Number of deopts");
	t.equal(result.ics.length, 33, "Number of ics");
});
