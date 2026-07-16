import type { Correspondent } from "../types";
import type {
	CountryCode,
	Currency,
	ProviderCapabilities,
	ProviderName,
} from "./types";

// Derived verbatim from the `Correspondent` union in src/types/index.ts.
// Do not add, remove, or reorder entries here without updating that union first.
const CORRESPONDENTS: Correspondent[] = [
	"MTN_MOMO_GHA", "VODAFONE_GHA", "AIRTEL_TIGO_GHA",
	"MTN_MOMO_NGA", "AIRTEL_NGA",
	"MTN_MOMO_CMR", "ORANGE_CMR",
	"MTN_MOMO_UGA", "AIRTEL_UGA",
	"MTN_MOMO_ZMB", "AIRTEL_ZMB", "ZAMTEL_ZMB",
	"MTN_MOMO_RWA", "AIRTEL_RWA",
	"TNM_MWI", "AIRTEL_MWI",
	"VODACOM_TZA", "AIRTEL_TZA", "TIGO_TZA", "HALOTEL_TZA",
	"MPESA_KEN", "AIRTEL_KEN",
	"MTN_MOMO_BEN", "MOOV_BEN",
	"ORANGE_BFA", "MOOV_BFA",
	"ORANGE_CIV", "MTN_MOMO_CIV", "MOOV_CIV",
	"ORANGE_SEN", "FREE_SEN", "WAVE_SEN",
	"ORANGE_SLE", "AFRICELL_SLE",
	"VODACOM_COD", "AIRTEL_COD", "ORANGE_COD",
	"AIRTEL_GAB",
	"MPESA_MOZ", "VODACOM_MOZ",
	"VODACOM_LSO",
	"TELEBIRR_ETH",
];

export const PAWAPAY_CORRESPONDENTS: Record<CountryCode, Correspondent[]> =
	CORRESPONDENTS.reduce<Record<CountryCode, Correspondent[]>>((acc, c) => {
		const country = c.slice(-3);
		acc[country] = acc[country] ?? [];
		acc[country].push(c);
		return acc;
	}, {});

// PawaPay currencies, derived verbatim from the `MoMoCurrency` union in src/types/index.ts.
const PAWAPAY_CURRENCIES: Currency[] = [
	"XOF",
	"XAF",
	"GHS",
	"NGN",
	"SLL",
	"CDF",
	"LSL",
	"MWK",
	"MZN",
	"ZMW",
	"ETB",
	"KES",
	"RWF",
	"TZS",
	"UGX",
	"USD",
];

export interface MsisdnPrefix {
	prefix: string;
	country: CountryCode;
	operatorName: string;
}

// Each entry MUST cite its source. Unsourced entries are not permitted.
//
// Only two prefixes are included. Both are confirmed by the same primary
// regulatory source: an ITU operational bulletin reproducing official
// Malawi Communications Regulatory Authority (MACRA) numbering-plan
// communications. Secondary/vendor sources (e.g. SMS-gateway documentation
// pages) claim additional legacy prefixes (084, 098) but are not
// regulator-sourced and were not corroborated by MACRA or ITU documents, so
// they are deliberately left out rather than guessed.
export const PAYCHANGU_MSISDN_PREFIXES: MsisdnPrefix[] = [
	{ prefix: "088", country: "MWI", operatorName: "TNM Mpamba" },
	// source: ITU "Malawi (country code +265)" operational bulletin, reproducing MACRA's
	// 15.XII.2008 numbering-plan communication ("8 XXX XXX" / "4 XXX XXX" -> "8 8XXX XXXX", operator: TNM)
	// and MACRA's 11.XII.2017 communication (TNM Plc, "(0)88 XXX XXXX", SIM based services).
	// https://www.itu.int/dms_pub/itu-t/oth/02/02/T02020000800002PDFE.pdf, consulted 2026-07-16
	// Operator product name "TNM Mpamba" confirmed at
	// https://developer.paychangu.com/docs/mobile-money, consulted 2026-07-16 (names TNM Mpamba and Airtel Money
	// as the two Malawian mobile money operators PayChangu integrates with).
	{ prefix: "099", country: "MWI", operatorName: "Airtel Money" },
	// source: ITU "Malawi (country code +265)" operational bulletin, reproducing MACRA's
	// 15.XII.2008 numbering-plan communication ("9 XXX XXX" / "5 XXX XXX" / "3 XXX XXX" -> "9 9XXX XXXX",
	// operator: Zain Malawi Limited, the pre-rebrand name for Airtel Malawi).
	// https://www.itu.int/dms_pub/itu-t/oth/02/02/T02020000800002PDFE.pdf, consulted 2026-07-16
	// Zain Malawi -> Airtel Malawi rebrand confirmed at
	// https://www.bizcommunity.com/Article/129/82/49408.html, consulted 2026-07-16
	// Operator product name "Airtel Money" confirmed at
	// https://developer.paychangu.com/docs/mobile-money, consulted 2026-07-16
];

export const PROVIDER_COVERAGE: Record<ProviderName, ProviderCapabilities> = {
	pawapay: {
		provider: "pawapay",
		payments: { supported: true },
		payouts: {
			supported: true,
			requiresApproval: false,
			requiresRecipientName: false,
		},
		countries: Object.keys(PAWAPAY_CORRESPONDENTS),
		currencies: PAWAPAY_CURRENCIES,
	},
	paychangu: {
		provider: "paychangu",
		payments: { supported: true },
		payouts: {
			supported: true,
			requiresApproval: false,
			requiresRecipientName: false,
		},
		// PayChangu operates only in Malawi.
		// source: https://en.wikipedia.org/wiki/PayChangu, consulted 2026-07-16
		// ("PayChangu ... provides digital payment infrastructure for Malawian merchants
		// and payment service providers across the country"; no other country of operation
		// is documented).
		// Corroborated by https://developer.paychangu.com/docs/mobile-money, consulted 2026-07-16,
		// whose only worked example uses a +265 (Malawi) mobile number.
		countries: ["MWI"],
		// Currencies derived from the repo's own `PayChangu.Currency` type in
		// src/services/paychangu/types/index.ts ("MWK" | "USD"), which is existing,
		// reviewed data and takes precedence over web research per the source hierarchy.
		currencies: ["MWK", "USD"],
	},
	onekhusa: {
		provider: "onekhusa",
		payments: { supported: true },
		payouts: {
			supported: true,
			requiresApproval: true,
			requiresRecipientName: true,
		},
		// OneKhusa's documented country presence is Malawi only: it is licensed as a
		// Payment System Operator by the Reserve Bank of Malawi and participates in
		// NATSWITCH (Malawi's national switch).
		// source: https://onekhusa.com/about, consulted 2026-07-16
		// Corroborated by https://onekhusa.com/services, consulted 2026-07-16, which advertises
		// disbursements as "anyone anywhere in Malawi" and lists a Lilongwe, Malawi address.
		// No other country of operation, license, or regulatory approval was found for OneKhusa;
		// the additional currencies below (beyond MWK) are documented as a multi-currency /
		// auto-conversion settlement feature, not evidence of presence in those countries, so no
		// additional countries are added here.
		countries: ["MWI"],
		currencies: ["MWK", "USD", "ZAR", "ZMW", "TZS", "KES", "UGX"],
	},
};

export function supportsRoute(
	provider: ProviderName,
	country: CountryCode,
	currency: Currency,
): boolean {
	const cap = PROVIDER_COVERAGE[provider];
	if (!cap) return false;
	return cap.countries.includes(country) && cap.currencies.includes(currency);
}
