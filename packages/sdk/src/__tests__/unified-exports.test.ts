import * as sdk from "../index";

test("the unified surface is exported from the package root", () => {
	expect(sdk.ChiaError).toBeDefined();
	expect(sdk.ChiaConfigError).toBeDefined();
	expect(sdk.ChiaValidationError).toBeDefined();
	expect(sdk.ChiaAuthError).toBeDefined();
	expect(sdk.ChiaProviderError).toBeDefined();
	expect(sdk.ChiaNetworkError).toBeDefined();
	expect(sdk.ChiaRoutingError).toBeDefined();
	expect(sdk.PROVIDER_COVERAGE).toBeDefined();
});

test("the existing provider surface is still exported", () => {
	expect(sdk.ChiaSDK).toBeDefined();
	expect(sdk.PawaPay).toBeDefined();
	expect(sdk.PayChangu).toBeDefined();
	expect(sdk.OneKhusa).toBeDefined();
});
