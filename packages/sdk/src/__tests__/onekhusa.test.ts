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
			isAxiosError: jest.fn((e) => e?.isAxiosError === true),
		},
		isAxiosError: jest.fn((e) => e?.isAxiosError === true),
	};
});

function lastAxiosInstance() {
	return (axios.create as jest.Mock).mock.results.slice(-1)[0].value;
}

function makeAxiosError(status: number, message = "server error") {
	const err: any = new Error(`Request failed with status ${status}`);
	err.isAxiosError = true;
	err.response = { status, data: { message } };
	err.config = { url: "/test", method: "post" };
	return err;
}

beforeEach(() => {
	jest.clearAllMocks();
});

describe("OneKhusa collections", () => {
	function newClient() {
		return new OneKhusa("apiKey", "apiSecret", "org-1", "DEVELOPMENT");
	}

	it("initiates a request to pay and returns the SDK response", async () => {
		const client = newClient();
		const instance = lastAxiosInstance();
		instance.post.mockResolvedValueOnce({
			data: {
				id: "txn_123",
				tan: "TAN-1",
				amount: 5000,
				currency: "MWK",
				status: "PENDING",
				phone: "265999000111",
				paymentMethod: "MOBILE_MONEY",
				createdAt: "2026-04-30T00:00:00Z",
				updatedAt: "2026-04-30T00:00:00Z",
			},
		});

		const result = await client.collections.initiateRequestToPay({
			amount: 5000,
			currency: "MWK",
			phone: "265999000111",
			paymentMethod: "MOBILE_MONEY",
		});

		expect("id" in result && result.id).toBe("txn_123");
		expect(instance.post).toHaveBeenCalledWith(
			"/collections/request-to-pay",
			expect.objectContaining({ amount: 5000, currency: "MWK" }),
			expect.anything(),
		);
	});

	it("returns a service error when the API rejects the request", async () => {
		const client = newClient();
		const instance = lastAxiosInstance();
		instance.post.mockRejectedValueOnce(makeAxiosError(400, "invalid phone"));

		const result = await client.collections.initiateRequestToPay({
			amount: 5000,
			currency: "MWK",
			phone: "bad",
			paymentMethod: "MOBILE_MONEY",
		});

		expect("errorMessage" in result).toBe(true);
	});

	it("fetches a single transaction by id", async () => {
		const client = newClient();
		const instance = lastAxiosInstance();
		instance.get.mockResolvedValueOnce({
			data: {
				id: "txn_123",
				collectionId: "col_1",
				tan: "TAN-1",
				amount: 5000,
				currency: "MWK",
				status: "COMPLETED",
				phone: "265999000111",
				paymentMethod: "MOBILE_MONEY",
				createdAt: "2026-04-30T00:00:00Z",
				updatedAt: "2026-04-30T00:01:00Z",
				completedAt: "2026-04-30T00:01:00Z",
			},
		});

		const result = await client.collections.getTransaction("txn_123");
		expect("status" in result && result.status).toBe("COMPLETED");
		expect(instance.get).toHaveBeenCalledWith(
			"/collections/transactions/txn_123",
			expect.anything(),
		);
	});
});
