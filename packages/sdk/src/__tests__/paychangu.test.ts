import axios from "axios";
import { PayChangu } from "../services/paychangu";

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

beforeEach(() => {
	jest.clearAllMocks();
});

describe("PayChangu transaction verification", () => {
	function newClient() {
		return new PayChangu("sk_test_xxx", "DEVELOPMENT");
	}

	it("calls the verify-payment endpoint with the tx_ref", async () => {
		const client = newClient();
		const instance = lastAxiosInstance();
		instance.get.mockResolvedValueOnce({
			data: {
				status: "success",
				message: "Verified",
				data: { status: "success", amount: 1000, currency: "MWK", tx_ref: "ref-1" },
			},
		});

		const result = await client.verifyTransaction("ref-1");

		expect(instance.get).toHaveBeenCalledWith(
			"/verify-payment/ref-1",
			expect.anything(),
		);
		expect((result as { status: string }).status).toBe("success");
	});

	it("returns an error response when the API rejects", async () => {
		const client = newClient();
		const instance = lastAxiosInstance();
		const err: any = new Error("Bad request");
		err.isAxiosError = true;
		err.response = { status: 400, data: { message: "tx not found" } };
		err.config = { url: "/verify-payment/missing", method: "get" };
		instance.get.mockRejectedValueOnce(err);

		const result = await client.verifyTransaction("missing");
		expect(result).toBeDefined();
	});
});
