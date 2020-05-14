import { useState, useEffect, useCallback } from "preact/hooks";

// returns the current hash location in a normalized form
// (excluding the leading '#' symbol)
function currentLocation() {
	return window.location.hash.replace(/^#/, "") || "/";
}

/**
 * @returns {[string, (to: string) => string]}
 */
export function useHashLocation() {
	const [loc, setLoc] = useState(currentLocation());

	useEffect(() => {
		// this function is called whenever the hash changes
		const handler = () => setLoc(currentLocation());

		// subscribe to hash changes
		window.addEventListener("hashchange", handler);
		return () => window.removeEventListener("hashchange", handler);
	}, []);

	// remember to wrap your function with `useCallback` hook
	// a tiny but important optimization
	const navigate = useCallback((to) => (window.location.hash = to), []);

	return [loc, navigate];
}
