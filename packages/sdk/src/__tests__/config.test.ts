import { loadEnvConfig, validatePSPConfig } from "../config/env";

describe("loadEnvConfig", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		process.env = { ...originalEnv };
	});

	afterAll(() => {
		process.env = originalEnv;
	});

	it("loads config from environment variables", () => {
		process.env.PAYCHANGU_SECRET_KEY = "test-secret";
		process.env.PAWAPAY_JWT = "test-jwt";
		process.env.ONEKHUSA_API_KEY = "test-key";
		process.env.ONEKHUSA_API_SECRET = "test-secret-ok";
		process.env.ONEKHUSA_ORGANISATION_ID = "org-123";

		const config = loadEnvConfig();
		expect(config.PAYCHANGU_SECRET_KEY).toBe("test-secret");
		expect(config.PAWAPAY_JWT).toBe("test-jwt");
		expect(config.ONEKHUSA_API_KEY).toBe("test-key");
		expect(config.ONEKHUSA_API_SECRET).toBe("test-secret-ok");
		expect(config.ONEKHUSA_ORGANISATION_ID).toBe("org-123");
	});

	it("returns empty strings for missing required fields", () => {
		delete process.env.PAYCHANGU_SECRET_KEY;
		delete process.env.PAWAPAY_JWT;
		delete process.env.ONEKHUSA_API_KEY;
		delete process.env.ONEKHUSA_API_SECRET;
		delete process.env.ONEKHUSA_ORGANISATION_ID;

		const config = loadEnvConfig();
		expect(config.PAYCHANGU_SECRET_KEY).toBe("");
		expect(config.PAWAPAY_JWT).toBe("");
		expect(config.ONEKHUSA_API_KEY).toBe("");
	});

	it("applies default environment values when not set", () => {
		delete process.env.PAYCHANGU_ENVIRONMENT;
		delete process.env.PAWAPAY_ENVIRONMENT;
		delete process.env.ONEKHUSA_ENVIRONMENT;

		const config = loadEnvConfig();
		expect(config.PAYCHANGU_ENVIRONMENT).toBe("DEVELOPMENT");
		expect(config.PAWAPAY_ENVIRONMENT).toBe("DEVELOPMENT");
		expect(config.ONEKHUSA_ENVIRONMENT).toBe("DEVELOPMENT");
	});

	it("uses provided environment values when set", () => {
		process.env.PAYCHANGU_ENVIRONMENT = "PRODUCTION";

		const config = loadEnvConfig();
		expect(config.PAYCHANGU_ENVIRONMENT).toBe("PRODUCTION");
	});

	it("handles missing optional fields gracefully", () => {
		delete process.env.PAYCHANGU_RETURN_URL;
		const config = loadEnvConfig();
		expect(config.PAYCHANGU_RETURN_URL).toBeUndefined();
	});
});

describe("validatePSPConfig", () => {
	it("validates paychangu when secret key is present", () => {
		const config = loadEnvConfig();
		config.PAYCHANGU_SECRET_KEY = "sk_test_123";
		const result = validatePSPConfig(config, "paychangu");
		expect(result.isValid).toBe(true);
		expect(result.missingFields).toEqual([]);
	});

	it("fails paychangu validation when secret key is missing", () => {
		const config = loadEnvConfig();
		config.PAYCHANGU_SECRET_KEY = "";
		const result = validatePSPConfig(config, "paychangu");
		expect(result.isValid).toBe(false);
		expect(result.missingFields).toContain("PAYCHANGU_SECRET_KEY");
	});

	it("validates pawapay when jwt is present", () => {
		const config = loadEnvConfig();
		config.PAWAPAY_JWT = "jwt_test_123";
		const result = validatePSPConfig(config, "pawapay");
		expect(result.isValid).toBe(true);
	});

	it("fails pawapay validation when jwt is missing", () => {
		const config = loadEnvConfig();
		config.PAWAPAY_JWT = "";
		const result = validatePSPConfig(config, "pawapay");
		expect(result.isValid).toBe(false);
		expect(result.missingFields).toContain("PAWAPAY_JWT");
	});

	it("validates onekhusa when all fields are present", () => {
		const config = loadEnvConfig();
		config.ONEKHUSA_API_KEY = "key";
		config.ONEKHUSA_API_SECRET = "secret";
		config.ONEKHUSA_ORGANISATION_ID = "org";
		config.ONEKHUSA_MERCHANT_ACCOUNT_NUMBER = 12345678;
		const result = validatePSPConfig(config, "onekhusa");
		expect(result.isValid).toBe(true);
		expect(result.missingFields).toEqual([]);
	});

	it("fails onekhusa validation when fields are missing", () => {
		const config = loadEnvConfig();
		config.ONEKHUSA_API_KEY = "";
		config.ONEKHUSA_API_SECRET = "";
		config.ONEKHUSA_ORGANISATION_ID = "";
		const result = validatePSPConfig(config, "onekhusa");
		expect(result.isValid).toBe(false);
		expect(result.missingFields).toContain("ONEKHUSA_API_KEY");
		expect(result.missingFields).toContain("ONEKHUSA_API_SECRET");
		expect(result.missingFields).toContain("ONEKHUSA_ORGANISATION_ID");
	});

	it("throws on unknown PSP name", () => {
		const config = loadEnvConfig();
		expect(() => validatePSPConfig(config, "unknown" as any)).toThrow(
			"Unknown PSP: unknown",
		);
	});
});
