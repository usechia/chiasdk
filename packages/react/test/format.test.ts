import { describe, expect, it } from "vitest";
import { formatAmount, formatMoney, intervalNoun, usableBrand } from "../src/format";

describe("formatAmount", () => {
	it("groups without floating point conversion", () => {
		expect(formatAmount("12500.00")).toBe("12,500");
		expect(formatAmount("1250000.50")).toBe("1,250,000.50");
		expect(formatAmount("0.99")).toBe("0.99");
	});

	it("preserves precision that a float would lose", () => {
		expect(formatAmount("999999999.99")).toBe("999,999,999.99");
	});

	it("formats money with the currency code", () => {
		expect(formatMoney("MWK", "12500.00")).toBe("MWK 12,500");
	});
});

describe("usableBrand", () => {
	it("falls back to ink for brands too light for white text", () => {
		expect(usableBrand("#ffffff")).toBe("#17191c");
		expect(usableBrand("#f5f5dc")).toBe("#17191c");
	});

	it("keeps dark brands", () => {
		expect(usableBrand("#1d4ed8")).toBe("#1d4ed8");
	});

	it("falls back on malformed input", () => {
		expect(usableBrand(null)).toBe("#17191c");
		expect(usableBrand("blue")).toBe("#17191c");
	});
});

describe("intervalNoun", () => {
	it("maps billing intervals to nouns", () => {
		expect(intervalNoun("monthly")).toBe("month");
		expect(intervalNoun("yearly")).toBe("year");
	});
});
