export namespace PawaPayTypes {
	export interface AccountDetails {
		phoneNumber: string;
		provider: string;
	}

	export interface Payer {
		type: "MMO";
		accountDetails: AccountDetails;
	}

	export interface Recipient {
		type: "MMO";
		accountDetails: AccountDetails;
	}

	export interface FailureReason {
		failureCode: string;
		failureMessage: string;
	}

	export interface RejectionReason {
		rejectionCode: string;
		rejectionMessage: string;
	}

	export type Metadata = Record<string, string>;

	export interface DepositRequest {
		depositId: string;
		amount: string;
		currency: string;
		payer: Payer;
		preAuthorisationCode?: string;
		successfulUrl?: string;
		failedUrl?: string;
	}

	export type DepositNextStep = "FINAL_STATUS" | "GET_AUTH_URL" | "REDIRECT_TO_AUTH_URL";

	export interface DepositInitiationResponse {
		depositId: string;
		status: "ACCEPTED" | "REJECTED" | "DUPLICATE_IGNORED";
		nextStep?: DepositNextStep;
		created?: string;
		failureReason?: FailureReason;
	}

	export type DepositStatus = "COMPLETED" | "FAILED" | "PROCESSING" | "IN_RECONCILIATION" | "NOT_FOUND";

	export interface DepositStatusResponse {
		depositId: string;
		status: DepositStatus;
		nextStep?: DepositNextStep;
		amount?: string;
		currency?: string;
		country?: string;
		payer?: Payer;
		customerMessage?: string;
		created?: string;
		providerTransactionId?: string;
		authorizationUrl?: string;
		failureReason?: FailureReason;
	}

	export interface PaymentPageRequest {
		depositId: string;
		returnUrl: string;
		msisdn?: string;
		amount?: string;
		country?: string;
		reason?: string;
		language?: string;
	}

	export interface PaymentPageResponse {
		redirectUrl: string;
		depositId: string;
		returnUrl: string;
	}

	export interface PayoutRequest {
		payoutId: string;
		amount: string;
		currency: string;
		recipient: Recipient;
	}

	export interface PayoutInitiationResponse {
		payoutId: string;
		status: "ACCEPTED" | "REJECTED" | "DUPLICATE_IGNORED";
		created?: string;
		failureReason?: FailureReason;
	}

	export type PayoutStatus = "COMPLETED" | "FAILED" | "PROCESSING" | "ENQUEUED" | "IN_RECONCILIATION";

	export interface PayoutStatusData {
		payoutId: string;
		status: PayoutStatus;
		amount?: string;
		currency?: string;
		country?: string;
		recipient?: Recipient;
		customerMessage?: string;
		created?: string;
		providerTransactionId?: string;
		failureReason?: FailureReason;
	}

	export interface PayoutStatusResponse {
		status: "FOUND" | "NOT_FOUND";
		data?: PayoutStatusData;
	}

	export interface CancelPayoutResponse {
		payoutId: string;
		status: "ACCEPTED";
	}

	export interface BulkPayoutResponse {
		transactions: PayoutInitiationResponse[];
	}

	export interface RefundRequest {
		refundId: string;
		depositId: string;
		amount?: string;
		currency?: string;
	}

	export interface RefundInitiationResponse {
		refundId: string;
		status: "ACCEPTED" | "REJECTED" | "DUPLICATE_IGNORED";
		created?: string;
		rejectionReason?: RejectionReason;
		failureReason?: FailureReason;
	}

	export type RefundStatus = "COMPLETED" | "FAILED" | "PROCESSING" | "ENQUEUED" | "IN_RECONCILIATION";

	export interface RefundStatusData {
		refundId: string;
		status: RefundStatus;
		amount?: string;
		currency?: string;
		country?: string;
		recipient?: Recipient;
		customerMessage?: string;
		created?: string;
		failureReason?: FailureReason;
	}

	export interface RefundStatusResponse {
		status: "FOUND" | "NOT_FOUND";
		data?: RefundStatusData;
	}

	export interface WalletBalance {
		country: string;
		balance: string;
		currency: string;
		provider: string;
	}

	export interface WalletBalancesResponse {
		balances: WalletBalance[];
	}

	export type OperationStatus = "OPERATIONAL" | "DELAYED" | "CLOSED";
	export type OperationType = "DEPOSIT" | "PAYOUT" | "REFUND";
	export type AuthType = "PROVIDER_AUTH" | "PREAUTH" | "REDIRECT";
	export type DecimalsInAmount = "NONE" | "TWO_PLACES";
	export type PinPrompt = "AUTOMATIC" | "MANUAL";

	export interface ProviderOperation {
		status: OperationStatus;
		authType?: AuthType;
		pinPrompt?: PinPrompt;
		pinPromptRevivable?: boolean;
		decimalsInAmount?: DecimalsInAmount;
		minAmount?: string;
		maxAmount?: string;
	}

	export interface ProviderCurrency {
		currency: string;
		displayName?: string;
		operationTypes: Partial<Record<OperationType, ProviderOperation>>;
	}

	export interface ProviderConfig {
		provider: string;
		displayName?: string;
		nameDisplayedToCustomer?: string;
		logo?: string;
		currencies: ProviderCurrency[];
	}

	export interface CountryConfig {
		country: string;
		prefix?: string;
		flag?: string;
		displayName?: Record<string, string>;
		providers: ProviderConfig[];
	}

	export interface ActiveConfigResponse {
		companyName: string;
		countries: CountryConfig[];
	}

	export interface AvailabilityProvider {
		provider: string;
		operationTypes: Partial<Record<OperationType, OperationStatus>>;
	}

	export interface CountryAvailability {
		country: string;
		providers: AvailabilityProvider[];
	}

	export type AvailabilityResponse = CountryAvailability[];

	export interface PredictProviderRequest {
		phoneNumber: string;
	}

	export interface PredictProviderResponse {
		country: string;
		provider: string;
		phoneNumber: string;
	}

	export interface ResendCallbackResponse {
		status: "ACCEPTED" | "REJECTED" | "FAILED";
	}
}

export default PawaPayTypes;
