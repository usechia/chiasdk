import { ChiaSDK } from "../sdk";

beforeEach(() => {
	ChiaSDK.destroy();
});

afterEach(() => {
	ChiaSDK.destroy();
});

describe("ChiaSDK singleton", () => {
	it("creates an instance via initialize", () => {
		const sdk = ChiaSDK.initialize({ env: { silent: true } });
		expect(sdk).toBeInstanceOf(ChiaSDK);
	});

	it("returns the same instance on subsequent getInstance calls", () => {
		const first = ChiaSDK.initialize({ env: { silent: true } });
		const second = ChiaSDK.getInstance();
		expect(second).toBe(first);
	});

	it("throws when getInstance is called before initialize", () => {
		expect(() => ChiaSDK.getInstance()).toThrow(
			"SDK not initialized. Call ChiaSDK.initialize() first",
		);
	});

	it("clears the instance on destroy", () => {
		ChiaSDK.initialize({ env: { silent: true } });
		ChiaSDK.destroy();
		expect(() => ChiaSDK.getInstance()).toThrow();
	});

	it("create returns an independent instance", () => {
		const singleton = ChiaSDK.initialize({ env: { silent: true } });
		const independent = ChiaSDK.create({ env: { silent: true } });
		expect(independent).not.toBe(singleton);
		expect(independent).toBeInstanceOf(ChiaSDK);
	});
});
