import test from "tape";
import { determineCommonRoot } from "../src/determineCommonRoot.js";

test("determineCommonRoot(absolute paths)", (t) => {
	// Windows paths
	let result = determineCommonRoot([
		"C:\\a\\b\\c2\\d\\e",
		"C:\\a\\b\\c2\\f\\g",
		"C:\\a\\b\\c",
		"C:\\a\\b\\c\\",
	]);
	t.equal(result, "C:\\a\\b\\", "Windows paths");

	// Single path
	result = determineCommonRoot(["C:\\a\\b\\c\\d\\e"]);
	t.equal(result, "C:\\a\\b\\c\\d\\", "Single path");

	// Linux paths with ending '/'
	result = determineCommonRoot(["/a/b/c2/d/e/", "/a/b/c/", "/a/b/c2/f/g/"]);
	t.equal(result, "/a/b/", "Linux paths with ending '/'");

	// URLs with mixed endings
	result = determineCommonRoot([
		"https://a.com/a/b/c/d/e",
		"https://a.com/a/b/c",
		"https://a.com/a/b/c/f/g",
	]);
	t.equal(result, "https://a.com/a/b/", "URLs with mixed endings");

	// Single URL
	result = determineCommonRoot(["https://a.com/a/b/c/d/e"]);
	t.equal(result, "https://a.com/a/b/c/d/", "Single URL");

	// Single URL with no path
	result = determineCommonRoot(["https://a.com/"]);
	t.equal(result, "https://", "Single URL with no path");

	// Different domains
	result = determineCommonRoot([
		"https://a.com/a/b/c/d",
		"https://b.com/a/b/c/e",
	]);
	t.equal(result, null, "Different domains");

	t.end();
});

test("determineCommonRoot(mixed paths and URLs)", (t) => {
	// Windows & Linux .... TODO: What to do here??
	let result = determineCommonRoot([
		"/a/b/c/d/e/",
		"/a/b/c/",
		"C:\\a\\b\\c",
		"C:\\a\\b\\c\\f\\g",
	]);
	t.equal(result, null, "Windows & Linux");

	// Windows & URLs
	result = determineCommonRoot(["C:\\a\\b\\c", "https://a.com/b/c/d/"]);
	t.equal(result, null, "Windows & URLs");

	// Linux & URLs
	result = determineCommonRoot(["https://a.com/b/c/d/", "/a/b/c"]);
	t.equal(result, null, "Linux & URLs");

	// Windows & Linux & URLs
	result = determineCommonRoot([
		"C:\\a\\b\\c",
		"/a/b/c",
		"https://a.com/b/c/d",
	]);
	t.equal(result, null, "Windows & Linux & URLs");

	t.end();
});

test("determineCommonRoot(relative paths)", (t) => {
	// Relative Windows paths
	let result = determineCommonRoot([
		"a\\b\\c2\\d\\e",
		"a\\b\\c\\",
		"a\\b\\c2\\d\\f\\g",
	]);
	t.equal(result, "a\\b\\", "Relative Windows paths");

	// Relative Linux paths
	result = determineCommonRoot(["a/b/c", "a/b/c2/d/e/", "a/b/c2/d/f/g/"]);
	t.equal(result, "a/b/", "Relative Linux paths");

	t.end();
});
