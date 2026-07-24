import axios from "axios";
import { OneKhusa } from "../services/onekhusa";

jest.mock("axios", () => {
	const mockAxiosInstance = {
		get: jest.fn(),
		post: jest.fn(),
		put: jest.fn(),
		patch: jest.fn(),
		delete: jest.fn(),
		interceptors: {
			request: { use: jest.fn() },
			response: { use: jest.fn() },
		},
	};
	return {
		__esModule: true,
		default: {
			create: jest.fn(() => mockAxiosInstance),
			post: jest.fn(),
			isAxiosError: jest.fn((e) => e?.isAxiosError === true),
		},
		isAxiosError: jest.fn((e) => e?.isAxiosError === true),
	};
});

function lastAxiosInstance() {
	return (axios.create as jest.Mock).mock.results.slice(-1)[0].value;
}

function makeAxiosError(status: number, body: unknown) {
	const err: any = new Error(`Request failed with status ${status}`);
	err.isAxiosError = true;
	err.response = { status, data: body };
	err.config = { url: "/test", method: "post" };
	return err;
}

const MERCHANT = 12345678;

function newClient() {
	return new OneKhusa({
		apiKey: "apiKey",
		apiSecret: "apiSecret",
		organisationId: "org-1",
		merchantAccountNumber: MERCHANT,
		environment: "DEVELOPMENT",
	});
}

beforeEach(() => {
	jest.clearAllMocks();
});

describe("OneKhusa authentication", () => {
	it("requests a token from the documented endpoint with the documented body", async () => {
		(axios.post as jest.Mock).mockResolvedValue({
			data: {
				accessToken: "jwt-token",
				expiresOn: new Date(Date.now() + 300_000).toISOString(),
				expiryInMinutes: 5,
			},
		});

		const client = newClient();
		const status = await client.checkStatus();

		expect(status.available).toBe(true);
		expect(axios.post).toHaveBeenCalledWith(
			"https://api.onekhusa.com/sandbox/v1/account/getAccessToken",
			{
				apiKey: "apiKey",
				apiSecret: "apiSecret",
				organisationId: "org-1",
				merchantAccountNumber: MERCHANT,
			},
			expect.objectContaining({
				headers: expect.objectContaining({
					"Content-Type": "application/json",
				}),
			}),
		);
	});

	it("reuses a cached token rather than re-authenticating per call", async () => {
		(axios.post as jest.Mock).mockResolvedValue({
			data: {
				accessToken: "jwt-token",
				expiresOn: new Date(Date.now() + 300_000).toISOString(),
				expiryInMinutes: 5,
			},
		});

		const client = newClient();
		await client.checkStatus();
		await client.checkStatus();

		expect((axios.post as jest.Mock).mock.calls.length).toBe(1);
	});

	it("re-authenticates after the cache is cleared", async () => {
		(axios.post as jest.Mock).mockResolvedValue({
			data: {
				accessToken: "jwt-token",
				expiresOn: new Date(Date.now() + 300_000).toISOString(),
				expiryInMinutes: 5,
			},
		});

		const client = newClient();
		await client.checkStatus();
		client.clearTokenCache();
		await client.checkStatus();

		expect((axios.post as jest.Mock).mock.calls.length).toBe(2);
	});

	it("reports unavailable when credentials are rejected", async () => {
		(axios.post as jest.Mock).mockRejectedValue(
			makeAxiosError(401, { title: "Unauthorized" }),
		);

		const status = await newClient().checkStatus();

		expect(status.available).toBe(false);
		expect(status.environment).toBe("DEVELOPMENT");
	});
});

describe("OneKhusa collections", () => {
	it("initiates a request to pay and returns the timed account number", async () => {
		const client = newClient();
		const instance = lastAxiosInstance();
		instance.post.mockResolvedValueOnce({
			data: {
				merchantAccountNumber: MERCHANT,
				timedAccountNumber: "11005533",
				expiryDate: "2026-01-05T10:01:56.412Z",
				expiryInMinutes: 15,
			},
		});

		const result = await client.collections.initiateRequestToPay({
			merchantAccountNumber: MERCHANT,
			transactionAmount: 8375000,
			transactionDescription: "Samsung 85inch TV purchase",
			referenceNumber: "1020XDFS76GS777",
			capturedBy: "username@example.com",
		});

		expect("timedAccountNumber" in result && result.timedAccountNumber).toBe(
			"11005533",
		);
		expect(instance.post).toHaveBeenCalledWith(
			"/collections/requestToPay/initiate",
			expect.objectContaining({
				merchantAccountNumber: MERCHANT,
				transactionAmount: 8375000,
				referenceNumber: "1020XDFS76GS777",
				capturedBy: "username@example.com",
			}),
			expect.anything(),
		);
	});

	// The live API rejects any write without this header, even though their
	// published OpenAPI marks it optional. Regressing it breaks every collection.
	it("sends an X-Idempotency-Key on writes", async () => {
		const client = newClient();
		const instance = lastAxiosInstance();
		instance.post.mockResolvedValueOnce({ data: { timedAccountNumber: "11005533" } });

		await client.collections.initiateRequestToPay({
			merchantAccountNumber: MERCHANT,
			transactionAmount: 100,
			transactionDescription: "test",
			referenceNumber: "REF12345",
			capturedBy: "ops@example.com",
		});

		const config = instance.post.mock.calls[0][2];
		expect(config.headers["X-Idempotency-Key"]).toEqual(expect.any(String));
		expect(config.headers["X-Idempotency-Key"].length).toBeGreaterThan(0);
	});

	it("uses a caller-supplied idempotency key when given one", async () => {
		const client = newClient();
		const instance = lastAxiosInstance();
		instance.post.mockResolvedValueOnce({ data: { timedAccountNumber: "1" } });

		await client.collections.initiateRequestToPay(
			{
				merchantAccountNumber: MERCHANT,
				transactionAmount: 100,
				transactionDescription: "test",
				referenceNumber: "REF12345",
				capturedBy: "ops@example.com",
			},
			"payment-abc-123",
		);

		expect(instance.post.mock.calls[0][2].headers["X-Idempotency-Key"]).toBe(
			"payment-abc-123",
		);
	});

	it("does not send an idempotency key on reads", async () => {
		const client = newClient();
		const instance = lastAxiosInstance();
		instance.post.mockResolvedValueOnce({ data: [] });

		await client.collections.getTransactions({
			merchantAccountNumber: MERCHANT,
			transactionDate: "2025-09-05",
			pageNumber: 1,
			numberOfReturnedRows: 20,
			isIncremental: false,
			searchBy: "TransactionReferenceNumber",
		});

		const config = instance.post.mock.calls[0][2];
		expect(config?.headers?.["X-Idempotency-Key"]).toBeUndefined();
	});

	it("surfaces RFC7807 validation failures as a service error", async () => {
		const client = newClient();
		const instance = lastAxiosInstance();
		instance.post.mockRejectedValueOnce(
			makeAxiosError(400, {
				type: "https://httpstatuses.com/400",
				title: "Bad Request",
				status: 400,
				errorCode: "E900",
				detail: "Validation failed",
				errors: ["Merchant Account Number should be 8 numbers only."],
			}),
		);

		const result = await client.collections.initiateRequestToPay({
			merchantAccountNumber: 1,
			transactionAmount: 100,
			transactionDescription: "bad",
			referenceNumber: "REF12",
			capturedBy: "ops@example.com",
		});

		expect("errorMessage" in result).toBe(true);
		if ("errorMessage" in result) {
			expect(result.statusCode).toBe(400);
			expect(result.errorMessage).toBe("Validation failed");
			expect(result.errorObject).toContain("E900");
		}
	});

	it("posts the search body to getTransactions", async () => {
		const client = newClient();
		const instance = lastAxiosInstance();
		instance.post.mockResolvedValueOnce({
			data: [
				{
					sourceCustomerName: "Joe Doe",
					connectorName: "Airtel Money",
					transactionAmount: 75000,
					transactionFee: 1000,
					currencyCode: "MWK",
					transactionStatusCode: "S",
					transactionStatusName: "Success",
					transactionReferenceNumber: "D250713MGGGY",
					transactionDate: "2024-01-15T10:30:00Z",
				},
			],
		});

		const result = await client.collections.getTransactions({
			merchantAccountNumber: MERCHANT,
			transactionDate: "2025-09-05",
			pageNumber: 1,
			numberOfReturnedRows: 20,
			isIncremental: false,
			searchBy: "TransactionReferenceNumber",
		});

		expect(Array.isArray(result) && result.length).toBe(1);
		expect(instance.post).toHaveBeenCalledWith(
			"/collections/getTransactions",
			expect.objectContaining({ searchBy: "TransactionReferenceNumber" }),
			expect.anything(),
		);
	});

	it("normalises a 204 empty body to an empty list", async () => {
		const client = newClient();
		const instance = lastAxiosInstance();
		instance.post.mockResolvedValueOnce({ data: null });

		const result = await client.collections.getTransactions({
			merchantAccountNumber: MERCHANT,
			transactionDate: "2025-09-05",
			pageNumber: 1,
			numberOfReturnedRows: 20,
			isIncremental: false,
			searchBy: "TransactionReferenceNumber",
		});

		expect(result).toEqual([]);
	});

	it("looks a single payment up by reference number, not by URL path", async () => {
		const client = newClient();
		const instance = lastAxiosInstance();
		instance.post.mockResolvedValueOnce({
			data: {
				beneficiary: {
					accountNumber: MERCHANT,
					accountName: "John Phiri",
					amountReceived: 1000000,
					currencyCode: "MWK",
				},
				source: {
					accountNumber: "6914714",
					customerName: "PETER MBEWE",
					amountSent: 12000,
					currencyCode: "MWK",
					sourceReferenceNumber: "ND260414UP22",
					connectorId: 112400,
					connectorName: "Airtel Money",
				},
				transaction: {
					transactionReferenceNumber: "B250713MGRTW",
					transactionStatusCode: "S",
					transactionStatusName: "Successful",
					responseCode: "S100",
				},
			},
		});

		const result = await client.collections.getTransaction({
			merchantAccountNumber: MERCHANT,
			transactionReferenceNumber: "B250713MGRTW",
		});

		expect(
			"transaction" in result && result.transaction.transactionStatusCode,
		).toBe("S");
		expect(instance.post).toHaveBeenCalledWith(
			"/collections/getTransaction",
			{
				merchantAccountNumber: MERCHANT,
				transactionReferenceNumber: "B250713MGRTW",
			},
			expect.anything(),
		);
	});

	it("simulates a customer paying a TAN in the sandbox", async () => {
		const client = newClient();
		const instance = lastAxiosInstance();
		instance.post.mockResolvedValueOnce({
			data: { transaction: { transactionStatusCode: "S" }, statusCode: 0 },
		});

		await client.collections.simulateRequestToPayPayment({
			merchantAccountNumber: MERCHANT,
			transactionAmount: 8375000,
			connectorId: 212188,
			timedAccountNumber: "11005533",
			currencyCode: "MWK",
			capturedBy: "username@example.com",
		});

		expect(instance.post).toHaveBeenCalledWith(
			"/collections/requestToPay/addFakeTransaction",
			expect.objectContaining({ timedAccountNumber: "11005533" }),
			expect.anything(),
		);
	});
});

describe("OneKhusa disbursements", () => {
	it("adds a single disbursement to the documented path", async () => {
		const client = newClient();
		const instance = lastAxiosInstance();
		instance.post.mockResolvedValueOnce({
			data: {
				merchantAccountNumber: MERCHANT,
				transactionReferenceNumber: "251220XF152G",
				responseCode: "S100",
			},
		});

		const result = await client.disbursements.addSingle({
			merchantAccountNumber: MERCHANT,
			beneficiaryName: "John Phiri",
			connectorId: 550044,
			beneficiaryAccountNumber: "3333888800",
			transactionAmount: 45000.55,
			capturedBy: "ops@example.com",
		});

		expect(
			"transactionReferenceNumber" in result &&
				result.transactionReferenceNumber,
		).toBe("251220XF152G");
		expect(instance.post).toHaveBeenCalledWith(
			"/disbursements/single/add",
			expect.objectContaining({ connectorId: 550044 }),
			expect.anything(),
		);
	});

	it("uses PUT for approve and review, per the API", async () => {
		const client = newClient();
		const instance = lastAxiosInstance();
		instance.put.mockResolvedValue({ data: { responseCode: "S100" } });

		await client.disbursements.approveSingle({
			merchantAccountNumber: MERCHANT,
			transactionReferenceNumber: "251105CJZ16U",
			actionedBy: "admin@example.com",
		});
		await client.disbursements.reviewSingle({
			merchantAccountNumber: MERCHANT,
			transactionReferenceNumber: "251105CJZ16U",
			actionedBy: "admin@example.com",
		});

		expect(instance.put).toHaveBeenCalledWith(
			"/disbursements/single/approve",
			expect.objectContaining({ actionedBy: "admin@example.com" }),
			expect.anything(),
		);
		expect(instance.put).toHaveBeenCalledWith(
			"/disbursements/single/review",
			expect.anything(),
			expect.anything(),
		);
	});

	it("submits a JSON batch with the header/transactions envelope", async () => {
		const client = newClient();
		const instance = lastAxiosInstance();
		instance.post.mockResolvedValueOnce({
			data: {
				merchantAccountNumber: MERCHANT,
				batchNumber: 123456,
				BatchStatusCode: "Q",
			},
		});

		const result = await client.disbursements.addBatchJson({
			header: {
				merchantAccountNumber: MERCHANT,
				isBatchScheduled: false,
				capturedBy: "ops@example.com",
			},
			transactions: [
				{
					beneficiaryName: "John Phiri",
					connectorId: 550044,
					beneficiaryAccountNumber: "3333888800",
					transactionDescription: "Salary",
					transactionAmount: 1000,
					sourceReferenceNumber: "SRC001",
				},
			],
		});

		expect("batchNumber" in result && result.batchNumber).toBe(123456);
		expect(instance.post).toHaveBeenCalledWith(
			"/disbursements/batch/addJson",
			expect.objectContaining({
				header: expect.objectContaining({ isBatchScheduled: false }),
			}),
			expect.anything(),
		);
	});

	it("uses the singular batch path and PUT for batch approval", async () => {
		const client = newClient();
		const instance = lastAxiosInstance();
		instance.put.mockResolvedValueOnce({ data: { BatchStatusCode: "A" } });

		await client.disbursements.approveBatch({
			merchantAccountNumber: MERCHANT,
			batchNumber: 678,
			actionedBy: "admin@example.com",
		});

		expect(instance.put).toHaveBeenCalledWith(
			"/disbursements/batch/approve",
			expect.objectContaining({ batchNumber: 678 }),
			expect.anything(),
		);
	});

	it("tops the merchant account up through the merchants path", async () => {
		const client = newClient();
		const instance = lastAxiosInstance();
		instance.post.mockResolvedValueOnce({ data: { statusCode: 0 } });

		await client.disbursements.topupMerchantAccount({
			merchantAccountNumber: MERCHANT,
			transactionAmount: 500000,
			connectorId: 212188,
			currencyCode: "MWK",
			capturedBy: "ops@example.com",
		});

		expect(instance.post).toHaveBeenCalledWith(
			"/merchants/accounts/topup",
			expect.objectContaining({ transactionAmount: 500000 }),
			expect.anything(),
		);
	});
});
