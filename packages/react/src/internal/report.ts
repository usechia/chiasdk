// Errors thrown by code the host owns - callbacks it passed in, subscribers React
// registered. They must not corrupt our own state, and must not disappear either.
export function reportForeignError(what: string, error: unknown): void {
	console.error(`[chia] ${what} threw:`, error);
}
