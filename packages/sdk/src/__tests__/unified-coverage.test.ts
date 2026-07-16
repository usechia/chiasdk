import {
	PAWAPAY_CORRESPONDENTS,
	PAYCHANGU_MSISDN_PREFIXES,
	PROVIDER_COVERAGE,
	supportsRoute,
} from "../unified/coverage";

test("pawapay correspondents are grouped by ISO-3166 alpha-3 country", () => {
	expect(PAWAPAY_CORRESPONDENTS.ZMB).toEqual(
		expect.arrayContaining(["MTN_MOMO_ZMB", "AIRTEL_ZMB", "ZAMTEL_ZMB"]),
	);
	expect(PAWAPAY_CORRESPONDENTS.MWI).toEqual(
		expect.arrayContaining(["TNM_MWI", "AIRTEL_MWI"]),
	);
	for (const country of Object.keys(PAWAPAY_CORRESPONDENTS)) {
		expect(country).toHaveLength(3);
	}
});

test("every provider declares at least one country and currency", () => {
	for (const cap of Object.values(PROVIDER_COVERAGE)) {
		expect(cap.countries.length).toBeGreaterThan(0);
		expect(cap.currencies.length).toBeGreaterThan(0);
	}
});

test("onekhusa is the only provider requiring approval and recipient name", () => {
	expect(PROVIDER_COVERAGE.onekhusa.payouts.requiresApproval).toBe(true);
	expect(PROVIDER_COVERAGE.onekhusa.payouts.requiresRecipientName).toBe(true);
	expect(PROVIDER_COVERAGE.pawapay.payouts.requiresApproval).toBe(false);
	expect(PROVIDER_COVERAGE.paychangu.payouts.requiresApproval).toBe(false);
});

test("msisdn prefixes are digit strings mapped to 3-letter countries", () => {
	for (const entry of PAYCHANGU_MSISDN_PREFIXES) {
		expect(entry.prefix).toMatch(/^\d+$/);
		expect(entry.country).toHaveLength(3);
		expect(entry.operatorName.length).toBeGreaterThan(0);
	}
});

test("no two prefixes are ambiguous with each other", () => {
	const sorted = [...PAYCHANGU_MSISDN_PREFIXES].sort(
		(a, b) => a.prefix.length - b.prefix.length,
	);
	for (let i = 0; i < sorted.length; i++) {
		for (let j = i + 1; j < sorted.length; j++) {
			if (sorted[j].prefix.startsWith(sorted[i].prefix)) {
				expect(sorted[i].operatorName).toBe(sorted[j].operatorName);
			}
		}
	}
});

test("supportsRoute rejects unknown countries rather than guessing", () => {
	expect(supportsRoute("pawapay", "ZMB", "ZMW")).toBe(true);
	expect(supportsRoute("pawapay", "XXX", "ZMW")).toBe(false);
	expect(supportsRoute("onekhusa", "MWI", "XOF" as never)).toBe(false);
});

test("prefixes match real E.164 msisdns, not national-format numbers", () => {
	const cases = [
		{ msisdn: "265991234567", expected: "Airtel Money" },
		{ msisdn: "265881234567", expected: "TNM Mpamba" },
	];
	for (const { msisdn, expected } of cases) {
		const matches = PAYCHANGU_MSISDN_PREFIXES.filter((p) =>
			msisdn.startsWith(p.prefix),
		);
		expect(matches).toHaveLength(1);
		expect(matches[0].operatorName).toBe(expected);
	}
});

test("no prefix is stored in national trunk format", () => {
	for (const entry of PAYCHANGU_MSISDN_PREFIXES) {
		expect(entry.prefix.startsWith("0")).toBe(false);
	}
});
