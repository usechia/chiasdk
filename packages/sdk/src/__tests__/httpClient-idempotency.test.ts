import axios from "axios";
import { OneKhusa } from "../services/onekhusa";
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

function makeTimeoutError() {
	const err: any = new Error("timeout of 30000ms exceeded");
	err.isAxiosError = true;
	err.code = "ECONNABORTED";
	err.response = undefined;
	err.config = { url: "/x", method: "post" };
	return err;
}

beforeEach(() => {
	jest.clearAllMocks();
});

test("a timed-out OneKhusa collection is sent exactly once", async () => {
	const sdk = new OneKhusa({
		apiKey: "key",
		apiSecret: "secret",
		organisationId: "org",
		merchantAccountNumber: 12345678,
	});
	const instance = lastAxiosInstance();

	instance.post.mockImplementation((url: string) => {
		if (url.includes("getAccessToken")) {
			return Promise.resolve({
				data: {
					accessToken: "t",
					expiresOn: new Date(Date.now() + 300000).toISOString(),
					expiryInMinutes: 5,
				},
			});
		}
		return Promise.reject(makeTimeoutError());
	});

	await sdk.collections.initiateRequestToPay({
		merchantAccountNumber: 12345678,
		transactionAmount: 50,
		transactionDescription: "test",
		referenceNumber: "REF12345",
		capturedBy: "ops@example.com",
	});

	const posts = instance.post.mock.calls.filter(
		(c: any[]) => typeof c[0] === "string" && c[0].includes("requestToPay"),
	);
	expect(posts.length).toBe(1);
}, 30000);

test("a timed-out PawaPay deposit still retries, because depositId dedupes it", async () => {
	const sdk = new PawaPay("jwt");
	const instance = lastAxiosInstance();
	instance.post.mockRejectedValue(makeTimeoutError());

	await sdk.deposits.sendDeposit({
		depositId: "dep-1",
		amount: "50.00",
		currency: "ZMW",
		payer: {
			type: "MMO",
			accountDetails: { phoneNumber: "260971234567", provider: "AIRTEL_ZMB" },
		},
	});

	expect(instance.post.mock.calls.length).toBe(4);
}, 30000);
