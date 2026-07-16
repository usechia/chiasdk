import {
	ChiaError,
	ChiaConfigError,
	ChiaValidationError,
	ChiaAuthError,
	ChiaProviderError,
	ChiaNetworkError,
	ChiaRoutingError,
	classifyByStatusCode,
} from "../unified/errors";

test("ChiaError subclasses carry provider, raw and failoverSafety", () => {
	const err = new ChiaProviderError("refused", {
		provider: "pawapay",
		raw: { x: 1 },
		failoverSafety: "no_money_moved",
	});
	expect(err).toBeInstanceOf(Error);
	expect(err).toBeInstanceOf(ChiaError);
	expect(err.provider).toBe("pawapay");
	expect(err.raw).toEqual({ x: 1 });
	expect(err.failoverSafety).toBe("no_money_moved");
	expect(err.name).toBe("ChiaProviderError");
});

test("validation and config errors are always safe to fall through", () => {
	expect(new ChiaValidationError("bad msisdn").failoverSafety).toBe("no_money_moved");
	expect(new ChiaConfigError("not configured").failoverSafety).toBe("no_money_moved");
});

test("network errors are always indeterminate", () => {
	expect(new ChiaNetworkError("timeout").failoverSafety).toBe("indeterminate");
});

test.each([
	[400, "no_money_moved"],
	[401, "no_money_moved"],
	[403, "no_money_moved"],
	[404, "no_money_moved"],
	[409, "no_money_moved"],
	[422, "no_money_moved"],
	[429, "no_money_moved"],
	[500, "indeterminate"],
	[502, "indeterminate"],
	[503, "indeterminate"],
	[504, "indeterminate"],
])("status %i classifies as %s", (status, expected) => {
	expect(classifyByStatusCode(status)).toBe(expected);
});

test("unknown status codes default to indeterminate", () => {
	expect(classifyByStatusCode(0)).toBe("indeterminate");
	expect(classifyByStatusCode(999)).toBe("indeterminate");
});

test("ChiaRoutingError carries the attempt trail", () => {
	const err = new ChiaRoutingError("all candidates exhausted", [
		{ provider: "pawapay", outcome: "rejected", reason: "REJECTED", durationMs: 5 },
	]);
	expect(err.attempts).toHaveLength(1);
	expect(err.failoverSafety).toBe("no_money_moved");
});

test("forced safety cannot be overridden by caller options", () => {
	expect(
		new ChiaNetworkError("timeout", { failoverSafety: "no_money_moved" })
			.failoverSafety,
	).toBe("indeterminate");
	expect(
		new ChiaConfigError("nope", { failoverSafety: "indeterminate" })
			.failoverSafety,
	).toBe("no_money_moved");
	expect(
		new ChiaValidationError("bad", { failoverSafety: "indeterminate" })
			.failoverSafety,
	).toBe("no_money_moved");
	expect(
		new ChiaAuthError("denied", { failoverSafety: "indeterminate" })
			.failoverSafety,
	).toBe("no_money_moved");
});
