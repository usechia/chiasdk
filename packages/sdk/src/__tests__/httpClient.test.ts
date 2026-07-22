import axios from "axios";
import { HttpClient } from "../utils/httpClient";

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

function getAxiosInstance() {
	return (axios.create as jest.Mock).mock.results.slice(-1)[0].value;
}

function makeAxiosError(status: number) {
	const err: any = new Error(`Request failed with status ${status}`);
	err.isAxiosError = true;
	err.response = { status, data: { message: "server error" } };
	err.config = { url: "/test", method: "get" };
	return err;
}

function makeNetworkError() {
	const err: any = new Error("Network Error");
	err.isAxiosError = true;
	err.response = undefined;
	err.config = { url: "/test", method: "get" };
	return err;
}

beforeEach(() => {
	jest.clearAllMocks();
});

describe("HttpClient retry logic", () => {
	it("returns data on successful request without retrying", async () => {
		const client = new HttpClient({
			baseUrl: "https://api.test.com",
			serviceName: "Test",
			retry: { maxRetries: 3, initialDelayMs: 1, maxDelayMs: 10 },
		});
		const instance = getAxiosInstance();
		instance.get.mockResolvedValueOnce({ data: { ok: true } });

		const result = await client.get("/test");
		expect(result).toEqual({ ok: true });
		expect(instance.get).toHaveBeenCalledTimes(1);
	});

	it("retries on 500 error and succeeds", async () => {
		const client = new HttpClient({
			baseUrl: "https://api.test.com",
			serviceName: "Test",
			retry: { maxRetries: 3, initialDelayMs: 1, maxDelayMs: 10 },
		});
		const instance = getAxiosInstance();
		instance.get
			.mockRejectedValueOnce(makeAxiosError(500))
			.mockResolvedValueOnce({ data: { ok: true } });

		const result = await client.get("/test");
		expect(result).toEqual({ ok: true });
		expect(instance.get).toHaveBeenCalledTimes(2);
	});

	it("does not retry on 400 error", async () => {
		const client = new HttpClient({
			baseUrl: "https://api.test.com",
			serviceName: "Test",
			retry: { maxRetries: 3, initialDelayMs: 1, maxDelayMs: 10 },
		});
		const instance = getAxiosInstance();
		instance.get.mockRejectedValueOnce(makeAxiosError(400));

		await expect(client.get("/test")).rejects.toBeDefined();
		expect(instance.get).toHaveBeenCalledTimes(1);
	});

	it("does not retry on 422 error", async () => {
		const client = new HttpClient({
			baseUrl: "https://api.test.com",
			serviceName: "Test",
			retry: { maxRetries: 3, initialDelayMs: 1, maxDelayMs: 10 },
		});
		const instance = getAxiosInstance();
		instance.get.mockRejectedValueOnce(makeAxiosError(422));

		await expect(client.get("/test")).rejects.toBeDefined();
		expect(instance.get).toHaveBeenCalledTimes(1);
	});

	it("does not retry a POST on network error (no response) by default", async () => {
		const client = new HttpClient({
			baseUrl: "https://api.test.com",
			serviceName: "Test",
			retry: { maxRetries: 2, initialDelayMs: 1, maxDelayMs: 10 },
		});
		const instance = getAxiosInstance();
		instance.post.mockRejectedValueOnce(makeNetworkError());

		await expect(client.post("/test", { foo: "bar" })).rejects.toBeDefined();
		expect(instance.post).toHaveBeenCalledTimes(1);
	});

	it("retries a POST on network error (no response) when opted into idempotent", async () => {
		const client = new HttpClient({
			baseUrl: "https://api.test.com",
			serviceName: "Test",
			retry: { maxRetries: 2, initialDelayMs: 1, maxDelayMs: 10 },
		});
		const instance = getAxiosInstance();
		instance.post
			.mockRejectedValueOnce(makeNetworkError())
			.mockResolvedValueOnce({ data: { created: true } });

		const result = await client.post(
			"/test",
			{ foo: "bar" },
			"POST request",
			{},
			{ idempotent: true },
		);
		expect(result).toEqual({ created: true });
		expect(instance.post).toHaveBeenCalledTimes(2);
	});

	it("exhausts max retries then throws", async () => {
		const client = new HttpClient({
			baseUrl: "https://api.test.com",
			serviceName: "Test",
			retry: { maxRetries: 2, initialDelayMs: 1, maxDelayMs: 10 },
		});
		const instance = getAxiosInstance();
		instance.get
			.mockRejectedValueOnce(makeAxiosError(503))
			.mockRejectedValueOnce(makeAxiosError(503))
			.mockRejectedValueOnce(makeAxiosError(503));

		await expect(client.get("/test")).rejects.toBeDefined();
		expect(instance.get).toHaveBeenCalledTimes(3);
	});

	it("applies exponential backoff with increasing delays", async () => {
		const timestamps: number[] = [];
		const client = new HttpClient({
			baseUrl: "https://api.test.com",
			serviceName: "Test",
			retry: { maxRetries: 3, initialDelayMs: 10, maxDelayMs: 1000 },
		});
		const instance = getAxiosInstance();
		instance.get.mockImplementation(() => {
			timestamps.push(Date.now());
			return Promise.reject(makeAxiosError(500));
		});

		await expect(client.get("/test")).rejects.toBeDefined();

		expect(instance.get).toHaveBeenCalledTimes(4);
		const gap1 = timestamps[1] - timestamps[0];
		const gap2 = timestamps[2] - timestamps[1];
		const gap3 = timestamps[3] - timestamps[2];

		// Each gap is checked against its own scheduled delay (10ms * 2^attempt, plus up to
		// 10% jitter) rather than against the previously measured gap. Comparing measured
		// gaps to each other couples them: a gap stretched by scheduler noise raises the bar
		// the next one has to clear, which can fail even though the backoff is correct. A
		// sleep never returns early, so these lower bounds fail only if the backoff is wrong.
		expect(gap1).toBeGreaterThanOrEqual(8);
		expect(gap2).toBeGreaterThanOrEqual(18);
		expect(gap3).toBeGreaterThanOrEqual(36);
		expect(gap3).toBeGreaterThan(gap1);
	});

	it("works with default retry config", async () => {
		const client = new HttpClient({
			baseUrl: "https://api.test.com",
			serviceName: "Test",
		});
		const instance = getAxiosInstance();
		instance.get.mockResolvedValueOnce({ data: { ok: true } });

		const result = await client.get("/test");
		expect(result).toEqual({ ok: true });
	});
});
