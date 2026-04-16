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
    "0888800000",         // Customer's Airtel Malawi number
    "airtel-malawi-ref",  // Mobile money operator reference ID
    500,                  // MWK 500
    collectChargeId,
    {
      firstName: "Chimwemwe",
      lastName: "Mwale",
      email: "chimwemwe@example.com",
      transactionStatus: "successful",  // Sandbox: simulate success
    },
  );

  if (collectResult.payload.HasError) {
    console.log(`  Error: ${collectResult.payload.ErrorMessage}`);
  } else {
    console.log(`  Charge ID: ${collectChargeId}`);
    console.log(`  Status: ${collectResult.payload.PaymentDetails?.status || "initiated"}`);
    console.log(`  Details: ${JSON.stringify(collectResult.payload.PaymentDetails, null, 2)}`);
  }
  console.log();

  // --- Verify ---

  step(2, "Verify: verifyMobileMoneyPayment");

  const verifyResult = await sdk.paychangu.verifyMobileMoneyPayment(collectChargeId);

  if (verifyResult.payload.HasError) {
    console.log(`  Error: ${verifyResult.payload.ErrorMessage}`);
  } else {
    console.log(`  Verified status: ${verifyResult.payload.PaymentDetails?.status || "unknown"}`);
  }
  console.log();

  // --- Payout (money out) ---

  step(3, "Payout: initializeMobileMoneyPayout");

  // Send money to a recipient's TNM Mpamba wallet.
  // No recipient approval needed - funds arrive automatically.
  const payoutChargeId = `pc-payout-${Date.now()}`;

  const payoutResult = await sdk.paychangu.initializeMobileMoneyPayout(
    "0999100200",       // Recipient's TNM Mpamba number
    "tnm-malawi-ref",   // Mobile money operator reference ID
    1000,               // MWK 1000
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
    console.log(`  Details: ${JSON.stringify(payoutResult.payload.PayoutDetails, null, 2)}`);
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
    console.log(`  Error: ${(availability as { errorMessage: string }).errorMessage}`);
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
    console.log(`  Error: ${(prediction as { errorMessage: string }).errorMessage}`);
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
    console.log(`  Error: ${depositResult.errorMessage} (${depositResult.statusCode})`);
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
      console.log(`  Amount: ${depositStatus.amount} ${depositStatus.currency}`);
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
    console.log(`  Error: ${payoutResult.errorMessage} (${payoutResult.statusCode})`);
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

  if (
    !process.env.ONEKHUSA_API_KEY ||
    !process.env.ONEKHUSA_API_SECRET ||
    !process.env.ONEKHUSA_ORGANISATION_ID
  ) {
    console.log("  Skipped - OneKhusa credentials not set\n");
    console.log("  Required: ONEKHUSA_API_KEY, ONEKHUSA_API_SECRET, ONEKHUSA_ORGANISATION_ID");
    return;
  }

  const sdk = ChiaSDK.create({
    onekhusa: {
      apiKey: process.env.ONEKHUSA_API_KEY,
      apiSecret: process.env.ONEKHUSA_API_SECRET,
      organisationId: process.env.ONEKHUSA_ORGANISATION_ID,
      environment: "DEVELOPMENT",
    },
  });

  // --- Health check ---

  step(1, "Check status");

  const status = await sdk.onekhusa.checkStatus();

  if ("errorMessage" in status) {
    console.log(`  Error: ${(status as { errorMessage: string }).errorMessage}`);
    return;
  }

  const healthStatus = status as { available: boolean; environment: string };
  console.log(`  Available: ${healthStatus.available}`);
  console.log(`  Environment: ${healthStatus.environment}`);
  console.log();

  // --- Collection ---

  step(2, "Collect: collections.initiateRequestToPay");

  // OneKhusa sends a request-to-pay to the customer's phone.
  // The customer sees a USSD prompt and approves with their PIN.
  const collectionResult = await sdk.onekhusa.collections.initiateRequestToPay({
    amount: 1000,
    currency: "MWK",
    phone: "+265888123456",
    paymentMethod: "MOBILE_MONEY",
    reference: `order-${Date.now()}`,
    description: "Monthly subscription payment",
    callbackUrl: "https://your-server.com/webhooks/onekhusa",
    metadata: {
      orderId: "12345",
      planId: "premium",
    },
  });

  if (isServiceError(collectionResult)) {
    console.log(`  Error: ${collectionResult.errorMessage} (${collectionResult.statusCode})`);
  } else {
    console.log(`  Transaction ID: ${collectionResult.id}`);
    console.log(`  TAN: ${collectionResult.tan}`);
    console.log(`  Status: ${collectionResult.status}`);
    console.log(`  Amount: ${collectionResult.amount} ${collectionResult.currency}`);
  }
  console.log();

  // --- Check collection status ---

  step(3, "Check: collections.getTransaction");

  if (!isServiceError(collectionResult)) {
    const txResult = await sdk.onekhusa.collections.getTransaction(collectionResult.id);

    if (isServiceError(txResult)) {
      console.log(`  Error: ${txResult.errorMessage}`);
    } else {
      console.log(`  Transaction ID: ${txResult.id}`);
      console.log(`  Status: ${txResult.status}`);
      if (txResult.completedAt) {
        console.log(`  Completed: ${txResult.completedAt}`);
      }
    }
  }
  console.log();

  // --- Disbursement (payout) ---

  step(4, "Disburse: disbursements.addSingle + approveSingle");

  // OneKhusa disbursements use a two-step process:
  //   1. addSingle - creates the disbursement in PENDING state
  //   2. approveSingle - approves it for processing
  //
  // This allows for review workflows where a different user approves payments.
  // For automated payouts, call both steps back-to-back.

  const disbursementResult = await sdk.onekhusa.disbursements.addSingle({
    amount: 2000,
    currency: "MWK",
    recipient: {
      name: "James Kamanga",
      phone: "+265999876543",     // TNM Mpamba number
      email: "james.k@example.com",
    },
    paymentMethod: "MOBILE_MONEY",
    reference: `payout-${Date.now()}`,
    description: "Freelancer payment - March invoice",
    callbackUrl: "https://your-server.com/webhooks/onekhusa",
    metadata: {
      invoiceId: "INV-2024-0042",
    },
  });

  if (isServiceError(disbursementResult)) {
    console.log(`  Error creating disbursement: ${disbursementResult.errorMessage}`);
    return;
  }

  console.log(`  Disbursement ID: ${disbursementResult.id}`);
  console.log(`  Status: ${disbursementResult.status}`);
  console.log(`  Amount: ${disbursementResult.amount} ${disbursementResult.currency}`);
  console.log(`  Recipient: ${disbursementResult.recipient.name} (${disbursementResult.recipient.phone})`);
  console.log();

  // Now approve it to trigger the actual payout.
  console.log("  Approving disbursement...\n");

  const approvalResult = await sdk.onekhusa.disbursements.approveSingle(
    disbursementResult.id,
    { comment: "Approved - verified invoice" },
  );

  if (isServiceError(approvalResult)) {
    console.log(`  Error approving: ${approvalResult.errorMessage}`);
  } else {
    console.log(`  Disbursement ID: ${approvalResult.id}`);
    console.log(`  Status: ${approvalResult.status}`);
    if (approvalResult.approvedAt) {
      console.log(`  Approved at: ${approvalResult.approvedAt}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Chia SDK - Direct Provider Access ===");
  console.log();
  console.log("This example shows how to use each provider directly via the SDK.");
  console.log("For managed billing (recommended), see the platform-subscribe example.");
  console.log();
  console.log("Providers configured:");
  console.log(`  PayChangu: ${process.env.PAYCHANGU_SECRET_KEY ? "yes" : "no (set PAYCHANGU_SECRET_KEY)"}`);
  console.log(`  PawaPay:   ${process.env.PAWAPAY_JWT ? "yes" : "no (set PAWAPAY_JWT)"}`);
  console.log(`  OneKhusa:  ${process.env.ONEKHUSA_API_KEY ? "yes" : "no (set ONEKHUSA_API_KEY + API_SECRET + ORGANISATION_ID)"}`);

  await demoPayChangu();
  await demoPawaPay();
  await demoOneKhusa();

  separator("Done");
  console.log("Each provider was demonstrated independently above.");
  console.log("See the individual scripts for more detailed examples:");
  console.log("  pnpm collect:paychangu   pnpm payout:paychangu");
  console.log("  pnpm collect:pawapay     pnpm payout:pawapay");
  console.log("  pnpm collect:onekhusa");
  console.log();
}

main().catch(console.error);
