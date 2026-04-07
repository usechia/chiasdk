import { PayChangu } from "./services";
import { PawaPay } from "./services";
import { OneKhusa } from "./services";
import { PaymentProviderAdapter, PaymentProviderConfig } from "./services";
import { Platform } from "./services/platform";
import type { PlatformConfig } from "./services/platform/types";
import type { Environment } from "./config/constants";
import {
	type EnvConfig,
	loadEnvConfig,
	validatePSPConfig,
	loadEnvFile,
	type EnvLoadOptions,
} from "./config/env";

/**
 * Configuration interface for the Chia SDK
 */
export interface SDKConfig {
	/**
	 * Environment configuration options
	 */
	env?: EnvLoadOptions;

	/**
	 * PayChangu configuration (overrides environment variables)
	 */
	paychangu?: {
		/** PayChangu secret key for authentication */
		secretKey: string;
		/** Optional return URL */
		returnUrl?: string;
		/** Optional environment setting (defaults to DEVELOPMENT) */
		environment?: Environment;
		/** Optional custom base URL for sandbox environment */
		sandboxUrl?: string;
		/** Optional custom base URL for production environment */
		productionUrl?: string;
	};

	/**
	 * PawaPay configuration (overrides environment variables)
	 */
	pawapay?: {
		/** PawaPay JWT token for authentication */
		jwt: string;
		/** Optional environment setting (defaults to DEVELOPMENT) */
		environment?: Environment;
		/** Optional custom base URL for sandbox environment */
		sandboxUrl?: string;
		/** Optional custom base URL for production environment */
		productionUrl?: string;
	};

	/**
	 * OneKhusa configuration (overrides environment variables)
	 */
	onekhusa?: {
		/** OneKhusa API key for authentication */
		apiKey: string;
		/** OneKhusa API secret for authentication */
		apiSecret: string;
		/** OneKhusa organisation ID */
		organisationId: string;
		/** Optional environment setting (defaults to DEVELOPMENT) */
		environment?: Environment;
		/** Optional custom base URL for sandbox environment */
		sandboxUrl?: string;
		/** Optional custom base URL for production environment */
		productionUrl?: string;
	};

	/**
	 * Custom payment providers configuration
	 */
	providers?: Record<string, PaymentProviderConfig>;

	/**
	 * Chia Platform API configuration
	 */
	platform?: PlatformConfig;
}

/**
 * Main SDK class for interacting with African payment providers
 */
export class ChiaSDK {
	private static instance?: ChiaSDK;
	private _paychangu?: PayChangu;
	private _pawapay?: PawaPay;
	private _onekhusa?: OneKhusa;
	private readonly envConfig?: EnvConfig;
	private _providers: Record<string, PaymentProviderAdapter> = {};
	private _platform?: Platform;

	private constructor(private readonly config: SDKConfig = {}) {
		// Private constructor to enforce a singleton pattern
		if (config.env) {
			loadEnvFile(config.env);
		} else {
			loadEnvFile();
		}
		this.envConfig = loadEnvConfig();
		this.initializeServices();
	}

	/**
	 * Initialize the SDK with configuration
	 * @param config - SDK configuration options
	 * @returns The SDK instance
	 */
	public static initialize(config: SDKConfig = {}): ChiaSDK {
		if (!ChiaSDK.instance) {
			ChiaSDK.instance = new ChiaSDK(config);

			// Log initialization status
			const services = ChiaSDK.instance.getConfiguredServices();
			const providers = Object.keys(ChiaSDK.instance._providers);

			if (services.length === 0 && providers.length === 0) {
				console.warn("⚠️ No payment services were configured");
				console.log("Available built-in services:");
				console.log("- PayChangu (requires PAYCHANGU_SECRET_KEY)");
				console.log("- PawaPay (requires PAWAPAY_JWT)");
				console.log(
					"- OneKhusa (requires ONEKHUSA_API_KEY, ONEKHUSA_API_SECRET, ONEKHUSA_ORGANISATION_ID)",
				);
				console.log("- Custom providers (configure via providers option)");
			} else {
				console.log("✓ Initialized Chia SDK with services:");
				for (const service of services) {
					console.log(
						`- ${service.charAt(0).toUpperCase() + service.slice(1)}`,
					);
				}

				if (providers.length > 0) {
					console.log("✓ Custom payment providers:");
					for (const provider of providers) {
						console.log(`- ${provider}`);
					}
				}
			}
		}
		return ChiaSDK.instance;
	}

	/**
	 * Get the SDK instance
	 * @throws Error if SDK is not initialized
	 */
	public static getInstance(): ChiaSDK {
		if (!ChiaSDK.instance) {
			throw new Error(
				"SDK not initialized. Call ChiaSDK.initialize() first",
			);
		}
		return ChiaSDK.instance;
	}

	/**
	 * Access the PayChangu payment service
	 * @throws Error if PayChangu is not configured
	 */
	get paychangu(): PayChangu {
		if (!this._paychangu) {
			throw new Error(
				"PayChangu service is not configured. Please provide PayChangu credentials in the SDK config or environment variables.",
			);
		}
		return this._paychangu;
	}

	/**
	 * Access the PawaPay payment service
	 * @throws Error if PawaPay is not configured
	 */
	get pawapay(): PawaPay {
		if (!this._pawapay) {
			throw new Error(
				"PawaPay service is not configured. Please provide PawaPay credentials in the SDK config or environment variables.",
			);
		}
		return this._pawapay;
	}

	/**
	 * Access the OneKhusa payment service
	 * @throws Error if OneKhusa is not configured
	 */
	get onekhusa(): OneKhusa {
		if (!this._onekhusa) {
			throw new Error(
				"OneKhusa service is not configured. Please provide OneKhusa credentials in the SDK config or environment variables.",
			);
		}
		return this._onekhusa;
	}

	get platform(): Platform {
		if (!this._platform) {
			throw new Error(
				"Platform service is not configured. Please provide a Chia API key in the SDK config or set the CHIA_API_KEY environment variable.",
			);
		}
		return this._platform;
	}

	/**
	 * Access a custom payment provider
	 * @param providerName - The name of the custom provider
	 * @throws Error if the provider is not configured
	 */
	getProvider(providerName: string): PaymentProviderAdapter {
		if (!this._providers[providerName]) {
			throw new Error(
				`Provider '${providerName}' is not configured. Please add it to the providers configuration.`,
			);
		}
		return this._providers[providerName];
	}

	/**
	 * Add a new payment provider to the SDK
	 * @param name - A unique name for the provider
	 * @param config - The provider configuration
	 * @returns The created provider instance
	 */
	addProvider(
		name: string,
		config: PaymentProviderConfig,
	): PaymentProviderAdapter {
		// Override name in config to ensure consistency
		const providerConfig = { ...config, name };
		const provider = new PaymentProviderAdapter(providerConfig);
		this._providers[name] = provider;
		return provider;
	}

	/**
	 * Checks if a specific payment service is configured
	 * @param service - The name of the service to check
	 * @returns boolean indicating if the service is configured
	 */
	isServiceConfigured(
		service: "paychangu" | "pawapay" | "onekhusa" | string,
	): boolean {
		switch (service) {
			case "paychangu":
				return !!this._paychangu;
			case "pawapay":
				return !!this._pawapay;
			case "onekhusa":
				return !!this._onekhusa;
			case "platform":
				return !!this._platform;
			default:
				return !!this._providers[service];
		}
	}

	/**
	 * Gets a list of configured built-in payment services
	 * @returns Array of configured service names
	 */
	getConfiguredServices(): ("paychangu" | "pawapay" | "onekhusa" | "platform")[] {
		const services: ("paychangu" | "pawapay" | "onekhusa" | "platform")[] = [];
		if (this._paychangu) services.push("paychangu");
		if (this._pawapay) services.push("pawapay");
		if (this._onekhusa) services.push("onekhusa");
		if (this._platform) services.push("platform");
		return services;
	}

	/**
	 * Gets a list of all custom providers
	 * @returns Array of provider names
	 */
	getCustomProviders(): string[] {
		return Object.keys(this._providers);
	}

	private initializeServices(): void {
		this.initializeFromEnv();
		this.initializeFromConfig();
		this.initializeCustomProviders();
	}

	private initializeFromEnv(): void {
		if (!this.envConfig) return;

		// Initialize PayChangu if configured
		const paychanguValidation = validatePSPConfig(this.envConfig, "paychangu");
		if (paychanguValidation.isValid) {
			this._paychangu = new PayChangu(this.envConfig.PAYCHANGU_SECRET_KEY);
		}

		// Initialize PawaPay if configured
		const pawapayValidation = validatePSPConfig(this.envConfig, "pawapay");
		if (pawapayValidation.isValid) {
			this._pawapay = new PawaPay(this.envConfig.PAWAPAY_JWT);
		}

		// Initialize OneKhusa if configured
		const onekhusaValidation = validatePSPConfig(this.envConfig, "onekhusa");
		if (onekhusaValidation.isValid) {
			this._onekhusa = new OneKhusa(
				this.envConfig.ONEKHUSA_API_KEY,
				this.envConfig.ONEKHUSA_API_SECRET,
				this.envConfig.ONEKHUSA_ORGANISATION_ID,
				this.envConfig.ONEKHUSA_ENVIRONMENT as "DEVELOPMENT" | "PRODUCTION",
			);
		}

		const chiaApiKey = process.env.CHIA_API_KEY;
		if (chiaApiKey) {
			this._platform = new Platform({
				apiKey: chiaApiKey,
				baseUrl: process.env.CHIA_API_BASE_URL,
			});
		}
	}

	private initializeFromConfig(): void {
		// Override with direct configuration if provided
		if (this.config.paychangu?.secretKey) {
			this._paychangu = new PayChangu(
				this.config.paychangu.secretKey,
				this.config.paychangu.environment,
				this.config.paychangu.sandboxUrl,
				this.config.paychangu.productionUrl,
			);
		}

		if (this.config.pawapay?.jwt) {
			this._pawapay = new PawaPay(
				this.config.pawapay.jwt,
				this.config.pawapay.environment,
				this.config.pawapay.sandboxUrl,
				this.config.pawapay.productionUrl,
			);
		}

		if (
			this.config.onekhusa?.apiKey &&
			this.config.onekhusa?.apiSecret &&
			this.config.onekhusa?.organisationId
		) {
			this._onekhusa = new OneKhusa(
				this.config.onekhusa.apiKey,
				this.config.onekhusa.apiSecret,
				this.config.onekhusa.organisationId,
				this.config.onekhusa.environment,
				this.config.onekhusa.sandboxUrl,
				this.config.onekhusa.productionUrl,
			);
		}

		if (this.config.platform?.apiKey) {
			this._platform = new Platform(this.config.platform);
		}
	}

	private initializeCustomProviders(): void {
		// Initialize custom providers if configured
		if (this.config.providers) {
			for (const [name, config] of Object.entries(this.config.providers)) {
				this.addProvider(name, config);
			}
		}
	}
}
