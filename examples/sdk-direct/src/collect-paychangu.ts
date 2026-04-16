/**
 * PayChangu Collection Example
 *
 * Demonstrates how to collect money from a customer via mobile money using PayChangu.
 * This is the "money in" flow - requesting payment from a customer's mobile wallet.
 *
 * PayChangu is popular in Malawi and supports Airtel Money and TNM Mpamba.
 */

import { ChiaSDK } from "@chiahq/sdk";

async function main() {
  console.log("=== PayChangu Mobile Money Collection ===\n");

  // Step 1: Initialize the SDK with PayChangu credentials.
  // The SDK reads PAYCHANGU_SECRET_KEY from .env automatically,
  // or you can pass it explicitly via the config object.
  const sdk = ChiaSDK.create({
    paychangu: {
      secretKey: process.env.PAYCHANGU_SECRET_KEY || "",
      environment: "DEVELOPMENT",
    },
  });

  // Step 2: First, list available mobile money operators.
  // You need the operator's ref_id to initiate a collection.
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

  // Step 3: Initiate a mobile money collection.
  // This sends a payment prompt to the customer's phone. They must approve it
  // by entering their mobile money PIN on their handset.
  //
  // Parameters:
  //   mobile - customer phone number (e.g. "0888800000" for Airtel Malawi)
  //   operatorRefId - the operator's reference ID from the operators list
  //   amount - the amount to collect
  //   chargeId - your unique transaction reference (use a UUID in production)
  //   options - optional customer details and test mode settings
  const chargeId = `collect-${Date.now()}`;

  console.log(`Initiating collection of MWK 500 (charge_id: ${chargeId})...\n`);

  const collectResult = await sdk.paychangu.initializeMobileMoneyCollection(
    "0888800000",           // Airtel Malawi number
    "airtel-malawi-ref",    // Replace with actual operator ref_id from step 2
    500,                    // Amount in MWK
    chargeId,
    {
      firstName: "John",
      lastName: "Banda",
      email: "john.banda@example.com",
      // In sandbox mode, use transactionStatus to simulate outcomes:
      transactionStatus: "successful",
    },
  );

  if (collectResult.payload.HasError) {
    console.error("Collection failed:", collectResult.payload.ErrorMessage);
    return;
  }

  console.log("Collection initiated successfully!");
  console.log("Payment details:", JSON.stringify(collectResult.payload.PaymentDetails, null, 2));
  console.log();

  // Step 4: Verify the payment status.
  // In production, you would either:
  //   a) Wait for a webhook callback from PayChangu
  //   b) Poll this endpoint after a delay
  // The customer needs time to approve the payment on their phone.
  console.log("Verifying payment status...\n");

  const verifyResult = await sdk.paychangu.verifyMobileMoneyPayment(chargeId);

  if (verifyResult.payload.HasError) {
    console.error("Verification failed:", verifyResult.payload.ErrorMessage);
    return;
  }

  console.log("Verification result:", JSON.stringify(verifyResult.payload.PaymentDetails, null, 2));
}

main().catch(console.error);
