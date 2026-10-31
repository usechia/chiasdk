import { ChiaSDK, isServiceError } from "@chiahq/sdk";

function requiredEnvironmentVariable(name: string): string {
	const value = process.env[name];
	if (!value) throw new Error(`${name} is required`);
	return value;
}

async function main() {
	const merchantAccountNumber = Number(
		requiredEnvironmentVariable("ONEKHUSA_MERCHANT_ACCOUNT_NUMBER"),
	);
	const capturedBy = requiredEnvironmentVariable("ONEKHUSA_CAPTURED_BY");
	const sdk = ChiaSDK.create({
		onekhusa: {
			apiKey: requiredEnvironmentVariable("ONEKHUSA_API_KEY"),
			apiSecret: requiredEnvironmentVariable("ONEKHUSA_API_SECRET"),
			organisationId: requiredEnvironmentVariable("ONEKHUSA_ORGANISATION_ID"),
			merchantAccountNumber,
			defaultCapturedBy: capturedBy,
			environment: "DEVELOPMENT",
		},
	});

	const result = await sdk.onekhusa.collections.initiateStandardCheckout({
		payment: {
			merchantAccountNumber,
			amount: 150,
			description: "Groceries purchase",
			sourceReferenceNumber: `ORDER${Date.now()}`,
			capturedBy,
		},
		route: {
			successRedirectionUrl: requiredEnvironmentVariable(
				"ONEKHUSA_SUCCESS_REDIRECTION_URL",
			),
			failureRedirectionUrl: requiredEnvironmentVariable(
				"ONEKHUSA_FAILURE_REDIRECTION_URL",
			),
		},
	});

	if (isServiceError(result)) {
		throw new Error(`${result.errorMessage} (${result.statusCode})`);
	}

	console.log(result.checkoutUrl);
}

main().catch((error: unknown) => {
	console.error(
		error instanceof Error ? error.message : "OneKhusa checkout failed",
	);
	process.exitCode = 1;
});
