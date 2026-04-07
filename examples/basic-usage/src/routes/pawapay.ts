import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { ChiaSDK, logger } from "@chiahq/sdk";

const router = Router();
const sdk = ChiaSDK.getInstance();

// Get wallet balances
router.get(
	"/wallets/balances",
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const response = await sdk.pawapay.wallets.getAllBalances();
			res.json(response);
		} catch (error) {
			next(error);
		}
	},
);

// Get country-specific wallet balance
router.get(
	"/wallets/balances/:country",
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { country } = req.params;
			const response = await sdk.pawapay.wallets.getCountryBalance(country);
			res.json(response);
		} catch (error) {
			next(error);
		}
	},
);

// Initiate payment
router.post(
	"/payments/initiate",
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			// Transform request data to match SDK's PaymentData interface
			const paymentData = {
				depositId: req.body.depositId,
				returnUrl: req.body.returnUrl,
				statementDescription: req.body.statementDescription,
				amount: req.body.amount,
				msisdn: req.body.msisdn,
				language: req.body.language || "EN",
				country: req.body.country,
				reason: req.body.reason,
				metadata: req.body.metadata,
			};

			const response = await sdk.pawapay.payments.initiatePayment(paymentData);

			logger.info(
				`##INITIATE PAYMENT RESPONSE## ${JSON.stringify(response, null, 2)}`,
			);
			res.json(response);
		} catch (error) {
			next(error);
		}
	},
);

// Send payout
router.post(
	"/payouts/send",
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const {
				payoutId,
				amount,
				currency,
				correspondent,
				recipient,
				customerTimestamp,
				statementDescription,
				country,
				metadata,
			} = req.body;

			// Validate required fields
			if (
				!payoutId ||
				!amount ||
				!currency ||
				!correspondent ||
				!recipient ||
				!customerTimestamp ||
				!statementDescription
			) {
				return res.status(400).json({
					errorId: Date.now().toString(),
					errorCode: 400,
					errorMessage: "Missing required fields",
				});
			}

			const response = await sdk.pawapay.payouts.sendPayout({
				payoutId,
				amount,
				currency,
				correspondent,
				recipient,
				customerTimestamp,
				statementDescription,
				country,
				metadata,
			});

			res.json(response);
		} catch (error: unknown) {
			next(error);
		}
	},
);

// Get payout status
router.get(
	"/payouts/:depositId",
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { depositId } = req.params;
			const response = await sdk.pawapay.deposits.getDeposit(depositId);
			res.json(response);
		} catch (error) {
			next(error);
		}
	},
);

// Create refund
router.post(
	"/refunds",
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { refundData } = req.body;
			const response =
				await sdk.pawapay.refunds.createRefundRequest(refundData);
			res.json(response);
		} catch (error) {
			next(error);
		}
	},
);

// Get refund status
router.get(
	"/refunds/:refundId",
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { refundId } = req.params;
			const response = await sdk.pawapay.refunds.getRefundStatus(refundId);
			res.json(response);
		} catch (error) {
			next(error);
		}
	},
);

// Get correspondent availability
router.get(
	"/availability",
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const response = await sdk.pawapay.getAvailability();
			res.json(response);
		} catch (error) {
			next(error);
		}
	},
);

// Get active configuration
router.get(
	"/active-conf",
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const response = await sdk.pawapay.getActiveConfiguration();
			res.json(response);
		} catch (error) {
			next(error);
		}
	},
);

// Get transaction details
router.get(
	"/payments/:depositId",
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { depositId } = req.params;
			const response = await sdk.pawapay.deposits.getDeposit(depositId);
			res.json(response);
		} catch (error) {
			next(error);
		}
	},
);

// Get payout details
router.get(
	"/payouts/details/:depositId",
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { depositId } = req.params;
			const response = await sdk.pawapay.payouts.getPayout(depositId);
			res.json(response);
		} catch (error) {
			next(error);
		}
	},
);

// Send bulk payouts
router.post(
	"/payouts/bulk",
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const transactions = req.body;

			// Validate that request body is an array
			if (!Array.isArray(transactions)) {
				return res.status(400).json({
					errorId: Date.now().toString(),
					errorCode: 400,
					errorMessage: "Request body must be an array of transactions",
				});
			}

			// Validate array is not empty
			if (transactions.length === 0) {
				return res.status(400).json({
					errorId: Date.now().toString(),
					errorCode: 400,
					errorMessage: "At least one transaction is required",
				});
			}

			// Validate each transaction
			const requiredFields = [
				"payoutId",
				"amount",
				"currency",
				"correspondent",
				"recipient",
				"customerTimestamp",
				"statementDescription",
			];
			const invalidTransactions = transactions
				.map((transaction, index) => {
					const missingFields = requiredFields.filter(
						(field) => !transaction[field],
					);
					if (missingFields.length > 0) {
						return {
							index,
							missingFields,
						};
					}
					// Validate recipient structure
					if (
						transaction.recipient?.type !== "MSISDN" ||
						!transaction.recipient?.address?.value
					) {
						return {
							index,
							error:
								'Invalid recipient structure. Must include type: "MSISDN" and address.value',
						};
					}
					return null;
				})
				.filter(Boolean);

			if (invalidTransactions.length > 0) {
				return res.status(400).json({
					errorId: Date.now().toString(),
					errorCode: 400,
					errorMessage: "Invalid transactions found",
					details: invalidTransactions,
				});
			}

			const response = await sdk.pawapay.payouts.sendBulkPayout(transactions);
			res.json(response);
		} catch (error: unknown) {
			next(error);
		}
	},
);

export const pawapayRouter = router;
