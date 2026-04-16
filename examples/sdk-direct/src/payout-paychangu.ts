/**
 * PayChangu Payout Example
 *
 * Demonstrates how to send money to a recipient via mobile money using PayChangu.
 * This is the "money out" flow - disbursing funds from your PayChangu account
 * to a customer's mobile money wallet.
 *
 * PayChangu supports payouts to Airtel Money and TNM Mpamba in Malawi.
 */

import { ChiaSDK } from "@chiahq/sdk";

async function main() {
  console.log("=== PayChangu Mobile Money Payout ===\n");

  // Step 1: Initialize the SDK.
  const sdk = ChiaSDK.create({
    paychangu: {
      secretKey: process.env.PAYCHANGU_SECRET_KEY || "",
      environment: "DEVELOPMENT",
    },
  });

  // Step 2: Get available mobile money operators.
  // You need the operator's ref_id to specify which network to send to.
  console.log("Fetching mobile money operators...\n");

  const operatorsResult = await sdk.paychangu.getMobileMoneyOperators();

  if (operatorsResult.payload.HasError) {
    console.error("Failed to fetch operators:", operatorsResult.payload.ErrorMessage);
    return;
  }

  console.log("Available operators:");
  for (const op of operatorsResult.payload.Operators) {
    console.log(`  - ${JSON.stringify(op)}`);
  }
  console.log();

  // Step 3: Initiate a mobile money payout.
  // This sends money directly to the recipient's mobile money wallet.
  // No approval is needed from the recipient - the funds arrive automatically.
  //
  // Parameters:
  //   mobile - recipient phone number
  //   operatorRefId - the operator's reference ID from step 2
  //   amount - amount to send
  //   chargeId - your unique transaction reference
  //   options - optional recipient details and test mode settings
  const chargeId = `payout-${Date.now()}`;

  console.log(`Initiating payout of MWK 2000 to 0999100200 (charge_id: ${chargeId})...\n`);

  const payoutResult = await sdk.paychangu.initializeMobileMoneyPayout(
    "0999100200",           // TNM Mpamba number in Malawi
    "tnm-malawi-ref",       // Replace with actual operator ref_id from step 2
    2000,                   // Amount in MWK
    chargeId,
    {
      firstName: "Grace",
      lastName: "Phiri",
      email: "grace.phiri@example.com",
      // In sandbox mode, simulate the outcome:
      transactionStatus: "successful",
    },
  );

  if (payoutResult.payload.HasError) {
    console.error("Payout failed:", payoutResult.payload.ErrorMessage);
    return;
  }

  console.log("Payout initiated!");
  console.log("Payout details:", JSON.stringify(payoutResult.payload.PayoutDetails, null, 2));
  console.log();

  // Step 4: Check payout status.
  // Unlike collections, payouts don't require recipient approval,
  // but they can still fail (insufficient balance, invalid number, etc).
  console.log("Checking payout status...\n");

  const statusResult = await sdk.paychangu.getMobileMoneyPayoutDetails(chargeId);

  if (statusResult.payload.HasError) {
    console.error("Status check failed:", statusResult.payload.ErrorMessage);
    return;
  }

  console.log("Payout status:", JSON.stringify(statusResult.payload.PayoutDetails, null, 2));
}

main().catch(console.error);
