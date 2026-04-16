// Platform Subscribe Flow Example
// Shows how Chia handles subscription billing as merchant of record.
//
// This script walks through the complete lifecycle:
//   1. List plans from your Chia dashboard
//   2. Create a subscription intent (initiates payment)
//   3. Poll until the subscriber confirms via mobile money
//   4. View the resulting subscriber and payment records

import { ChiaSDK, isServiceError } from "@chiahq/sdk";

// Initialize with your platform API key (from dashboard Settings > API Keys)
const sdk = ChiaSDK.create({
	platform: {
		apiKey: process.env.CHIA_API_KEY || "sk_test_your_key_here",
		baseUrl: process.env.CHIA_API_URL || "http://localhost:3001",
	},
});

async function main() {
	console.log("=== Chia Platform Subscribe Flow ===\n");

	// Step 1: List available plans
	// Plans are created in your Chia dashboard (or via sdk.platform.plans.create).
	// Each plan defines the amount, currency, billing interval, and payment provider.
	console.log("1. Fetching plans...");
	const plans = await sdk.platform.plans.list();

	if (isServiceError(plans)) {
		console.error(`   Failed to fetch plans: ${plans.errorMessage}`);
		return;
	}

	console.log(`   Found ${plans.length} plans:`);
	for (const plan of plans) {
		console.log(`   - ${plan.name}: ${plan.currency} ${plan.amount}/${plan.interval} (${plan.provider})`);
	}

	if (plans.length === 0) {
		console.log("\n   No plans found. Create one in your dashboard first.");
		return;
	}

	const plan = plans[0];
	console.log(`\n   Using plan: "${plan.name}"\n`);

	// Step 2: Create a subscription intent
	// This initiates a mobile money payment. The subscriber will receive a prompt
	// on their phone (USSD push, STK push, etc. depending on the provider).
	console.log("2. Creating subscription intent...");
	const intent = await sdk.platform.subscriptions.create({
		planId: plan.id,
		phone: "+265888123456", // subscriber's mobile money number
		name: "Jane Banda", // optional - displayed in dashboard
	});

	if (isServiceError(intent)) {
		console.error(`   Failed to create intent: ${intent.errorMessage}`);
		return;
	}

	console.log(`   Intent created: ${intent.id}`);
	console.log(`   Status: ${intent.status}`);
	console.log(`   Expires at: ${intent.expiresAt}`);

	if (intent.nextActionType) {
		console.log(`   Next action: ${intent.nextActionType}`);

		// The nextActionType tells you what the subscriber needs to do.
		// Common values:
		//   "ussd_prompt" - a USSD prompt was sent to their phone (they enter PIN)
		//   "redirect"    - redirect subscriber to a payment page
		//   "tan_prompt"  - subscriber enters a TAN/OTP sent via SMS
		//   "pin_prompt"  - subscriber enters their mobile money PIN
		//   "wait_for_webhook" - payment is processing, wait for webhook callback
		switch (intent.nextActionType) {
			case "ussd_prompt":
				console.log("   -> A USSD prompt has been sent to the subscriber's phone");
				console.log("   -> They need to enter their mobile money PIN to confirm");
				break;
			case "redirect":
				console.log(`   -> Redirect subscriber to: ${JSON.stringify(intent.nextActionPayload)}`);
				break;
			default:
				console.log(`   -> Payload: ${JSON.stringify(intent.nextActionPayload)}`);
		}
	}

	// Step 3: Poll for payment completion
	// In production, you would use webhooks instead of polling (see webhook-server.ts).
	// Polling is shown here for simplicity.
	console.log("\n3. Polling for payment status...");

	let attempts = 0;
	const maxAttempts = 20;

	while (attempts < maxAttempts) {
		await new Promise((r) => setTimeout(r, 3000));
		attempts++;

		const status = await sdk.platform.subscriptions.get(intent.id);

		if (isServiceError(status)) {
			console.log(`   [${attempts}] Error checking status: ${status.errorMessage}`);
			continue;
		}

		console.log(`   [${attempts}] Status: ${status.status}`);

		if (status.status === "succeeded") {
			console.log("\n   Payment successful!");
			console.log(`   Subscriber ID: ${status.subscriberId}`);
			console.log(`   Payment ID: ${status.paymentId}`);
			console.log("   The subscriber is now active.");
			console.log("   Chia will handle renewals automatically.");
			break;
		}

		if (status.status === "failed" || status.status === "expired" || status.status === "cancelled") {
			console.log(`\n   Payment ${status.status}.`);
			break;
		}
	}

	if (attempts >= maxAttempts) {
		console.log("\n   Polling timeout. Check the dashboard for status.");
	}

	// Step 4: Check subscribers
	// After a successful payment, the subscriber record is created automatically.
	console.log("\n4. Listing subscribers...");
	const subscribers = await sdk.platform.subscribers.list();

	if (isServiceError(subscribers)) {
		console.error(`   Failed to list subscribers: ${subscribers.errorMessage}`);
	} else {
		console.log(`   Total subscribers: ${subscribers.length}`);
		for (const sub of subscribers.slice(0, 5)) {
			console.log(`   - ${sub.name ?? sub.phone}: ${sub.status} (${sub.currentPeriodStart} to ${sub.currentPeriodEnd})`);
		}
	}

	// Step 5: Check payments
	// Each subscription intent that succeeds creates a payment record.
	// Renewals also create payment records automatically.
	console.log("\n5. Listing recent payments...");
	const payments = await sdk.platform.payments.list();

	if (isServiceError(payments)) {
		console.error(`   Failed to list payments: ${payments.errorMessage}`);
	} else {
		for (const payment of payments.slice(0, 5)) {
			console.log(`   - ${payment.currency} ${payment.amount}: ${payment.status} (${payment.kind})`);
		}
	}

	console.log("\n=== Done ===");
	console.log("\nWhat happens next:");
	console.log("- Chia automatically renews the subscription at the billing interval");
	console.log("- Failed renewals are retried with exponential backoff");
	console.log("- Configure webhooks to get real-time notifications (see webhook-server.ts)");
	console.log("- Manage subscribers from your dashboard or via the SDK");
}

main().catch(console.error);
