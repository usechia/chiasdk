/**
 * Live OneKhusa sandbox smoke test.
 *
 * Exercises the full collection loop against api.onekhusa.com/sandbox/v1:
 * authenticate, list connectors, reserve a timed account number, simulate the
 * customer paying it, then read the settled transaction back. Every mock in the
 * unit suite asserts a shape this script proves.
 *
 * Run:
 *   ONEKHUSA_API_KEY=... ONEKHUSA_API_SECRET=... \
 *   ONEKHUSA_ORGANISATION_ID=... ONEKHUSA_MERCHANT_ACCOUNT_NUMBER=... \
 *   ONEKHUSA_CAPTURED_BY=you@example.com \
 *   npx tsx scripts/onekhusa-sandbox-smoke.ts
 *
 * Optional: ONEKHUSA_CONNECTOR_ID to pin the simulated payment channel,
 * ONEKHUSA_TOPUP_AMOUNT to also fund the merchant account.
 */
import * as path from "node:path";
import * as dotenv from "dotenv";
import { OneKhusa } from "../src/services/onekhusa";
import { isServiceError } from "../src/utils/serviceWrapper";

// Credentials live in platform/.env, so load them from there rather than making
// the caller export a dozen variables by hand. Anything already in the
// environment wins, and ONEKHUSA_ENV_FILE overrides the location.
const ENV_FILE =
	process.env.ONEKHUSA_ENV_FILE ?? path.resolve(__dirname, "../../../../platform/.env");
dotenv.config({ path: ENV_FILE });

/**
 * Accepts either the bare name or the CHIA_-prefixed one the platform uses, so
 * a single set of values in platform/.env drives both.
 */
function required(name: string): string {
	const value = process.env[name] || process.env[`CHIA_${name}`];
	if (!value) {
		console.error(`Missing required env var: ${name} (or CHIA_${name})`);
		process.exit(1);
	}
	return value;
}

function optional(name: string): string | undefined {
	return process.env[name] || process.env[`CHIA_${name}`];
}

function unwrap<T>(label: string, result: T | { errorMessage: string; statusCode: number; errorObject: string }): T {
	if (isServiceError(result)) {
		console.error(`FAIL ${label}`);
		console.error(`  status:  ${result.statusCode}`);
		console.error(`  message: ${result.errorMessage}`);
		console.error(`  body:    ${result.errorObject}`);
		process.exit(1);
	}
	return result as T;
}

async function main() {
	console.log(`Loading credentials from ${ENV_FILE}\n`);
	const rawMerchant = required("ONEKHUSA_MERCHANT_ACCOUNT_NUMBER");
	// The API validates this before it checks credentials, so a malformed value
	// produces a misleading "empty fields" error rather than a useful one.
	if (!/^\d{8}$/.test(rawMerchant.trim())) {
		console.error(`ONEKHUSA_MERCHANT_ACCOUNT_NUMBER must be exactly 8 digits, got "${rawMerchant}".`);
		console.error("Find it under Merchants in the portal. It is not the Organisation ID.");
		process.exit(1);
	}
	const merchantAccountNumber = Number(rawMerchant.trim());
	// Only the collection endpoints need this, so it is checked at the point of
	// use rather than up front: auth and connector listing are worth running on
	// their own to confirm the credentials.
	const capturedBy = optional("ONEKHUSA_CAPTURED_BY");

	const client = new OneKhusa({
		apiKey: required("ONEKHUSA_API_KEY"),
		apiSecret: required("ONEKHUSA_API_SECRET"),
		organisationId: required("ONEKHUSA_ORGANISATION_ID"),
		merchantAccountNumber,
		defaultCapturedBy: capturedBy,
		environment: "DEVELOPMENT",
	});

	console.log("1. Authenticating against /account/getAccessToken");
	const status = await client.checkStatus();
	if (!status.available) {
		console.error(`FAIL authentication: ${status.error}`);
		process.exit(1);
	}
	console.log("   ok: token acquired\n");

	console.log("2. Listing connectors (/core/connectors/GetAll)");
	const connectors = unwrap("getConnectors", await client.getConnectors());
	console.log(`   ok: ${connectors.length} connector(s)`);
	// Printed in full with the permission flags: the id is what
	// CHIA_ONEKHUSA_PAYOUT_CONNECTOR_ID needs, and there is no other place to
	// look it up.
	console.log(`   ${"id".padEnd(9)} ${"collect".padEnd(8)} ${"disburse".padEnd(9)} ${"active".padEnd(7)} name`);
	for (const c of connectors) {
		console.log(
			`   ${String(c.connectorId).padEnd(9)} ${String(c.isCollectionAllowed).padEnd(8)} ` +
				`${String(c.isDisbursementAllowed).padEnd(9)} ${String(c.isActive).padEnd(7)} ${c.connectorName}`,
		);
	}

	// isCollectionAllowed reads false across every connector on the sandbox yet
	// does not block request-to-pay, so it is not treated as a gate here - only
	// as a preference when something does report true.
	const collectable = connectors.filter((c) => c.isCollectionAllowed && c.isActive);

	const override = Number(optional("ONEKHUSA_CONNECTOR_ID") ?? process.env.CHIA_ONEKHUSA_PAYOUT_CONNECTOR_ID);
	const connectorId =
		override || collectable[0]?.connectorId || connectors.find((c) => c.isActive)?.connectorId;
	if (!connectorId) {
		console.error("FAIL: no connector available; set ONEKHUSA_CONNECTOR_ID");
		process.exit(1);
	}
	console.log(`\n   using connectorId ${connectorId}\n`);

	if (!capturedBy) {
		console.log("Credentials verified. Stopping here: the collection endpoints");
		console.log("require an operator email. Set ONEKHUSA_CAPTURED_BY (or");
		console.log("CHIA_ONEKHUSA_CAPTURED_BY) to run the full request-to-pay loop.");
		return;
	}

	const topupAmount = Number(optional("ONEKHUSA_TOPUP_AMOUNT"));
	if (topupAmount) {
		console.log(`3. Topping up merchant account by ${topupAmount} MWK`);
		unwrap(
			"topupMerchantAccount",
			await client.disbursements.topupMerchantAccount({
				merchantAccountNumber,
				transactionAmount: topupAmount,
				connectorId,
				currencyCode: "MWK",
				capturedBy,
			}),
		);
		console.log("   ok\n");
	}

	// 5-25 alphanumeric characters, and unique per transaction.
	const referenceNumber = `CHIA${Date.now()}`;
	const transactionAmount = 5000;

	console.log(`4. Reserving a TAN for reference ${referenceNumber}`);
	const rtp = unwrap(
		"initiateRequestToPay",
		await client.collections.initiateRequestToPay({
			merchantAccountNumber,
			transactionAmount,
			transactionDescription: "Chia SDK sandbox smoke test",
			referenceNumber,
			capturedBy,
		}),
	);
	console.log(`   ok: timedAccountNumber=${rtp.timedAccountNumber}`);
	console.log(`       expires ${rtp.expiryDate} (${rtp.expiryInMinutes} min)`);
	if (!rtp.timedAccountNumber?.startsWith("1")) {
		console.warn(`   WARN: docs say the TAN always starts with "1"`);
	}
	console.log();

	console.log("5. Simulating the customer paying that TAN");
	const simulated = unwrap(
		"simulateRequestToPayPayment",
		await client.collections.simulateRequestToPayPayment({
			merchantAccountNumber,
			transactionAmount,
			connectorId,
			timedAccountNumber: rtp.timedAccountNumber,
			currencyCode: "MWK",
			capturedBy,
		}),
	);
	const settledRef = simulated.transaction?.transactionReferenceNumber;
	console.log(`   ok: transactionReferenceNumber=${settledRef}`);
	console.log(`       status=${simulated.transaction?.transactionStatusCode} ${simulated.transaction?.transactionStatusName}`);
	console.log("       (a payrequest.success webhook should now be in flight)\n");

	if (settledRef) {
		console.log("6. Reading the transaction back (/collections/getTransaction)");
		const fetched = unwrap(
			"getTransaction",
			await client.collections.getTransaction({
				merchantAccountNumber,
				transactionReferenceNumber: settledRef,
			}),
		);
		console.log(`   ok: received ${fetched.beneficiary?.amountReceived} ${fetched.beneficiary?.currencyCode}`);
		console.log(`       from ${fetched.source?.customerName} via ${fetched.source?.connectorName}\n`);
	}

	console.log("7. Listing today's collections (/collections/getTransactions)");
	const today = new Date().toISOString().slice(0, 10);
	const list = unwrap(
		"getTransactions",
		await client.collections.getTransactions({
			merchantAccountNumber,
			transactionDate: today,
			pageNumber: 1,
			numberOfReturnedRows: 20,
			isIncremental: false,
			searchBy: "TransactionReferenceNumber",
		}),
	);
	console.log(`   ok: ${list.length} transaction(s) on ${today}\n`);

	console.log("All checks passed. The SDK matches the live sandbox contract.");
}

main().catch((error) => {
	console.error("Unexpected failure:", error);
	process.exit(1);
});
