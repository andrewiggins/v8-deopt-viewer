export const MIN_SEVERITY = 1;

export function unquote(s) {
	// for some reason Node.js double quotes some the strings in the log, i.e. ""eager""
	return s.replace(/^"/, "").replace(/"$/, "");
}
