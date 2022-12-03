import assert from "node:assert";
import test from "node:test";
import { runParser, writeSnapshot } from "./helpers.js";
import { validateMapData, writeMapSnapshot } from "./traceMapsHelpers.js";

test("runParser(html-inline.traceMaps.v8.log)", async () => {
	const logFileName = "html-inline.traceMaps.v8.log";
	const result = await runParser(logFileName);

	assert.equal(result.codes.length, 15, "Number of codes");
	assert.equal(result.deopts.length, 6, "Number of deopts");
	assert.equal(result.ics.length, 33, "Number of ics");

	const mapEntryIds = Object.keys(result.maps.nodes);
	assert.equal(mapEntryIds.length, 38, "Number of map entries");

	const mapEdgeIds = Object.keys(result.maps.edges);
	assert.equal(mapEdgeIds.length, 35, "Number of map edges");

	await writeSnapshot(logFileName, result);
	await writeMapSnapshot(logFileName, result);
	validateMapData(assert, result);
});

test("runParser(html-external.traceMaps.v8.log)", async () => {
	const logFileName = "html-external.traceMaps.v8.log";
	const result = await runParser(logFileName);

	assert.equal(result.codes.length, 16, "Number of codes");
	assert.equal(result.deopts.length, 6, "Number of deopts");
	assert.equal(result.ics.length, 33, "Number of ics");

	const mapEntryIds = Object.keys(result.maps.nodes);
	assert.equal(mapEntryIds.length, 38, "Number of map entries");

	const mapEdgeIds = Object.keys(result.maps.edges);
	assert.equal(mapEdgeIds.length, 35, "Number of map edges");

	await writeSnapshot(logFileName, result);
	await writeMapSnapshot(logFileName, result);
	validateMapData(assert, result);
});

test("runParser(adders.traceMaps.v8.log)", async () => {
	const logFileName = "adders.traceMaps.v8.log";
	const result = await runParser(logFileName);

	assert.equal(result.codes.length, 16, "Number of codes");
	assert.equal(result.deopts.length, 7, "Number of deopts");
	assert.equal(result.ics.length, 34, "Number of ics");

	const mapEntryIds = Object.keys(result.maps.nodes);
	assert.equal(mapEntryIds.length, 38, "Number of map entries");

	const mapEdgeIds = Object.keys(result.maps.edges);
	assert.equal(mapEdgeIds.length, 35, "Number of map edges");

	await writeSnapshot(logFileName, result);
	await writeMapSnapshot(logFileName, result);
	validateMapData(assert, result);
});
