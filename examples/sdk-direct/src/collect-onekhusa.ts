/**
 * OneKhusa Collection Example
 *
 * Demonstrates how to collect money from a customer using OneKhusa.
 * OneKhusa uses a "request to pay" model - you send a payment request
 * to the customer's mobile money account and they approve it.
 *
 * OneKhusa operates primarily in Malawi (MWK) and supports Airtel Money
 * and TNM Mpamba via the MOBILE_MONEY payment method.
 */

import { ChiaSDK, isServiceError } from "@chiahq/sdk";
import type { InitiateCollectionRequest } from "@chiahq/sdk/dist/services/onekhusa/types/collection";

async function main() {
  console.log("=== OneKhusa Collection (Request to Pay) ===\n");

  // Step 1: Initialize the SDK with OneKhusa credentials.
  // OneKhusa requires three credentials: API key, API secret, and organisation ID.
  // The SDK handles OAuth2 token management (client_credentials flow) automatically.
  const sdk = ChiaSDK.create({
    onekhusa: {
      apiKey: process.env.ONEKHUSA_API_KEY || "",
      apiSecret: process.env.ONEKHUSA_API_SECRET || "",
      organisationId: process.env.ONEKHUSA_ORGANISATION_ID || "",
      environment: "DEVELOPMENT",
    },
  });

  // Step 2: Check if the OneKhusa service is available.
  // This hits the /health endpoint and confirms connectivity.
  console.log("Checking service status...\n");

  const status = await sdk.onekhusa.checkStatus();

  if ("errorMessage" in status) {
    console.error("Status check failed:", status.errorMessage);
    return;
  }

  console.log(`  Available: ${status.available}`);
  console.log(`  Environment: ${status.environment}`);
  console.log();

  // Step 3: Initiate a request-to-pay.
  // This sends a USSD prompt to the customer's phone. They will see
  // a message asking them to confirm the payment.
  //
  // The request fields:
  //   amount - numeric amount (not a string, unlike PayChangu/PawaPay)
  //   currency - "MWK", "ZMW", "KES", etc.
  //   phone - customer's phone number
  //   paymentMethod - "MOBILE_MONEY" or "BANK_TRANSFER"
  //   reference - your internal reference (optional but recommended)
  //   description - human-readable description shown to customer
  //   callbackUrl - webhook URL for status updates
  //   metadata - key-value pairs for your own tracking
  console.log("Initiating request to pay...\n");

  const collectionResult = await sdk.onekhusa.collections.initiateRequestToPay({
    amount: 1000,
    currency: "MWK",
    phone: "+265888123456",       // Airtel Malawi number
    paymentMethod: "MOBILE_MONEY",
    reference: `order-${Date.now()}`,
    description: "Payment for order #12345",
    callbackUrl: "https://your-server.com/webhooks/onekhusa",
    metadata: {
      orderId: "12345",
      customerId: "cust-001",
    },
  });

  if (isServiceError(collectionResult)) {
    console.error("Collection failed:", collectionResult.errorMessage);
    console.error("Status code:", collectionResult.statusCode);
    return;
  }

  // The response includes:
  //   id - OneKhusa's transaction ID (use this to check status later)
  //   tan - Transaction Authorization Number (customer may need this)
  //   status - initial status, typically "PENDING"
  console.log(`  Transaction ID: ${collectionResult.id}`);
  console.log(`  TAN: ${collectionResult.tan}`);
  console.log(`  Status: ${collectionResult.status}`);
  console.log(`  Amount: ${collectionResult.amount} ${collectionResult.currency}`);
  console.log(`  Phone: ${collectionResult.phone}`);
  console.log(`  Created: ${collectionResult.createdAt}`);
  if (collectionResult.expiresAt) {
    console.log(`  Expires: ${collectionResult.expiresAt}`);
  }
  console.log();

  // Step 4: Check the transaction status.
  // Collection statuses: PENDING -> COMPLETED | FAILED | CANCELLED | EXPIRED
  //
  // In production, rely on the callbackUrl webhook for real-time updates.
  // Use getTransaction as a fallback or for manual verification.
  console.log("Checking transaction status...\n");

  const txResult = await sdk.onekhusa.collections.getTransaction(collectionResult.id);

  if (isServiceError(txResult)) {
    console.error("Status check failed:", txResult.errorMessage);
    return;
  }

  console.log(`  Transaction ID: ${txResult.id}`);
  console.log(`  Collection ID: ${txResult.collectionId}`);
  console.log(`  Status: ${txResult.status}`);
  console.log(`  Amount: ${txResult.amount} ${txResult.currency}`);
  if (txResult.fee !== undefined) {
    console.log(`  Fee: ${txResult.fee} ${txResult.currency}`);
  }
  if (txResult.providerReference) {
    console.log(`  Provider ref: ${txResult.providerReference}`);
  }
  if (txResult.failureReason) {
    console.log(`  Failure reason: ${txResult.failureReason}`);
  }
  if (txResult.completedAt) {
    console.log(`  Completed: ${txResult.completedAt}`);
  }
}

main().catch(console.error);
