import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { usePlans } from "../src/hooks/use-plans";
import { useChia, useChiaStore } from "../src/provider";

// React logs render-phase errors to console.error before rethrowing. Silence it so a
// deliberately failing render does not look like a broken suite.
function expectRenderToThrow(render: () => unknown, message: string) {
	const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
	try {
		expect(render).toThrow(message);
	} finally {
		quiet.mockRestore();
	}
}

describe("used outside a provider", () => {
	it("useChia explains that a ChiaProvider is required", () => {
		expectRenderToThrow(() => renderHook(() => useChia()), "useChia must be used inside a <ChiaProvider>.");
	});

	it("useChiaStore explains that a ChiaProvider is required", () => {
		expectRenderToThrow(() => renderHook(() => useChiaStore()), "Chia hooks must be used inside a <ChiaProvider>.");
	});

	it("a data hook fails with the provider message rather than something cryptic", () => {
		expectRenderToThrow(() => renderHook(() => usePlans()), "ChiaProvider");
	});
});
