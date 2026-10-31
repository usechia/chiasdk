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
  const connectorId = Number(
    requiredEnvironmentVariable("ONEKHUSA_CONNECTOR_ID"),
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

  const status = await sdk.onekhusa.checkStatus();
  if (!status.available)
    throw new Error(status.error ?? "OneKhusa is unavailable");

  const result = await sdk.onekhusa.collections.initiateDirectPushPayment({
    merchantAccountNumber,
    connectorId,
    payerAccountNumber: requiredEnvironmentVariable(
      "ONEKHUSA_PAYER_ACCOUNT_NUMBER",
    ),
    sourceReferenceNumber: `ORDER${Date.now()}`,
    transactionDescription: "Payment for order 12345",
    transactionAmount: 1000,
    capturedBy,
  });

  if (isServiceError(result)) {
    throw new Error(`${result.errorMessage} (${result.statusCode})`);
  }

  console.log(result);
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "OneKhusa collection failed",
  );
  process.exitCode = 1;
});
