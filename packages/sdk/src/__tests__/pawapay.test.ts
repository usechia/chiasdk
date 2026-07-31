import axios from "axios";
import { PawaPay } from "../services/pawapay";

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

describe("PawaPay deposits", () => {
	function newClient() {
		return new PawaPay("jwt-token", "DEVELOPMENT");
	}

	it("sends a deposit and forwards the request body", async () => {
		const client = newClient();
		const instance = lastAxiosInstance();
		instance.post.mockResolvedValueOnce({
			data: { depositId: "dep-1", status: "ACCEPTED" },
		});

		const request = {
			depositId: "dep-1",
			amount: "1000",
			currency: "MWK",
			country: "MWI",
			payer: {
				type: "MMO" as const,
				accountDetails: {
					phoneNumber: "265999000111",
					provider: "AIRTEL_MWI",
				},
			},
			customerMessage: "test",
		};

		const result = await client.deposits.sendDeposit(request as any);

		expect(instance.post).toHaveBeenCalledWith(
			"/deposits",
			expect.objectContaining({ depositId: "dep-1" }),
			expect.anything(),
		);
		expect("depositId" in result && result.depositId).toBe("dep-1");
	});

	it("fetches a deposit by id and exposes the wrapped deposit", async () => {
		const client = newClient();
		const instance = lastAxiosInstance();
		instance.get.mockResolvedValueOnce({
			data: {
				data: { depositId: "dep-1", status: "COMPLETED", amount: "15000", currency: "MWK" },
				status: "FOUND",
			},
		});

		const result = await client.deposits.getDeposit("dep-1");
		expect(instance.get).toHaveBeenCalledWith("/deposits/dep-1", expect.anything());
		expect("status" in result && result.status).toBe("FOUND");
		expect("data" in result && result.data?.status).toBe("COMPLETED");
	});

	it("reports NOT_FOUND without inventing a deposit", async () => {
		const client = newClient();
		const instance = lastAxiosInstance();
		instance.get.mockResolvedValueOnce({
			data: { status: "NOT_FOUND" },
		});

		const result = await client.deposits.getDeposit("missing");
		expect("status" in result && result.status).toBe("NOT_FOUND");
		expect("data" in result ? result.data : undefined).toBeUndefined();
	});

	it("returns service error when the API rejects", async () => {
		const client = newClient();
		const instance = lastAxiosInstance();
		const err: any = new Error("Bad");
		err.isAxiosError = true;
		err.response = { status: 400, data: { failureReason: "invalid request" } };
		err.config = { url: "/deposits", method: "post" };
		instance.post.mockRejectedValueOnce(err);

		const result = await client.deposits.sendDeposit({
			depositId: "x",
			amount: "1",
			currency: "MWK",
			country: "MWI",
			payer: {
				type: "MMO",
				accountDetails: { phoneNumber: "x", provider: "AIRTEL_MWI" },
			},
			customerMessage: "x",
		} as any);

		expect("errorMessage" in result).toBe(true);
	});
});
