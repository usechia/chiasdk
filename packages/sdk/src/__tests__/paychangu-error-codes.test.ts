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

function makeAxiosError(status: number, message: string) {
	const err: any = new Error(`Request failed with status ${status}`);
	err.isAxiosError = true;
	err.response = { status, data: { message } };
	err.config = { url: "/x", method: "post" };
	return err;
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

test("a 400 refusal carries ErrorCode 400 and the provider's message", async () => {
	const sdk = new PayChangu("sk");
	lastAxiosInstance().post.mockRejectedValue(
		makeAxiosError(400, "invalid mobile number"),
	);

	const res: any = await sdk.initializeMobileMoneyCollection(
		"265991234567", "ref-1", "50.00", "chg-1",
	);

	expect(res.payload.HasError).toBe(true);
	expect(res.payload.ErrorCode).toBe(400);
	expect(res.payload.ErrorMessage).toContain("invalid mobile number");
});

test("a timeout does NOT report a refusal status code", async () => {
	const sdk = new PayChangu("sk");
	lastAxiosInstance().post.mockRejectedValue(makeTimeoutError());

	const res: any = await sdk.initializeMobileMoneyCollection(
		"265991234567", "ref-1", "50.00", "chg-1",
	);

	expect(res.payload.HasError).toBe(true);
	expect([undefined, 500]).toContain(res.payload.ErrorCode);
	expect(res.payload.ErrorCode).not.toBe(400);
});

test("a 502 carries ErrorCode 502", async () => {
	const sdk = new PayChangu("sk");
	lastAxiosInstance().post.mockRejectedValue(makeAxiosError(502, "bad gateway"));

	const res: any = await sdk.initializeMobileMoneyCollection(
		"265991234567", "ref-1", "50.00", "chg-1",
	);

	expect(res.payload.ErrorCode).toBe(502);
});

test("a refusal and a timeout are now distinguishable", async () => {
	const sdk = new PayChangu("sk");
	const instance = lastAxiosInstance();

	instance.post.mockRejectedValueOnce(makeAxiosError(400, "invalid"));
	const refusal: any = await sdk.initializeMobileMoneyCollection(
		"265991234567", "ref-1", "50.00", "chg-1",
	);

	instance.post.mockRejectedValueOnce(makeTimeoutError());
	const timeout: any = await sdk.initializeMobileMoneyCollection(
		"265991234567", "ref-1", "50.00", "chg-2",
	);

	expect(refusal.payload.ErrorCode).not.toBe(timeout.payload.ErrorCode);
});
