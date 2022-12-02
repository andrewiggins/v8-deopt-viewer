import assert from "node:assert";
import test from "node:test";
import { determineCommonRoot } from "../src/determineCommonRoot.js";

test("determineCommonRoot(absolute paths)", () => {
	// Windows paths
	let result = determineCommonRoot([
		"C:\\a\\b\\c2\\d\\e",
		"C:\\a\\b\\c2\\f\\g",
		"C:\\a\\b\\c",
		"C:\\a\\b\\c\\",
	]);
	assert.equal(result, "C:\\a\\b\\", "Windows paths");

	// Single path
	result = determineCommonRoot(["C:\\a\\b\\c\\d\\e"]);
	assert.equal(result, "C:\\a\\b\\c\\d\\", "Single path");

	// Linux paths with ending '/'
	result = determineCommonRoot(["/a/b/c2/d/e/", "/a/b/c/", "/a/b/c2/f/g/"]);
	assert.equal(result, "/a/b/", "Linux paths with ending '/'");

	// URLs with mixed endings
	result = determineCommonRoot([
		"https://a.com/a/b/c/d/e",
		"https://a.com/a/b/c",
		"https://a.com/a/b/c/f/g",
	]);
	assert.equal(result, "https://a.com/a/b/", "URLs with mixed endings");

	// Single URL
	result = determineCommonRoot(["https://a.com/a/b/c/d/e"]);
	assert.equal(result, "https://a.com/a/b/c/d/", "Single URL");

	// Single URL with no path
	result = determineCommonRoot(["https://a.com/"]);
	assert.equal(result, "https://", "Single URL with no path");

	// Different domains
	result = determineCommonRoot([
		"https://a.com/a/b/c/d",
		"https://b.com/a/b/c/e",
	]);
	assert.equal(result, null, "Different domains");
});

test("determineCommonRoot(mixed paths and URLs)", () => {
	// Windows & Linux
	let result = determineCommonRoot([
		"/a/b/c/d/e/",
		"/a/b/c/",
		"C:\\a\\b\\c",
		"C:\\a\\b\\c\\f\\g",
	]);
	assert.equal(result, null, "Windows & Linux");

	// Windows & URLs
	result = determineCommonRoot(["C:\\a\\b\\c", "https://a.com/b/c/d/"]);
	assert.equal(result, null, "Windows & URLs");

	// Linux & URLs
	result = determineCommonRoot(["https://a.com/b/c/d/", "/a/b/c"]);
	assert.equal(result, null, "Linux & URLs");

	// Windows & Linux & URLs
	result = determineCommonRoot([
		"C:\\a\\b\\c",
		"/a/b/c",
		"https://a.com/b/c/d",
	]);
	assert.equal(result, null, "Windows & Linux & URLs");
});

test("determineCommonRoot(relative paths)", () => {
	// Relative Windows paths
	let result = determineCommonRoot([
		"a\\b\\c2\\d\\e",
		"a\\b\\c\\",
		"a\\b\\c2\\d\\f\\g",
	]);
	assert.equal(result, "a\\b\\", "Relative Windows paths");

	// Relative Linux paths
	result = determineCommonRoot(["a/b/c", "a/b/c2/d/e/", "a/b/c2/d/f/g/"]);
	assert.equal(result, "a/b/", "Relative Linux paths");
});
