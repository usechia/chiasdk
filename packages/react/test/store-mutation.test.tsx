import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useStoreMutation } from "../src/internal/hooks";

interface Receipt {
	paymentStatus: string;
}

describe("useStoreMutation", () => {
	it("exposes the resolved value and a success flag", async () => {
		const { result } = renderHook(() =>
			useStoreMutation<Receipt, { planId: string }>({
				mutationFn: async () => ({ paymentStatus: "success" }),
			}),
		);

		act(() => {
			result.current.mutate({ planId: "plan_1" });
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});
		expect(result.current.data).toEqual({ paymentStatus: "success" });
		expect(result.current.isPending).toBe(false);
	});

	it("reports isPending and the in-flight variables while running", async () => {
		let release: () => void = () => {};
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		const { result } = renderHook(() =>
			useStoreMutation<Receipt, { planId: string }>({
				mutationFn: () => gate.then(() => ({ paymentStatus: "success" })),
			}),
		);

		act(() => {
			result.current.mutate({ planId: "plan_2" });
		});

		await waitFor(() => {
			expect(result.current.isPending).toBe(true);
		});
		expect(result.current.variables).toEqual({ planId: "plan_2" });

		await act(async () => {
			release();
			await gate;
		});
		expect(result.current.isPending).toBe(false);
	});

	it("captures a rejection as error state without throwing", async () => {
		const boom = new Error("declined");
		const { result } = renderHook(() =>
			useStoreMutation<Receipt, void>({
				mutationFn: async () => {
					throw boom;
				},
			}),
		);

		act(() => {
			result.current.mutate();
		});

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});
		expect(result.current.error).toBe(boom);
		expect(result.current.isSuccess).toBe(false);
	});

	it("runs the hook-level and per-call onSuccess callbacks with the result", async () => {
		const seen: string[] = [];
		const { result } = renderHook(() =>
			useStoreMutation<Receipt, void>({
				mutationFn: async () => ({ paymentStatus: "success" }),
				onSuccess: (data) => seen.push(`hook:${data.paymentStatus}`),
			}),
		);

		act(() => {
			result.current.mutate(undefined, { onSuccess: (data) => seen.push(`call:${data.paymentStatus}`) });
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});
		expect(seen).toEqual(["hook:success", "call:success"]);
	});

	it("still runs the per-call callback when the hook-level one throws", async () => {
		let perCallRan = false;
		const { result } = renderHook(() =>
			useStoreMutation<Receipt, void>({
				mutationFn: async () => ({ paymentStatus: "success" }),
				onSuccess: () => {
					throw new Error("host callback blew up");
				},
			}),
		);

		act(() => {
			result.current.mutate(undefined, {
				onSuccess: () => {
					perCallRan = true;
				},
			});
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});
		expect(perCallRan).toBe(true);
	});

	it("keeps mutation state truthful when a callback throws", async () => {
		const { result } = renderHook(() =>
			useStoreMutation<Receipt, void>({
				mutationFn: async () => ({ paymentStatus: "success" }),
				onSuccess: () => {
					throw new Error("host callback blew up");
				},
			}),
		);

		act(() => {
			result.current.mutate();
		});

		await waitFor(() => {
			expect(result.current.isPending).toBe(false);
		});
		expect(result.current.isSuccess).toBe(true);
		expect(result.current.isError).toBe(false);
		expect(result.current.data).toEqual({ paymentStatus: "success" });
	});

	it("reports a throwing callback instead of discarding it", async () => {
		const reported = vi.spyOn(console, "error").mockImplementation(() => {});

		try {
			const { result } = renderHook(() =>
				useStoreMutation<Receipt, void>({
					mutationFn: async () => ({ paymentStatus: "success" }),
					onSuccess: () => {
						throw new Error("host callback blew up");
					},
				}),
			);

			act(() => {
				result.current.mutate();
			});

			await waitFor(() => {
				expect(reported).toHaveBeenCalled();
			});
			expect(String(reported.mock.calls[0])).toContain("host callback blew up");
		} finally {
			reported.mockRestore();
		}
	});
});
