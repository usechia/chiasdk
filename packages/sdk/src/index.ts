/**
 * Chia SDK - A unified interface for African payment providers
 * @module chia
 */

export { ChiaSDK } from "./sdk";
export type { SDKConfig } from "./sdk";

// Export PayChangu types
export type { PayChanguAccountInfo } from "./services/paychangu/types/account";
export type {
	PayChanguPaymentDataInfo,
	PayChanguInitialPayment,
	PayChanguDirectChargePayment,
	PayChanguMobileMoneyPayout,
	PayChanguMobileMoneyPayment,
	PayChanguBankPayout,
	PayChanguDirectChargeBankTransfer,
	PayChanguCustomization,
	PayChanguMeta,
} from "./services/paychangu/types/payment";

export type {
	PayChanguErrorResponse,
	PayChanguDirectChargePaymentResponse,
	PayChanguTransactionDetailsResponse,
	PayChanguOperatorsResponse,
	PayChanguPayoutResponse,
	PayChanguPayoutDetailsResponse,
	PayChanguBanksResponse,
	PayChanguBankTransferResponse,
	PayChanguBankPayoutDetailsResponse,
	PayChanguBankPayoutsListResponse,
	PayChanguBankTransferPaymentResponse,
	PayChanguDirectChargeResponse,
	PayChanguDirectChargeErrorResponse,
	PayChanguSingleTransactionResponse,
	PayChanguMobileMoneyOperatorsResponse,
	PayChanguMobileMoneyPayoutResponse,
	PayChanguSinglePayoutResponse,
	PayChanguSupportedBanksResponse,
	PayChanguBankPayoutResponse,
	PayChanguSingleBankPayoutResponse,
	PayChanguAllBankPayoutsResponse,
	PayChanguDirectChargeBankTransferResponse,
	PayChanguVerifyTransactionResponse,
	PayChanguPaymentInitiationResponse,
	PayChanguPaymentInitiationErrorResponse,
} from "./services/paychangu/types/response";

// Export PawaPay types namespace
export { PawaPayTypes } from "./services/pawapay/types";
export type { default as PawaPayTypesDefault } from "./services/pawapay/types";

// Export OneKhusa types namespace
export { OneKhusaTypes } from "./services/onekhusa/types";
export type { default as OneKhusaTypesDefault } from "./services/onekhusa/types";

// Export environment constants
export { Environment, ENVIRONMENTS, URLS } from "./config/constants";
export type { ApiUrl } from "./config/constants";

// Export config types
export type { EnvConfig, EnvLoadOptions } from "./config/env";

// Export shared types
export type {
	ServiceError,
	NetworkResponse,
	MoMoCurrency,
	Correspondent,
} from "./types/index";

// Export services
export { PawaPay } from "./services/pawapay";
export { PayChangu } from "./services/paychangu";
export { OneKhusa } from "./services/onekhusa";

// Export PayChangu namespace types
export type { PayChangu as PayChanguTypes } from "./services/paychangu/types";

// Export utilities
export { NetworkManager } from "./utils/network";
export { BaseService } from "./utils/baseService";
export { logger } from "./utils/logger";
export { HttpClient } from "./utils/httpClient";
export type {
	HttpClientConfig,
	AuthStrategy,
	RequestHook,
	NetworkErrorResponse,
	RetryConfig,
} from "./utils/httpClient";
export {
	createPawapayClient,
	createPaychanguClient,
	createOnekhusaClient,
} from "./utils/providerClients";
export type { OneKhusaTokenProvider } from "./utils/providerClients";
export {
	wrapServiceCall,
	isServiceError,
	type ServiceResult,
} from "./utils/serviceWrapper";
export { buildQueryString, appendQueryString } from "./utils/queryBuilder";
export { PaymentProviderAdapter } from "./services/generic/paymentProvider";
export type {
	GenericTransaction,
	GenericPaymentRequest,
	GenericPaymentResponse,
	PaymentProviderConfig,
} from "./services/generic/paymentProvider";

// Export Platform service and types
export { Platform } from "./services/platform";
export type {
	PlatformConfig,
	CreatePlanRequest,
	Plan,
	UpdatePlanRequest,
	CreateSubscriptionRequest,
	StartSubscriptionResult,
	SubscriptionNextAction,
	NextActionType,
	SubscriptionIntent,
	Subscriber,
	SubscriberStatus,
	CancelSubscriberRequest,
	ChangePlanRequest,
	ChangePlanResult,
	PlanChangeTiming,
	PlanChangeDirection,
	Payment,
	PaymentStatus,
	PaymentKind,
	CreateWebhookRequest,
	UpdateWebhookRequest,
	WebhookConfig,
	WebhookDelivery,
	WebhookTestResult,
	CreateApiKeyRequest,
	ApiKey,
	ApiKeyWithSecret,
	DeleteResult,
} from "./services/platform/types";

// Export the unified payments API
export {
	ChiaError,
	ChiaConfigError,
	ChiaValidationError,
	ChiaAuthError,
	ChiaProviderError,
	ChiaNetworkError,
	ChiaRoutingError,
	classifyByStatusCode,
} from "./unified/errors";
export type { FailoverSafety, ChiaErrorOptions } from "./unified/errors";
export { PROVIDER_COVERAGE, supportsRoute } from "./unified/coverage";
export { Payments } from "./unified/payments";
export { Payouts } from "./unified/payouts";
export { ProviderRouter } from "./unified/router";
export type { ChiaProviderAdapter } from "./unified/adapters/types";
export type {
	AttemptRecord,
	ChiaPayment,
	ChiaPayout,
	CountryCode,
	Currency,
	NextAction,
	PaymentRequest,
	PaymentStatus as ChiaPaymentStatus,
	PayoutRequest,
	PayoutStatus as ChiaPayoutStatus,
	ProviderCapabilities,
	ProviderName,
	ProviderOptions,
} from "./unified/types";
