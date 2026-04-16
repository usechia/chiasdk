// Webhook Server Example
// Receive real-time events from Chia when subscriptions change.
//
// Setup:
//   1. Start this server: pnpm start:webhook-server
//   2. Expose it publicly (e.g., ngrok http 4000)
//   3. Add the public URL in your Chia dashboard: Settings > Webhooks
//   4. Copy the signing secret and set it as CHIA_WEBHOOK_SECRET
//
// Chia signs every webhook delivery with HMAC-SHA256 so you can verify
// the payload hasn't been tampered with.

import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { createHmac, timingSafeEqual } from "node:crypto";

const app = new Hono();

const WEBHOOK_SECRET = process.env.CHIA_WEBHOOK_SECRET || "your_webhook_secret";

// Verify the webhook signature matches what Chia sent.
// Chia computes: HMAC-SHA256(secret, "${timestamp}.${body}") and sends it
// as the X-Chia-Signature header prefixed with "sha256=".
function verifySignature(body: string, signature: string, timestamp: string): boolean {
	const expected = createHmac("sha256", WEBHOOK_SECRET)
		.update(`${timestamp}.${body}`)
		.digest("hex");

	const expectedBuffer = Buffer.from(`sha256=${expected}`, "utf-8");
	const signatureBuffer = Buffer.from(signature, "utf-8");

	if (expectedBuffer.length !== signatureBuffer.length) {
		return false;
	}

	return timingSafeEqual(expectedBuffer, signatureBuffer);
}

app.post("/webhooks/chia", async (c) => {
	const body = await c.req.text();
	const signature = c.req.header("x-chia-signature") ?? "";
	const timestamp = c.req.header("x-chia-timestamp") ?? "";

	// Always verify signatures in production to prevent spoofed events
	if (!verifySignature(body, signature, timestamp)) {
		console.log("Invalid webhook signature - rejecting");
		return c.json({ error: "Invalid signature" }, 401);
	}

	const event = JSON.parse(body);
	console.log(`\nReceived event: ${event.type}`);
	console.log(`  Environment: ${event.environment}`);
	console.log(`  Data:`, JSON.stringify(event.data, null, 2));

	// Handle each event type according to your application's needs.
	// Return 200 quickly - do heavy processing asynchronously.
	switch (event.type) {
		case "payment.succeeded":
			console.log(`  Payment of ${event.data.currency} ${event.data.amount} succeeded`);
			// Grant access, send confirmation, update your records
			break;

		case "payment.failed":
			console.log(`  Payment failed: ${event.data.failure_reason}`);
			// Notify subscriber, restrict access if needed
			break;

		case "subscriber.activated":
			console.log(`  Subscriber ${event.data.subscriber_id} is now active`);
			// Provision access to your service
			break;

		case "subscriber.cancelled":
			console.log(`  Subscriber ${event.data.subscriber_id} cancelled`);
			// Revoke access at period end
			break;

		case "subscriber.renewed":
			console.log(`  Subscription renewed for another period`);
			// Extend access
			break;

		case "subscriber.past_due":
			console.log(`  Subscriber is past due - payment retries exhausted`);
			// Consider restricting access, send manual reminder
			break;

		default:
			console.log(`  Unhandled event type: ${event.type}`);
	}

	return c.json({ received: true });
});

serve({ fetch: app.fetch, port: 4000 }, () => {
	console.log("Chia webhook server listening on http://localhost:4000");
	console.log("Configure this URL in your Chia dashboard: Settings > Webhooks");
	console.log("\nEvents you'll receive:");
	console.log("  payment.succeeded    - a payment was completed");
	console.log("  payment.failed       - a payment attempt failed");
	console.log("  subscriber.activated - a new subscription is active");
	console.log("  subscriber.renewed   - a subscription renewed successfully");
	console.log("  subscriber.cancelled - a subscriber cancelled");
	console.log("  subscriber.paused    - a subscription was paused");
	console.log("  subscriber.resumed   - a paused subscription resumed");
	console.log("  subscriber.past_due  - payment retries exhausted");
});
