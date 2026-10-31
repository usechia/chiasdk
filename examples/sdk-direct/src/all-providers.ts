/**
 * Chia SDK - All Providers Demo
 *
 * A comprehensive script showing all three payment providers side by side.
 * Each section initializes the SDK with that provider's config, demonstrates
 * collections (money in), status checks, and payouts (money out).
 *
 * For managed billing with automatic retries, webhooks, and subscription
 * lifecycle management, see the platform-subscribe example instead.
 */

import { ChiaSDK, isServiceError, type PawaPayTypes } from "@chiahq/sdk";
import crypto from "node:crypto";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function separator(title: string) {
  console.log("\n" + "=".repeat(60));
  console.log(`  ${title}`);
  console.log("=".repeat(60) + "\n");
}

function step(n: number, label: string) {
  console.log(`${n}. ${label}\n`);
}

// ---------------------------------------------------------------------------
// PayChangu
// ---------------------------------------------------------------------------

async function demoPayChangu() {
  separator("PayChangu (Malawi - MWK)");

  // PayChangu uses a different error pattern than PawaPay/OneKhusa.
  // Methods return objects with { type, payload } where payload.HasError
  // indicates success or failure.

  if (!process.env.PAYCHANGU_SECRET_KEY) {
    console.log("  Skipped - PAYCHANGU_SECRET_KEY not set\n");
    return;
  }

  const sdk = ChiaSDK.create({
    paychangu: {
      secretKey: process.env.PAYCHANGU_SECRET_KEY,
      environment: "DEVELOPMENT",
    },
  });

  // --- Collection (money in) ---

  step(1, "Collect: initializeMobileMoneyCollection");

  // Initiate a mobile money collection from a customer's Airtel Malawi wallet.
  // The customer receives a USSD prompt to approve the payment.
  const collectChargeId = `pc-collect-${Date.now()}`;

  const collectResult = await sdk.paychangu.initializeMobileMoneyCollection(
    "0888800000", // Customer's Airtel Malawi number
    "airtel-malawi-ref", // Mobile money operator reference ID
    500, // MWK 500
    collectChargeId,
    {
      firstName: "Chimwemwe",
      lastName: "Mwale",
      email: "chimwemwe@example.com",
      transactionStatus: "successful", // Sandbox: simulate success
    },
  );

  if (collectResult.payload.HasError) {
    console.log(`  Error: ${collectResult.payload.ErrorMessage}`);
  } else {
    console.log(`  Charge ID: ${collectChargeId}`);
    console.log(
      `  Status: ${collectResult.payload.PaymentDetails?.status || "initiated"}`,
    );
    console.log(
      `  Details: ${JSON.stringify(collectResult.payload.PaymentDetails, null, 2)}`,
    );
  }
  console.log();

  // --- Verify ---

  step(2, "Verify: verifyMobileMoneyPayment");

  const verifyResult =
    await sdk.paychangu.verifyMobileMoneyPayment(collectChargeId);

  if (verifyResult.payload.HasError) {
    console.log(`  Error: ${verifyResult.payload.ErrorMessage}`);
  } else {
    console.log(
      `  Verified status: ${verifyResult.payload.PaymentDetails?.status || "unknown"}`,
    );
  }
  console.log();

  // --- Payout (money out) ---

  step(3, "Payout: initializeMobileMoneyPayout");

  // Send money to a recipient's TNM Mpamba wallet.
  // No recipient approval needed - funds arrive automatically.
  const payoutChargeId = `pc-payout-${Date.now()}`;

  const payoutResult = await sdk.paychangu.initializeMobileMoneyPayout(
    "0999100200", // Recipient's TNM Mpamba number
    "tnm-malawi-ref", // Mobile money operator reference ID
    1000, // MWK 1000
    payoutChargeId,
    {
      firstName: "Grace",
      lastName: "Phiri",
      transactionStatus: "successful",
    },
  );

  if (payoutResult.payload.HasError) {
    console.log(`  Error: ${payoutResult.payload.ErrorMessage}`);
  } else {
    console.log(`  Charge ID: ${payoutChargeId}`);
    console.log(
      `  Details: ${JSON.stringify(payoutResult.payload.PayoutDetails, null, 2)}`,
    );
  }
}

// ---------------------------------------------------------------------------
// PawaPay
// ---------------------------------------------------------------------------

async function demoPawaPay() {
  separator("PawaPay (Zambia - ZMW)");

  // PawaPay and OneKhusa methods return ServiceResult<T>, which is either
  // the success type or a ServiceError object. Use isServiceError() to check.

  if (!process.env.PAWAPAY_JWT) {
    console.log("  Skipped - PAWAPAY_JWT not set\n");
    return;
  }

  const sdk = ChiaSDK.create({
    pawapay: {
      jwt: process.env.PAWAPAY_JWT,
      environment: "DEVELOPMENT",
    },
  });

  // --- Check availability ---

  step(1, "Check availability");

  const availability = await sdk.pawapay.getAvailability();

  if ("errorMessage" in availability) {
    console.log(
      `  Error: ${(availability as { errorMessage: string }).errorMessage}`,
    );
  } else {
    const countries = availability as PawaPayTypes.CountryAvailability[];
    console.log(`  ${countries.length} countries available`);
    // Show first 3 countries as a sample
    for (const country of countries.slice(0, 3)) {
      const providers = country.providers.map((p) => p.provider).join(", ");
      console.log(`  ${country.country}: ${providers}`);
    }
    if (countries.length > 3) {
      console.log(`  ... and ${countries.length - 3} more`);
    }
  }
  console.log();

  // --- Predict provider ---

  step(2, "Predict provider from phone number");

  // PawaPay can determine the correct mobile money operator from the number.
  const phoneNumber = "260971234567"; // Zambian Airtel number

  const prediction = await sdk.pawapay.predictProvider(phoneNumber);

  if ("errorMessage" in prediction) {
    console.log(
      `  Error: ${(prediction as { errorMessage: string }).errorMessage}`,
    );
    return;
  }

  const predicted = prediction as PawaPayTypes.PredictProviderResponse;
  console.log(`  Phone: ${predicted.phoneNumber}`);
  console.log(`  Country: ${predicted.country}`);
  console.log(`  Provider: ${predicted.provider}`);
  console.log();

  // --- Deposit (collection) ---

  step(3, "Collect: deposits.sendDeposit");

  // PawaPay calls collections "deposits". The depositId must be a UUID v4.
  const depositId = crypto.randomUUID();

  const depositRequest: PawaPayTypes.DepositRequest = {
    depositId,
    amount: "100",
    currency: "ZMW",
    payer: {
      type: "MMO",
      accountDetails: {
        phoneNumber: predicted.phoneNumber,
        provider: predicted.provider,
      },
    },
  };

  const depositResult = await sdk.pawapay.deposits.sendDeposit(depositRequest);

  if (isServiceError(depositResult)) {
    console.log(
      `  Error: ${depositResult.errorMessage} (${depositResult.statusCode})`,
    );
  } else {
    console.log(`  Deposit ID: ${depositResult.depositId}`);
    console.log(`  Status: ${depositResult.status}`);
    if (depositResult.nextStep) {
      console.log(`  Next step: ${depositResult.nextStep}`);
    }
  }
  console.log();

  // --- Check deposit status ---

  step(4, "Check status: deposits.getDeposit");

  const depositStatus = await sdk.pawapay.deposits.getDeposit(depositId);

  if (isServiceError(depositStatus)) {
    console.log(`  Error: ${depositStatus.errorMessage}`);
  } else {
    console.log(`  Deposit ID: ${depositStatus.depositId}`);
    console.log(`  Status: ${depositStatus.status}`);
    if (depositStatus.amount) {
      console.log(
        `  Amount: ${depositStatus.amount} ${depositStatus.currency}`,
      );
    }
  }
  console.log();

  // --- Payout ---

  step(5, "Payout: payouts.sendPayout");

  // Send money to a Kenyan M-Pesa number. PawaPay supports cross-border
  // operations - you can collect in one country and pay out in another.
  const payoutId = crypto.randomUUID();

  const payoutRequest: PawaPayTypes.PayoutRequest = {
    payoutId,
    amount: "500",
    currency: "KES",
    recipient: {
      type: "MMO",
      accountDetails: {
        phoneNumber: "254712345678",
        provider: "MPESA_KEN",
      },
    },
  };

  const payoutResult = await sdk.pawapay.payouts.sendPayout(payoutRequest);

  if (isServiceError(payoutResult)) {
    console.log(
      `  Error: ${payoutResult.errorMessage} (${payoutResult.statusCode})`,
    );
  } else {
    console.log(`  Payout ID: ${payoutResult.payoutId}`);
    console.log(`  Status: ${payoutResult.status}`);
  }
}

// ---------------------------------------------------------------------------
// OneKhusa
// ---------------------------------------------------------------------------

async function demoOneKhusa() {
  separator("OneKhusa (Malawi - MWK)");

  const merchantAccountNumber = Number(
    process.env.ONEKHUSA_MERCHANT_ACCOUNT_NUMBER,
  );
  const connectorId = Number(process.env.ONEKHUSA_CONNECTOR_ID);
  const capturedBy = process.env.ONEKHUSA_CAPTURED_BY;

  if (
    !process.env.ONEKHUSA_API_KEY ||
    !process.env.ONEKHUSA_API_SECRET ||
    !process.env.ONEKHUSA_ORGANISATION_ID ||
    !Number.isInteger(merchantAccountNumber) ||
    !Number.isInteger(connectorId) ||
    !capturedBy
  ) {
    console.log("  Skipped - OneKhusa credentials not set\n");
    console.log(
      "  Required: OneKhusa API credentials, merchant account number, connector ID, and captured-by email",
    );
    return;
  }

  const sdk = ChiaSDK.create({
    onekhusa: {
      apiKey: process.env.ONEKHUSA_API_KEY,
      apiSecret: process.env.ONEKHUSA_API_SECRET,
      organisationId: process.env.ONEKHUSA_ORGANISATION_ID,
      merchantAccountNumber,
      defaultCapturedBy: capturedBy,
      environment: "DEVELOPMENT",
    },
  });

  step(1, "Check status");

  const status = await sdk.onekhusa.checkStatus();

  if (!status.available) {
    console.log(`  Error: ${status.error || "OneKhusa is unavailable"}`);
    return;
  }

  console.log(`  Available: ${status.available}`);
  console.log(`  Environment: ${status.environment}`);
  console.log();

  step(2, "Collect: collections.initiateDirectPushPayment");

  const collectionResult =
    await sdk.onekhusa.collections.initiateDirectPushPayment({
      merchantAccountNumber,
      connectorId,
      payerAccountNumber:
        process.env.ONEKHUSA_PAYER_ACCOUNT_NUMBER || "+265888123456",
      sourceReferenceNumber: `ORDER${Date.now()}`,
      transactionDescription: "Payment for order 12345",
      transactionAmount: 1000,
      capturedBy,
    });

  if (isServiceError(collectionResult)) {
    console.log(
      `  Error: ${collectionResult.errorMessage} (${collectionResult.statusCode})`,
    );
  } else {
    console.log(`  Response code: ${collectionResult.responseCode}`);
    console.log(`  Amount to pay: ${collectionResult.amountToPay}`);
  }
  console.log();

  step(3, "Disburse: disbursements.addSingle + approveSingle");

  const disbursementResult = await sdk.onekhusa.disbursements.addSingle({
    merchantAccountNumber,
    beneficiaryName: "James Kamanga",
    connectorId,
    beneficiaryAccountNumber:
      process.env.ONEKHUSA_PAYOUT_ACCOUNT_NUMBER || "+265999876543",
    transactionAmount: 2000,
    transactionDescription: "Freelancer payment",
    sourceReferenceNumber: `PAYOUT${Date.now()}`,
    capturedBy,
  });

  if (isServiceError(disbursementResult)) {
    console.log(
      `  Error creating disbursement: ${disbursementResult.errorMessage}`,
    );
    return;
  }

  console.log(
    `  Transaction reference: ${disbursementResult.transactionReferenceNumber}`,
  );
  console.log(`  Response code: ${disbursementResult.responseCode}`);
  console.log();

  console.log("  Approving disbursement...\n");

  const approvalResult = await sdk.onekhusa.disbursements.approveSingle({
    merchantAccountNumber,
    transactionReferenceNumber: disbursementResult.transactionReferenceNumber,
    actionedBy: capturedBy,
  });

  if (isServiceError(approvalResult)) {
    console.log(`  Error approving: ${approvalResult.errorMessage}`);
  } else {
    console.log(`  Response code: ${approvalResult.responseCode}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Chia SDK - Direct Provider Access ===");
  console.log();
  console.log(
    "This example shows how to use each provider directly via the SDK.",
  );
  console.log(
    "For managed billing (recommended), see the platform-subscribe example.",
  );
  console.log();
  console.log("Providers configured:");
  console.log(
    `  PayChangu: ${process.env.PAYCHANGU_SECRET_KEY ? "yes" : "no (set PAYCHANGU_SECRET_KEY)"}`,
  );
  console.log(
    `  PawaPay:   ${process.env.PAWAPAY_JWT ? "yes" : "no (set PAWAPAY_JWT)"}`,
  );
  console.log(
    `  OneKhusa:  ${process.env.ONEKHUSA_API_KEY ? "yes" : "no (configure all required ONEKHUSA variables)"}`,
  );

  await demoPayChangu();
  await demoPawaPay();
  await demoOneKhusa();

  separator("Done");
  console.log("Each provider was demonstrated independently above.");
  console.log("See the individual scripts for more detailed examples:");
  console.log("  pnpm collect:paychangu   pnpm payout:paychangu");
  console.log("  pnpm collect:pawapay     pnpm payout:pawapay");
  console.log("  pnpm collect:onekhusa   pnpm checkout:onekhusa");
  console.log();
}

main().catch(console.error);
