/**
 * PawaPay Payout Example
 *
 * Demonstrates how to send money to a recipient using PawaPay.
 * PawaPay payouts disburse funds from your merchant wallet to a customer's
 * mobile money account.
 *
 * This example uses Kenya (KES) with M-Pesa, but the same pattern works
 * for any of PawaPay's 20+ supported countries.
 */

import { ChiaSDK, isServiceError, type PawaPayTypes } from "@chiahq/sdk";
import crypto from "node:crypto";

async function main() {
  console.log("=== PawaPay Payout ===\n");

  // Step 1: Initialize the SDK.
  const sdk = ChiaSDK.create({
    pawapay: {
      jwt: process.env.PAWAPAY_JWT || "",
      environment: "DEVELOPMENT",
    },
  });

  // Step 2: Predict the provider from the recipient's phone number.
  // This ensures you route the payout to the correct operator.
  const phoneNumber = "254712345678"; // Kenyan Safaricom (M-Pesa) number

  console.log(`Predicting provider for ${phoneNumber}...\n`);

  const prediction = await sdk.pawapay.predictProvider(phoneNumber);

  if ("errorMessage" in prediction) {
    console.error("Provider prediction failed:", prediction.errorMessage);
    return;
  }

  console.log(`  Country: ${prediction.country}`);
  console.log(`  Provider: ${prediction.provider}`);  // e.g. "MPESA_KEN"
  console.log();

  // Step 3: Send a payout.
  // The payoutId must be a UUID v4 for idempotency.
  // Unlike deposits, payouts don't require customer approval -
  // the money is sent directly to their mobile money account.
  const payoutId = crypto.randomUUID();

  const payoutRequest: PawaPayTypes.PayoutRequest = {
    payoutId,
    amount: "500",                // Amount in KES (Kenyan Shillings)
    currency: "KES",
    recipient: {
      type: "MMO",
      accountDetails: {
        phoneNumber: prediction.phoneNumber,
        provider: prediction.provider,  // e.g. "MPESA_KEN"
      },
    },
  };

  console.log(`Sending payout of KES 500 (${payoutId})...\n`);

  const payoutResult = await sdk.pawapay.payouts.sendPayout(payoutRequest);

  if (isServiceError(payoutResult)) {
    console.error("Payout failed:", payoutResult.errorMessage);
    console.error("Status code:", payoutResult.statusCode);
    return;
  }

  console.log(`  Payout ID: ${payoutResult.payoutId}`);
  console.log(`  Status: ${payoutResult.status}`);
  if (payoutResult.created) {
    console.log(`  Created: ${payoutResult.created}`);
  }
  if (payoutResult.failureReason) {
    console.log(`  Failure: ${payoutResult.failureReason.failureCode} - ${payoutResult.failureReason.failureMessage}`);
  }
  console.log();

  // Step 4: Check the payout status.
  // Payout statuses: ACCEPTED -> PROCESSING | ENQUEUED -> COMPLETED | FAILED
  //
  // ENQUEUED means the payout is queued because the provider is temporarily
  // unavailable. PawaPay will retry automatically.
  // You can cancel an ENQUEUED payout with payouts.cancelEnqueuedPayout().
  console.log("Checking payout status...\n");

  const statusResult = await sdk.pawapay.payouts.getPayout(payoutId);

  if (isServiceError(statusResult)) {
    console.error("Status check failed:", statusResult.errorMessage);
    return;
  }

  // The status response wraps the payout data in a { status, data } envelope.
  // status is "FOUND" or "NOT_FOUND".
  console.log(`  Lookup status: ${statusResult.status}`);
  if (statusResult.data) {
    console.log(`  Payout ID: ${statusResult.data.payoutId}`);
    console.log(`  Status: ${statusResult.data.status}`);
    if (statusResult.data.amount) {
      console.log(`  Amount: ${statusResult.data.amount} ${statusResult.data.currency}`);
    }
    if (statusResult.data.recipient) {
      console.log(`  Recipient: ${statusResult.data.recipient.accountDetails.phoneNumber}`);
    }
    if (statusResult.data.failureReason) {
      console.log(`  Failure: ${statusResult.data.failureReason.failureCode} - ${statusResult.data.failureReason.failureMessage}`);
    }
  }
}

main().catch(console.error);
