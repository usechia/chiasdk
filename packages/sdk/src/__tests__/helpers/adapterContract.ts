import type { ChiaProviderAdapter } from "../../unified/adapters/types";
import { ChiaError } from "../../unified/errors";

export interface ContractFixture {
	adapter: ChiaProviderAdapter;
	okPayment: () => void;
	rejectedPayment: () => void;
	timeoutPayment: () => void;
	sampleCountry: string;
	sampleCurrency: string;
	sampleMsisdn: string;
}

export function runAdapterContract(
	name: string,
	makeFixture: () => ContractFixture,
) {
	describe(`${name} satisfies the ChiaProviderAdapter contract`, () => {
		test("declares its own name in capabilities", () => {
			const { adapter } = makeFixture();
			expect(adapter.capabilities.provider).toBe(adapter.name);
		});

		test("supports() agrees with declared coverage", () => {
			const { adapter, sampleCountry, sampleCurrency } = makeFixture();
			expect(adapter.supports(sampleCountry, sampleCurrency as never)).toBe(true);
			expect(adapter.supports("XXX", sampleCurrency as never)).toBe(false);
		});

		test("initiatePayment returns a normalized ChiaPayment carrying raw", async () => {
			const f = makeFixture();
			f.okPayment();
			const p = await f.adapter.initiatePayment({
				reference: "ref-1",
				amount: "50.00",
				currency: f.sampleCurrency as never,
				msisdn: f.sampleMsisdn,
				country: f.sampleCountry,
			});
			expect(p.provider).toBe(f.adapter.name);
			expect(p.reference).toBe("ref-1");
			expect(p.amount).toBe("50.00");
			expect(typeof p.id).toBe("string");
			expect(p.raw).toBeDefined();
			expect([
				"pending", "requires_action", "processing",
				"success", "failed", "cancelled", "expired",
			]).toContain(p.status);
		});

		test("a provider refusal throws ChiaError marked no_money_moved", async () => {
			const f = makeFixture();
			f.rejectedPayment();
			await expect(
				f.adapter.initiatePayment({
					reference: "ref-2",
					amount: "50.00",
					currency: f.sampleCurrency as never,
					msisdn: f.sampleMsisdn,
					country: f.sampleCountry,
				}),
			).rejects.toMatchObject({
				failoverSafety: "no_money_moved",
				provider: f.adapter.name,
			});
		});

		test("a timeout throws ChiaError marked indeterminate", async () => {
			const f = makeFixture();
			f.timeoutPayment();
			const err = await f.adapter
				.initiatePayment({
					reference: "ref-3",
					amount: "50.00",
					currency: f.sampleCurrency as never,
					msisdn: f.sampleMsisdn,
					country: f.sampleCountry,
				})
				.catch((e) => e);
			expect(err).toBeInstanceOf(ChiaError);
			expect(err.failoverSafety).toBe("indeterminate");
		});

		test("never returns a ServiceError union member instead of throwing", async () => {
			const f = makeFixture();
			f.rejectedPayment();
			const result = await f.adapter
				.initiatePayment({
					reference: "ref-4",
					amount: "50.00",
					currency: f.sampleCurrency as never,
					msisdn: f.sampleMsisdn,
					country: f.sampleCountry,
				})
				.catch(() => "threw");
			expect(result).toBe("threw");
		});
	});
}
