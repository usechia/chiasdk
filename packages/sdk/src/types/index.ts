export interface ServiceError {
	errorMessage: string;
	statusCode: number;
	errorObject: string;
}

export type PawaPayNetworkResponse = ServiceError;

/**
 * Response type for network errors
 */
export interface NetworkResponse {
	HasError: boolean;
	ErrorMessage: string;
	ErrorCode?: string | number;
	Data?: unknown;
}

/**
 * Supported mobile money currencies across PawaPay markets
 * See https://www.pawapay.io/markets
 */
export type MoMoCurrency =
	| "XOF" // West African CFA franc (Benin, Burkina Faso, Ivory Coast, Senegal)
	| "XAF" // Central African CFA franc (Cameroon, Congo-Brazzaville, Gabon)
	| "GHS" // Ghanaian Cedi
	| "NGN" // Nigerian Naira
	| "SLL" // Sierra Leonean Leone
	| "CDF" // Congolese Franc (DRC)
	| "LSL" // Lesotho Loti
	| "MWK" // Malawian Kwacha
	| "MZN" // Mozambican Metical
	| "ZMW" // Zambian Kwacha
	| "ETB" // Ethiopian Birr
	| "KES" // Kenyan Shilling
	| "RWF" // Rwandan Franc
	| "TZS" // Tanzanian Shilling
	| "UGX" // Ugandan Shilling
	| "USD"; // US Dollar

/**
 * Mobile money operators/correspondents
 */
export type Correspondent =
	| "MTN_MOMO_GHA"
	| "VODAFONE_GHA"
	| "AIRTEL_TIGO_GHA"
	| "MTN_MOMO_NGA"
	| "AIRTEL_NGA"
	| "MTN_MOMO_CMR"
	| "ORANGE_CMR"
	| "MTN_MOMO_UGA"
	| "AIRTEL_UGA"
	| "MTN_MOMO_ZMB"
	| "AIRTEL_ZMB"
	| "ZAMTEL_ZMB"
	| "MTN_MOMO_RWA"
	| "AIRTEL_RWA"
	| "TNM_MWI"
	| "AIRTEL_MWI"
	| "VODACOM_TZA"
	| "AIRTEL_TZA"
	| "TIGO_TZA"
	| "HALOTEL_TZA"
	| "MPESA_KEN"
	| "AIRTEL_KEN"
	| "MTN_MOMO_BEN"
	| "MOOV_BEN"
	| "ORANGE_BFA"
	| "MOOV_BFA"
	| "ORANGE_CIV"
	| "MTN_MOMO_CIV"
	| "MOOV_CIV"
	| "ORANGE_SEN"
	| "FREE_SEN"
	| "WAVE_SEN"
	| "ORANGE_SLE"
	| "AFRICELL_SLE"
	| "VODACOM_COD"
	| "AIRTEL_COD"
	| "ORANGE_COD"
	| "AIRTEL_GAB"
	| "MPESA_MOZ"
	| "VODACOM_MOZ"
	| "VODACOM_LSO"
	| "TELEBIRR_ETH";
