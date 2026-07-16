import type {
	ChiaPayment,
	ChiaPayout,
	CountryCode,
	Currency,
	PaymentRequest,
	PayoutRequest,
	ProviderCapabilities,
	ProviderName,
} from "../types";

export interface ChiaProviderAdapter {
	readonly name: ProviderName;
	readonly capabilities: ProviderCapabilities;
	supports(country: CountryCode, currency: Currency): boolean;
	resolveOperator(msisdn: string, country: CountryCode): Promise<string>;
	initiatePayment(req: PaymentRequest): Promise<ChiaPayment>;
	getPayment(id: string): Promise<ChiaPayment>;
	sendPayout(req: PayoutRequest): Promise<ChiaPayout>;
	getPayout(id: string): Promise<ChiaPayout>;
}
