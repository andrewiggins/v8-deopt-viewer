import test from "tape";
import { runParser, writeSnapshot } from "./helpers.js";
import { validateMapData, writeMapSnapshot } from "./traceMapsHelpers.js";

test("runParser(html-inline.traceMaps.v8.log)", async (t) => {
	const logFileName = "html-inline.traceMaps.v8.log";
	const result = await runParser(t, logFileName);

	t.equal(result.codes.length, 15, "Number of codes");
	t.equal(result.deopts.length, 6, "Number of deopts");
	t.equal(result.ics.length, 33, "Number of ics");

	const mapEntryIds = Object.keys(result.maps.nodes);
	t.equal(mapEntryIds.length, 46, "Number of map entries");

	const mapEdgeIds = Object.keys(result.maps.edges);
	t.equal(mapEdgeIds.length, 43, "Number of map edges");

	validateMapData(t, result);

	await writeSnapshot(logFileName, result);
	await writeMapSnapshot(logFileName, result);
});

test("runParser(html-external.traceMaps.v8.log)", async (t) => {
	const logFileName = "html-external.traceMaps.v8.log";
	const result = await runParser(t, logFileName);

	t.equal(result.codes.length, 16, "Number of codes");
	t.equal(result.deopts.length, 6, "Number of deopts");
	t.equal(result.ics.length, 33, "Number of ics");

	const mapEntryIds = Object.keys(result.maps.nodes);
	t.equal(mapEntryIds.length, 46, "Number of map entries");

	const mapEdgeIds = Object.keys(result.maps.edges);
	t.equal(mapEdgeIds.length, 43, "Number of map edges");

	validateMapData(t, result);

	await writeSnapshot(logFileName, result);
	await writeMapSnapshot(logFileName, result);
});
