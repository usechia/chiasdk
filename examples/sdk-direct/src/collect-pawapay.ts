/**
 * PawaPay Deposit Example
 *
 * Demonstrates how to collect money from a customer using PawaPay.
 * PawaPay calls collections "deposits" - money deposited into your merchant account
 * from the customer's mobile money wallet.
 *
 * PawaPay operates across 20+ African countries. This example uses Zambia (ZMW)
 * with Airtel Money, but the same pattern works for any supported country.
 */

import { ChiaSDK, isServiceError, type PawaPayTypes } from "@chiahq/sdk";
import crypto from "node:crypto";

async function main() {
  console.log("=== PawaPay Deposit (Collection) ===\n");

  // Step 1: Initialize the SDK with PawaPay credentials.
  const sdk = ChiaSDK.create({
    pawapay: {
      jwt: process.env.PAWAPAY_JWT || "",
      environment: "DEVELOPMENT",
    },
  });

  // Step 2: Check provider availability.
  // This tells you which operators are live in each country and whether
  // deposits/payouts are operational, delayed, or closed.
  console.log("Checking provider availability...\n");

  const availability = await sdk.pawapay.getAvailability();

  if ("errorMessage" in availability) {
    console.error("Failed to check availability:", availability.errorMessage);
    return;
  }

  for (const country of availability) {
    console.log(`  ${country.country}:`);
    for (const provider of country.providers) {
      const depositStatus = provider.operationTypes.DEPOSIT || "N/A";
      console.log(`    ${provider.provider} - deposits: ${depositStatus}`);
    }
  }
  console.log();

  // Step 3: Predict the mobile money provider from a phone number.
  // PawaPay can determine the correct operator from the number prefix,
  // so you don't need to ask the customer which provider they use.
  const phoneNumber = "260971234567"; // Zambian Airtel number

  console.log(`Predicting provider for ${phoneNumber}...\n`);

  const prediction = await sdk.pawapay.predictProvider(phoneNumber);

  if ("errorMessage" in prediction) {
    console.error("Provider prediction failed:", prediction.errorMessage);
    return;
  }

  console.log(`  Country: ${prediction.country}`);
  console.log(`  Provider: ${prediction.provider}`);
  console.log(`  Phone: ${prediction.phoneNumber}`);
  console.log();

  // Step 4: Send a deposit request.
  // This initiates a USSD push to the customer's phone. They see a prompt
  // asking them to confirm the payment and enter their PIN.
  //
  // The depositId must be a UUID v4 - PawaPay uses it for idempotency.
  // If you retry with the same depositId, PawaPay returns DUPLICATE_IGNORED.
  const depositId = crypto.randomUUID();

  const depositRequest: PawaPayTypes.DepositRequest = {
    depositId,
    amount: "100",                // Amount in ZMW (Zambian Kwacha)
    currency: "ZMW",
    payer: {
      type: "MMO",
      accountDetails: {
        phoneNumber: prediction.phoneNumber,
        provider: prediction.provider,  // e.g. "AIRTEL_ZMB"
      },
    },
  };

  console.log(`Sending deposit request (${depositId})...\n`);

  const depositResult = await sdk.pawapay.deposits.sendDeposit(depositRequest);

  // PawaPay and OneKhusa methods return ServiceResult<T>, which is either
  // the success type or a ServiceError. Use isServiceError() to check.
  if (isServiceError(depositResult)) {
    console.error("Deposit failed:", depositResult.errorMessage);
    console.error("Status code:", depositResult.statusCode);
    return;
  }

  console.log(`  Deposit ID: ${depositResult.depositId}`);
  console.log(`  Status: ${depositResult.status}`);
  if (depositResult.nextStep) {
    console.log(`  Next step: ${depositResult.nextStep}`);
  }
  console.log();

  // Step 5: Check the deposit status.
  // After initiating, the deposit goes through these states:
  //   ACCEPTED -> PROCESSING -> COMPLETED | FAILED
  //
  // In production, you would:
  //   a) Register a webhook callback URL with PawaPay to receive status updates
  //   b) Poll getDeposit as a fallback
  //
  // The customer typically has 60-90 seconds to approve on their phone.
  console.log("Checking deposit status...\n");

  const statusResult = await sdk.pawapay.deposits.getDeposit(depositId);

  if (isServiceError(statusResult)) {
    console.error("Status check failed:", statusResult.errorMessage);
    return;
  }

  console.log(`  Deposit ID: ${statusResult.depositId}`);
  console.log(`  Status: ${statusResult.status}`);
  if (statusResult.amount) console.log(`  Amount: ${statusResult.amount} ${statusResult.currency}`);
  if (statusResult.payer) console.log(`  Payer: ${statusResult.payer.accountDetails.phoneNumber}`);
  if (statusResult.failureReason) {
    console.log(`  Failure: ${statusResult.failureReason.failureCode} - ${statusResult.failureReason.failureMessage}`);
  }
}

main().catch(console.error);
