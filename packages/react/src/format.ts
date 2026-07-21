import type { BillingInterval } from "./types";

const FALLBACK_BRAND = "#17191c";

/** White text needs a dark enough brand color; light brands fall back to ink. */
export function usableBrand(hex: string | null | undefined): string {
	if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return FALLBACK_BRAND;
	const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
	const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
	return luminance > 0.55 ? FALLBACK_BRAND : hex;
}

/**
 * Groups the integer part with separators without ever converting the value to a
 * float. Amounts are numeric(12,2) decimal strings and must survive verbatim.
 */
export function formatAmount(amount: string): string {
	const [rawInteger = "0", fraction] = amount.trim().split(".");
	const negative = rawInteger.startsWith("-");
	const digits = negative ? rawInteger.slice(1) : rawInteger;
	const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	const withSign = negative ? `-${grouped}` : grouped;
	return fraction && /[1-9]/.test(fraction) ? `${withSign}.${fraction}` : withSign;
}

export function formatMoney(currency: string, amount: string): string {
	return `${currency} ${formatAmount(amount)}`;
}

export function intervalNoun(interval: BillingInterval | string): string {
	switch (interval) {
		case "daily":
			return "day";
		case "weekly":
			return "week";
		case "monthly":
			return "month";
		case "yearly":
			return "year";
		default:
			return interval;
	}
}

export function formatDate(value: string | null | undefined): string {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
